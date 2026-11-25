import { createServerFn } from "@tanstack/react-start";

import {
  buildDarajaStkPushPayload,
  inspectDarajaConfig,
  type DarajaConfigStatus,
} from "@/lib/lending/daraja";
import { APP_FEE_KES } from "@/lib/pesapap-config";

/**
 * Server-side Safaricom Daraja integration boundary.
 *
 * - Reads environment flags solely on the server; credentials never enter browser bundles.
 * - Production live-money activation remains strictly disabled when production credentials
 *   and explicit live enablement are absent.
 */
export const getPaymentInfrastructureStatus = createServerFn({ method: "GET" }).handler(
  async (): Promise<DarajaConfigStatus> => {
    const serverEnv =
      typeof process !== "undefined" && process.env
        ? (process.env as Record<string, string | undefined>)
        : {};
    return inspectDarajaConfig(serverEnv);
  },
);

export interface StkArchitecturePreview {
  mode: "DEMO_SIMULATION";
  productionActivationEnabled: false;
  amountKes: number;
  normalizedPhoneMsisdn: string;
  accountReference: string;
  transactionType: "CustomerPayBillOnline";
  note: string;
}

export const previewDarajaStkArchitecture = createServerFn({ method: "POST" })
  .inputValidator((data: { phone: string; transactionReference: string }) => data)
  .handler(async ({ data }): Promise<StkArchitecturePreview> => {
    const preview = buildDarajaStkPushPayload({
      shortCode: "174379",
      passkey: "demo-sandbox-placeholder-not-live",
      callbackUrl: "https://demo.pesapap.invalid/api/daraja/stk-callback",
      phone: data.phone,
      transactionReference: data.transactionReference,
      amountKes: APP_FEE_KES,
    });

    return {
      mode: "DEMO_SIMULATION",
      productionActivationEnabled: false,
      amountKes: preview.Amount,
      normalizedPhoneMsisdn: preview.PhoneNumber,
      accountReference: preview.AccountReference,
      transactionType: preview.TransactionType,
      note: "Demonstration STK Push request structure only — production activation disabled and no real Safaricom call or money transfer executed.",
    };
  });
