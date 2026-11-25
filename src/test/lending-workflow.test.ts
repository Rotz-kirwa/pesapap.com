import { describe, expect, it } from "vitest";

import {
  evaluateRepaymentCapacity,
  preliminaryLoanRequestInputSchema,
} from "@/lib/lending/assessment";
import { LendingDomainError, LendingService } from "@/lib/lending/service";
import type { ActorContext, LoanApplicationInput } from "@/lib/lending/types";

const CALLBACK_SECRET = "test-verified-callback-secret";

const CUSTOMER_A: ActorContext = {
  userId: "cust-a",
  role: "customer",
  displayName: "Customer A",
};

const CUSTOMER_B: ActorContext = {
  userId: "cust-b",
  role: "customer",
  displayName: "Customer B",
};

const ADMIN: ActorContext = {
  userId: "admin-1",
  role: "admin",
  displayName: "Underwriting Admin",
};

function makeValidApplication(overrides: Partial<LoanApplicationInput> = {}): LoanApplicationInput {
  return {
    fullName: "Amina Wanjiku",
    nationalId: "31245678",
    phone: "+254 712 345 678",
    email: "amina@example.com",
    birthDate: "1994-06-15",
    location: "Nairobi",
    employmentStatus: "Employed",
    occupation: "Accountant",
    monthlyIncomeKes: 100_000,
    existingMonthlyObligationsKes: 5_000,
    employerName: "Rift Valley Logistics",
    incomeSource: "Salary",
    requestedAmountKes: 15_000,
    durationDays: 30,
    purpose: "Working capital",
    repaymentMethod: "M-Pesa",
    termsAccepted: true,
    ...overrides,
  };
}

function makeSuccessStkCallback(checkoutRequestId: string, receipt: string, amount = 100) {
  return {
    Body: {
      stkCallback: {
        MerchantRequestID: "MR-1001",
        CheckoutRequestID: checkoutRequestId,
        ResultCode: 0,
        ResultDesc: "The service request is processed successfully.",
        CallbackMetadata: {
          Item: [
            { Name: "Amount", Value: amount },
            { Name: "MpesaReceiptNumber", Value: receipt },
            { Name: "PhoneNumber", Value: "254712345678" },
          ],
        },
      },
    },
  };
}

