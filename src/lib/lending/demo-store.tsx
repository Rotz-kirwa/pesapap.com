import { useSyncExternalStore } from "react";

import {
  LendingService,
  type AdminDashboardSnapshot,
  type CustomerPortfolioItem,
} from "@/lib/lending/service";
import type { ActorContext, DisbursementRecord } from "@/lib/lending/types";

/**
 * Browser-local DEMO MODE store backed by LendingService.
 *
 * Security notes:
 * - Runs strictly in DEMO mode (zero real M-Pesa charges, zero secret credentials).
 * - Preserves strict customer vs. admin role boundaries via separate ActorContext identities.
 * - Replaced by authenticated backend persistence (Supabase / PostgreSQL) once provisioned.
 */

export const DEMO_CUSTOMER_ACTOR: ActorContext = {
  userId: "demo-customer-01",
  role: "customer",
  displayName: "Demo Customer",
};

export const DEMO_ADMIN_ACTOR: ActorContext = {
  userId: "demo-admin-01",
  role: "admin",
  displayName: "Demo Underwriting Admin",
};

const DEMO_SANDBOX_CALLBACK_TOKEN = "demo-sandbox-callback-secret";

const demoLendingService = new LendingService({
  mode: "DEMO",
  callbackSecret: DEMO_SANDBOX_CALLBACK_TOKEN,
});

const listeners = new Set<() => void>();
let snapshotVersion = 0;

function emitChange() {
  snapshotVersion += 1;
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getVersion() {
  return snapshotVersion;
}

export function useDemoLendingStore() {
  useSyncExternalStore(subscribe, getVersion, getVersion);

  return {
    mode: demoLendingService.mode,
    customerActor: DEMO_CUSTOMER_ACTOR,
    adminActor: DEMO_ADMIN_ACTOR,

    submitCustomerApplication(input: Parameters<LendingService["submitApplication"]>[1]) {
      const result = demoLendingService.submitApplication(DEMO_CUSTOMER_ACTOR, input);
      emitChange();
      return result;
    },

    submitCustomerPreliminaryRequest(
      input: Parameters<LendingService["submitPreliminaryRequest"]>[1],
    ) {
      const result = demoLendingService.submitPreliminaryRequest(DEMO_CUSTOMER_ACTOR, input);
      emitChange();
      return result;
    },

    initiateCustomerDeposit(params: { applicationId: string; mpesaPhone: string }) {
      const result = demoLendingService.initiateDeposit(DEMO_CUSTOMER_ACTOR, params);
      emitChange();
      return result;
    },

    /**
     * Admin-sandbox-only callback simulator to exercise verified Daraja callback handling
     * and idempotency in DEMO MODE without ever claiming a real M-Pesa payment.
     */
    simulateDemoDepositCallback(params: {
      checkoutRequestId: string;
      succeeded: boolean;
      mpesaReceiptNumber?: string;
      failureReason?: string;
    }) {
      const receipt = params.mpesaReceiptNumber ?? `DEMO-STK-${String(Date.now()).slice(-6)}`;
      const result = demoLendingService.processDepositCallback(DEMO_SANDBOX_CALLBACK_TOKEN, {
        Body: {
          stkCallback: {
            MerchantRequestID: `DEMO-MR-${params.checkoutRequestId}`,
            CheckoutRequestID: params.checkoutRequestId,
            ResultCode: params.succeeded ? 0 : 1032,
            ResultDesc: params.succeeded
              ? "DEMO simulation: STK Push confirmed in demonstration environment (no real money transferred)."
              : (params.failureReason ?? "DEMO simulation: STK prompt cancelled by user."),
            ...(params.succeeded
              ? {
                  CallbackMetadata: {
                    Item: [
                      { Name: "Amount", Value: 100 },
                      { Name: "MpesaReceiptNumber", Value: receipt },
                    ],
                  },
                }
              : {}),
          },
        },
      });
      emitChange();
      return result;
    },

    adminReviewApplication(params: {
      applicationId: string;
      decision: "APPROVED" | "REJECTED" | "ADDITIONAL_INFO_REQUIRED";
      notes: string;
    }) {
      const result = demoLendingService.reviewApplication(DEMO_ADMIN_ACTOR, params);
      emitChange();
      return result;
    },

    simulateDemoRefundCallback(params: {
      refundReference: string;
      succeeded: boolean;
      failureReason?: string;
    }) {
      const result = demoLendingService.processRefundCallback(DEMO_SANDBOX_CALLBACK_TOKEN, {
        callbackId: `DEMO-REF-CB-${params.refundReference}-${Date.now()}`,
        refundReference: params.refundReference,
        succeeded: params.succeeded,
        ...(params.succeeded
          ? { mpesaRefundReceiptNumber: `DEMO-REF-${String(Date.now()).slice(-6)}` }
          : { failureReason: params.failureReason ?? "DEMO simulation: Provider timeout" }),
      });
      emitChange();
      return result;
    },

    adminInitiateManualRefund(params: { depositId: string; reason: string }) {
      const result = demoLendingService.initiateManualRefund(DEMO_ADMIN_ACTOR, params);
      emitChange();
      return result;
    },

    adminRetryFailedRefund(params: { refundId: string; reason: string }) {
      const result = demoLendingService.retryFailedRefund(DEMO_ADMIN_ACTOR, params);
      emitChange();
      return result;
    },

    adminReconcileDeposit(depositId: string) {
      const result = demoLendingService.reconcileDeposit(DEMO_ADMIN_ACTOR, depositId);
      emitChange();
      return result;
    },

    adminRecordVerifiedDisbursement(params: {
      applicationId: string;
      providerReference: string;
      verified: boolean;
    }) {
      const result = demoLendingService.recordVerifiedDisbursement(DEMO_ADMIN_ACTOR, params);
      emitChange();
      return result;
    },

    getCustomerPortfolio(): CustomerPortfolioItem[] {
      return demoLendingService.getCustomerPortfolio(DEMO_CUSTOMER_ACTOR);
    },

    getAdminDashboard(): AdminDashboardSnapshot {
      return demoLendingService.getAdminDashboard(DEMO_ADMIN_ACTOR);
    },

    getVerifiedDisbursements(): DisbursementRecord[] {
      return demoLendingService.getVerifiedDisbursements();
    },
  };
}