describe("LendingService — Core Lending, Deposit, Refund & Security Invariants", () => {
  it("records preliminary requests separately without creating a full application or assessment", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    const request = service.submitPreliminaryRequest(CUSTOMER_A, {
      fullName: "Amina Wanjiku",
      nationalId: "31245678",
      phone: "+254 712 345 678",
      loanCategory: "Personal Support",
    });

    expect(request.status).toBe("AWAITING_FULL_APPLICATION");
    expect(request.loanCategory).toBe("Personal Support");
    expect(request.minimumAmountKes).toBe(10_000);
    expect(request.maximumAmountKes).toBe(20_000);
    expect(request.nationalIdLast4).toBe("5678");
    expect(request).not.toHaveProperty("nationalId");

    const dashboard = service.getAdminDashboard(ADMIN);
    expect(dashboard.preliminaryRequests).toEqual([request]);
    expect(dashboard.applications).toHaveLength(0);
    expect(dashboard.deposits).toHaveLength(0);
    expect(dashboard.auditLogs[0]?.action).toBe("PRELIMINARY_REQUEST_SUBMITTED");

    expect(
      preliminaryLoanRequestInputSchema.safeParse({
        fullName: "Brian Otieno",
        nationalId: "87654321",
        phone: "0712345678",
        loanCategory: "Unknown range",
      }).success,
    ).toBe(false);
  });

  it("submits valid loan application with realistic status and never guarantees approval", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    const { application, assessment } = service.submitApplication(
      CUSTOMER_A,
      makeValidApplication(),
    );

    expect(application.status).toBe("APPLICATION_SUBMITTED");
    expect(application.isDemoMode).toBe(true);
    expect(assessment.affordabilityBand).toBe("STRONG");
    expect(assessment.guaranteeDisclaimer).toContain("does not guarantee loan approval");
  });

  it("rejects invalid applicant information (underage, invalid phone, invalid ID, zero income, PIN submission)", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });

    expect(() =>
      service.submitApplication(CUSTOMER_A, makeValidApplication({ birthDate: "2015-01-01" })),
    ).toThrow(/at least 18 years old/i);

    expect(() =>
      service.submitApplication(CUSTOMER_A, makeValidApplication({ phone: "12345" })),
    ).toThrow(/Kenyan mobile number/i);

    expect(() =>
      service.submitApplication(CUSTOMER_A, makeValidApplication({ nationalId: "123" })),
    ).toThrow(/7 to 12 digits/i);

    expect(() =>
      service.submitApplication(CUSTOMER_A, makeValidApplication({ monthlyIncomeKes: 0 })),
    ).toThrow(/greater than zero/i);

    expect(() =>
      service.submitApplication(CUSTOMER_A, {
        ...makeValidApplication(),
        mpesaPin: "1234",
      }),
    ).toThrow(/M-Pesa PINs must never be collected/i);
  });

  it("evaluates repayment capacity realistically across strong, moderate, and high-risk profiles", () => {
    const strong = evaluateRepaymentCapacity(
      {
        monthlyIncomeKes: 100_000,
        existingMonthlyObligationsKes: 5_000,
        requestedAmountKes: 15_000,
        durationDays: 30,
        employmentStatus: "Employed",
      },
      "APP-1",
    );
    expect(strong.affordabilityBand).toBe("STRONG");
    expect(strong.recommendation).toBe("RECOMMENDED_FOR_REVIEW");

    const stretched = evaluateRepaymentCapacity(
      {
        monthlyIncomeKes: 20_000,
        existingMonthlyObligationsKes: 10_000,
        requestedAmountKes: 50_000,
        durationDays: 30,
        employmentStatus: "Self-employed",
      },
      "APP-2",
    );
    expect(stretched.affordabilityBand).toBe("STRETCHED");
    expect(stretched.recommendation).toBe("HIGH_RISK_DECLINE_RECOMMENDED");
  });

  it("prevents duplicate active loan applications for the same customer or National ID", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    service.submitApplication(CUSTOMER_A, makeValidApplication());

    expect(() =>
      service.submitApplication(CUSTOMER_A, makeValidApplication({ requestedAmountKes: 10_000 })),
    ).toThrow(/already exists/i);

    expect(() =>
      service.submitApplication(CUSTOMER_B, makeValidApplication({ nationalId: "31245678" })),
    ).toThrow(/already exists/i);
  });

  it("enforces exact KSh 100 deposit, blocks unverified review, verifies callbacks, and deduplicates repeat callbacks", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    const { application } = service.submitApplication(CUSTOMER_A, makeValidApplication());

    // Cannot enter review before payment is verified
    expect(() =>
      service.reviewApplication(ADMIN, {
        applicationId: application.id,
        decision: "APPROVED",
        notes: "Premature review",
      }),
    ).toThrow(/until the KSh 100 deposit is verified as PAID/i);

    // Rejects tampered deposit amount & PIN attempts
    expect(() =>
      service.initiateDeposit(CUSTOMER_A, {
        applicationId: application.id,
        mpesaPhone: "0712345678",
        amountKes: 500,
      }),
    ).toThrow(/exactly KSh 100/i);

    expect(() =>
      service.initiateDeposit(CUSTOMER_A, {
        applicationId: application.id,
        mpesaPhone: "0712345678",
        pin: "1234",
      }),
    ).toThrow(/M-Pesa PINs must never/i);

    const deposit = service.initiateDeposit(CUSTOMER_A, {
      applicationId: application.id,
      mpesaPhone: "0712345678",
    });
    expect(deposit.status).toBe("PENDING");
    expect(deposit.amountKes).toBe(100);

    // Prevents duplicate payment initiation
    expect(() =>
      service.initiateDeposit(CUSTOMER_A, {
        applicationId: application.id,
        mpesaPhone: "0712345678",
      }),
    ).toThrow(/already PENDING/i);

    // Rejects unverified / forged callback token
    expect(() =>
      service.processDepositCallback(
        "wrong-token",
        makeSuccessStkCallback(deposit.checkoutRequestId, "QWE123456"),
      ),
    ).toThrow(/invalid callback signature/i);

    // Verified callback transitions deposit -> PAID and application -> UNDER_REVIEW
    const first = service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(deposit.checkoutRequestId, "QWE123456"),
    );
    expect(first.duplicateIgnored).toBe(false);
    expect(first.deposit.status).toBe("PAID");
    expect(first.deposit.mpesaReceiptNumber).toBe("QWE123456");
    expect(first.application.status).toBe("UNDER_REVIEW");

    // Duplicate callback is idempotently ignored
    const duplicate = service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(deposit.checkoutRequestId, "QWE123456"),
    );
    expect(duplicate.duplicateIgnored).toBe(true);
    expect(duplicate.deposit.status).toBe("PAID");
  });

  it("automatically initiates full KSh 100 refund on BOTH approved and rejected decisions and only completes on confirmation", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });

    // Case 1: Approved application -> automatic refund initiated -> confirmed via callback
    const app1 = service.submitApplication(CUSTOMER_A, makeValidApplication()).application;
    const dep1 = service.initiateDeposit(CUSTOMER_A, {
      applicationId: app1.id,
      mpesaPhone: "0712345678",
    });
    service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(dep1.checkoutRequestId, "RCPT-APP1"),
    );

    const review1 = service.reviewApplication(ADMIN, {
      applicationId: app1.id,
      decision: "APPROVED",
      notes: "Approved after verification",
    });
    expect(review1.application.status).toBe("APPROVED");
    expect(review1.refund).toBeDefined();
    expect(review1.refund?.amountKes).toBe(100);
    // Must NEVER be marked COMPLETED before actual callback confirmation
    expect(review1.refund?.status).toBe("PROCESSING");
    expect(review1.refund?.completedAt).toBeUndefined();

    const confirmed1 = service.processRefundCallback(CALLBACK_SECRET, {
      callbackId: "ref-cb-1",
      refundReference: review1.refund!.refundReference,
      succeeded: true,
      mpesaRefundReceiptNumber: "B2C-REF-001",
    });
    expect(confirmed1.status).toBe("COMPLETED");
    expect(confirmed1.completedAt).toBeDefined();

    // Case 2: Rejected application -> ALSO automatically initiates full KSh 100 refund
    const app2 = service.submitApplication(
      CUSTOMER_B,
      makeValidApplication({ nationalId: "44556677", phone: "0722111222" }),
    ).application;
    const dep2 = service.initiateDeposit(CUSTOMER_B, {
      applicationId: app2.id,
      mpesaPhone: "0722111222",
    });
    service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(dep2.checkoutRequestId, "RCPT-APP2"),
    );

    const review2 = service.reviewApplication(ADMIN, {
      applicationId: app2.id,
      decision: "REJECTED",
      notes: "Declined on risk policy",
    });
    expect(review2.application.status).toBe("REJECTED");
    expect(review2.refund?.triggerReason).toBe("AUTO_ON_REJECTION");
    expect(review2.refund?.amountKes).toBe(100);
    expect(review2.refund?.status).toBe("PROCESSING");
  });

  it("handles failed refunds, admin retry, reconciliation, and audit logging", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    const app = service.submitApplication(CUSTOMER_A, makeValidApplication()).application;
    const dep = service.initiateDeposit(CUSTOMER_A, {
      applicationId: app.id,
      mpesaPhone: "0712345678",
    });
    service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(dep.checkoutRequestId, "RCPT-FAILREF"),
    );

    const { refund } = service.reviewApplication(ADMIN, {
      applicationId: app.id,
      decision: "REJECTED",
      notes: "Rejected",
    });

    const failed = service.processRefundCallback(CALLBACK_SECRET, {
      callbackId: "ref-fail-1",
      refundReference: refund!.refundReference,
      succeeded: false,
      failureReason: "Daraja B2C temporary timeout",
    });
    expect(failed.status).toBe("FAILED");

    const reconWithIssue = service.reconcileDeposit(ADMIN, dep.id);
    expect(reconWithIssue.isConsistent).toBe(false);
    expect(reconWithIssue.issues[0]).toContain("requires retry");

    const retried = service.retryFailedRefund(ADMIN, {
      refundId: failed.id,
      reason: "Retry after Daraja recovery",
    });
    expect(retried.status).toBe("PROCESSING");
    expect(retried.retryCount).toBe(1);

    const completed = service.processRefundCallback(CALLBACK_SECRET, {
      callbackId: "ref-ok-2",
      refundReference: retried.refundReference,
      succeeded: true,
      mpesaRefundReceiptNumber: "B2C-OK-2",
    });
    expect(completed.status).toBe("COMPLETED");

    const reconClean = service.reconcileDeposit(ADMIN, dep.id);
    expect(reconClean.isConsistent).toBe(true);
    expect(service.getAuditLogs(ADMIN).length).toBeGreaterThanOrEqual(7);
  });

  it("enforces strict administrative authorization so customers cannot manipulate approvals, payments, refunds, or view admin data", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    const app = service.submitApplication(CUSTOMER_A, makeValidApplication()).application;
    const dep = service.initiateDeposit(CUSTOMER_A, {
      applicationId: app.id,
      mpesaPhone: "0712345678",
    });

    // Customer B cannot initiate deposit on Customer A's application
    expect(() =>
      service.initiateDeposit(CUSTOMER_B, {
        applicationId: app.id,
        mpesaPhone: "0722000111",
      }),
    ).toThrow(LendingDomainError);

    // Customer cannot access admin dashboard or audit logs
    expect(() => service.getAdminDashboard(CUSTOMER_A)).toThrow(/Administrator authorization/i);
    expect(() => service.getAuditLogs(CUSTOMER_A)).toThrow(/Administrator authorization/i);

    service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(dep.checkoutRequestId, "RCPT-AUTH"),
    );

    // Customer cannot approve or reject their own loan
    expect(() =>
      service.reviewApplication(CUSTOMER_A, {
        applicationId: app.id,
        decision: "APPROVED",
        notes: "Self-approval attempt",
      }),
    ).toThrow(/Administrator authorization/i);

    // Customer cannot trigger manual refund or record disbursement
    expect(() =>
      service.initiateManualRefund(CUSTOMER_A, {
        depositId: dep.id,
        reason: "Unauthorized refund attempt",
      }),
    ).toThrow(/Administrator authorization/i);

    expect(() =>
      service.recordVerifiedDisbursement(CUSTOMER_A, {
        applicationId: app.id,
        providerReference: "FAKE-DISB",
        verified: true,
      }),
    ).toThrow(/Administrator authorization/i);

    // Customer B portfolio isolation
    expect(service.getCustomerPortfolio(CUSTOMER_B)).toHaveLength(0);
    expect(service.getCustomerPortfolio(CUSTOMER_A)).toHaveLength(1);
  });

  it("preserves disbursement record integrity — zero fabricated records and only VERIFIED approved disbursements exposed", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });
    // Initially empty — zero fabricated contacts
    expect(service.getVerifiedDisbursements()).toHaveLength(0);

    const app = service.submitApplication(CUSTOMER_A, makeValidApplication()).application;
    const dep = service.initiateDeposit(CUSTOMER_A, {
      applicationId: app.id,
      mpesaPhone: "0712345678",
    });
    service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(dep.checkoutRequestId, "RCPT-DISB"),
    );

    // Cannot disburse before approval
    expect(() =>
      service.recordVerifiedDisbursement(ADMIN, {
        applicationId: app.id,
        providerReference: "REF-PRE",
        verified: true,
      }),
    ).toThrow(/APPROVED loan applications/i);

    service.reviewApplication(ADMIN, {
      applicationId: app.id,
      decision: "APPROVED",
      notes: "Approved",
    });

    // Unverified disbursement is NOT returned in verified feed
    service.recordVerifiedDisbursement(ADMIN, {
      applicationId: app.id,
      providerReference: "REF-PENDING",
      verified: false,
    });
    expect(service.getVerifiedDisbursements()).toHaveLength(0);

    // Verified disbursement IS returned cleanly with masked phone
    service.recordVerifiedDisbursement(ADMIN, {
      applicationId: app.id,
      providerReference: "REF-VERIFIED-1",
      verified: true,
    });
    const verified = service.getVerifiedDisbursements();
    expect(verified).toHaveLength(1);
    expect(verified[0]?.maskedPhone).toBe("0712****78");
    expect(verified[0]?.status).toBe("VERIFIED");
  });

  it("completes the 14-step prototype demonstration journey including STK retry, admin decision, refund confirmation, and demo transaction history", () => {
    const service = new LendingService({ mode: "DEMO", callbackSecret: CALLBACK_SECRET });

    // Steps 2–4: Submit application & review capacity
    const { application } = service.submitApplication(CUSTOMER_A, makeValidApplication());
    expect(application.status).toBe("APPLICATION_SUBMITTED");

    // Steps 5–7: Initiate first KSh 100 Demo STK Push, then simulate cancelled/failed prompt
    const firstAttempt = service.initiateDeposit(CUSTOMER_A, {
      applicationId: application.id,
      mpesaPhone: "0712345678",
    });
    expect(firstAttempt.status).toBe("PENDING");

    const cancelled = service.processDepositCallback(CALLBACK_SECRET, {
      Body: {
        stkCallback: {
          MerchantRequestID: "MR-DEMO-CANCEL",
          CheckoutRequestID: firstAttempt.checkoutRequestId,
          ResultCode: 1032,
          ResultDesc: "Demo simulation: customer cancelled or dismissed STK prompt.",
        },
      },
    });
    expect(cancelled.deposit.status).toBe("FAILED");
    expect(cancelled.application.status).toBe("AWAITING_VERIFICATION");

    // Step 8–9: Retry Demo STK Push on the same application and confirm with DEMO-STK-* receipt
    const retryDeposit = service.initiateDeposit(CUSTOMER_A, {
      applicationId: application.id,
      mpesaPhone: "0712345678",
    });
    expect(retryDeposit.status).toBe("PENDING");

    const confirmedDeposit = service.processDepositCallback(
      CALLBACK_SECRET,
      makeSuccessStkCallback(retryDeposit.checkoutRequestId, "DEMO-STK-1002"),
    );
    expect(confirmedDeposit.deposit.status).toBe("PAID");
    expect(confirmedDeposit.deposit.mpesaReceiptNumber).toBe("DEMO-STK-1002");
    expect(confirmedDeposit.application.status).toBe("UNDER_REVIEW");

    // Step 10–13: Application appears in Admin review queue; Admin decides; automatic KSh 100 refund initiates
    const adminQueueBefore = service.getAdminDashboard(ADMIN);
    expect(adminQueueBefore.metrics.inReviewQueue).toBe(1);

    const decision = service.reviewApplication(ADMIN, {
      applicationId: application.id,
      decision: "APPROVED",
      notes: "Verified demo prototype review",
    });
    expect(decision.application.status).toBe("APPROVED");
    expect(decision.refund?.status).toBe("PROCESSING");
    expect(decision.refund?.amountKes).toBe(100);

    const confirmedRefund = service.processRefundCallback(CALLBACK_SECRET, {
      callbackId: "demo-ref-cb-1002",
      refundReference: decision.refund!.refundReference,
      succeeded: true,
      mpesaRefundReceiptNumber: "DEMO-REF-1003",
    });
    expect(confirmedRefund.status).toBe("COMPLETED");

    // Step 14: Customer dashboard portfolio exposes full demo transaction history
    const portfolio = service.getCustomerPortfolio(CUSTOMER_A);
    expect(portfolio).toHaveLength(1);

    const item = portfolio[0]!;
    expect(item.application.status).toBe("APPROVED");
    expect(item.deposit?.status).toBe("PAID");
    expect(item.refund?.status).toBe("COMPLETED");
    expect(item.repaymentSchedule).toHaveLength(1);

    const txTypes = item.transactionHistory.map((tx) => tx.type);
    expect(txTypes).toEqual([
      "REFUND_COMPLETED",
      "REFUND_INITIATED",
      "DEPOSIT_CONFIRMED",
      "DEPOSIT_STK_INITIATED",
      "DEPOSIT_FAILED",
      "DEPOSIT_STK_INITIATED",
    ]);
    expect(item.transactionHistory.every((tx) => tx.isDemoSimulation)).toBe(true);
  });
});
