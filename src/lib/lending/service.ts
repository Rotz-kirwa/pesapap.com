import {
  ELIGIBILITY_PRECHECK_TIERS,
  APP_FEE_KES,
  estimateRepayment,
  maskKenyanPhone,
  normalizeKenyanPhone,
} from "@/lib/pesapap-config";
import {
  evaluateRepaymentCapacity,
  loanApplicationInputSchema,
  preliminaryLoanRequestInputSchema,
} from "@/lib/lending/assessment";
import {
  parseDarajaStkCallback,
  verifyCallbackToken,
  type DarajaStkCallbackRaw,
} from "@/lib/lending/daraja";
import type {
  ActorContext,
  AssessmentRecord,
  AuditLogEntry,
  DepositPaymentRecord,
  DisbursementRecord,
  LoanApplication,
  LoanApplicationInput,
  LoanApplicationStatus,
  PreliminaryLoanRequest,
  PreliminaryLoanRequestInput,
  ReconciliationResult,
  RefundRecord,
  RepaymentInstallment,
  TransactionHistoryEntry,
} from "@/lib/lending/types";

export class LendingDomainError extends Error {
  readonly code:
    | "VALIDATION_ERROR"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "DUPLICATE_APPLICATION"
    | "DUPLICATE_PAYMENT"
    | "NOT_FOUND"
    | "INVALID_STATE"
    | "SECURITY_VIOLATION";

  constructor(code: LendingDomainError["code"], message: string) {
    super(message);
    this.name = "LendingDomainError";
    this.code = code;
  }
}

const ACTIVE_APPLICATION_STATUSES: ReadonlySet<LoanApplicationStatus> = new Set([
  "APPLICATION_SUBMITTED",
  "AWAITING_VERIFICATION",
  "UNDER_REVIEW",
  "ADDITIONAL_INFO_REQUIRED",
]);

function hashIdentifier(value: string): string {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `nid_${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export interface RefundCallbackPayload {
  callbackId: string;
  refundReference: string;
  succeeded: boolean;
  mpesaRefundReceiptNumber?: string;
  failureReason?: string;
}

export interface CustomerPortfolioItem {
  application: LoanApplication;
  assessment: AssessmentRecord;
  deposit?: DepositPaymentRecord;
  refund?: RefundRecord;
  disbursement?: DisbursementRecord;
  repaymentSchedule: RepaymentInstallment[];
  transactionHistory: TransactionHistoryEntry[];
}

export interface AdminDashboardSnapshot {
  preliminaryRequests: PreliminaryLoanRequest[];
  applications: CustomerPortfolioItem[];
  deposits: DepositPaymentRecord[];
  refunds: RefundRecord[];
  disbursements: DisbursementRecord[];
  auditLogs: AuditLogEntry[];
  metrics: {
    totalApplications: number;
    inReviewQueue: number;
    paidDepositsCount: number;
    pendingDepositsCount: number;
    failedDepositsCount: number;
    pendingOrProcessingRefundsCount: number;
    completedRefundsCount: number;
    failedRefundsCount: number;
    verifiedDisbursementsCount: number;
  };
}

export interface LendingServiceOptions {
  mode?: "DEMO" | "LIVE";
  callbackSecret?: string;
}

/**
 * Core lending domain engine with strict RBAC, idempotency, audit logging,
 * automatic KSh 100 deposit refund orchestration, and verified disbursement integrity.
 */
export class LendingService {
  readonly mode: "DEMO" | "LIVE";
  private readonly callbackSecret: string;
  private sequence = 1000;

  private readonly applications = new Map<string, LoanApplication>();
  private readonly preliminaryRequests = new Map<string, PreliminaryLoanRequest>();
  private readonly assessments = new Map<string, AssessmentRecord>();
  private readonly deposits = new Map<string, DepositPaymentRecord>();
  private readonly depositsByApplication = new Map<string, string>();
  private readonly depositsByCheckout = new Map<string, string>();
  private readonly usedMpesaReceipts = new Set<string>();
  private readonly refunds = new Map<string, RefundRecord>();
  private readonly refundsByDeposit = new Map<string, string>();
  private readonly refundsByReference = new Map<string, string>();
  private readonly disbursements = new Map<string, DisbursementRecord>();
  private readonly disbursementsByApplication = new Map<string, string>();
  private readonly schedules = new Map<string, RepaymentInstallment[]>();
  private readonly transactionHistory = new Map<string, TransactionHistoryEntry[]>();
  private readonly auditLogs: AuditLogEntry[] = [];

  constructor(options: LendingServiceOptions = {}) {
    this.mode = options.mode ?? "DEMO";
    this.callbackSecret = options.callbackSecret ?? "demo-sandbox-callback-secret";
  }

  private nextId(prefix: string): string {
    this.sequence += 1;
    return `${prefix}-${this.sequence}`;
  }

  submitPreliminaryRequest(
    actor: ActorContext,
    rawInput: PreliminaryLoanRequestInput,
  ): PreliminaryLoanRequest {
    if (actor.role !== "customer") {
      throw new LendingDomainError(
        "FORBIDDEN",
        "Only customers can submit preliminary loan requests.",
      );
    }

    const parsed = preliminaryLoanRequestInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      throw new LendingDomainError(
        "VALIDATION_ERROR",
        parsed.error.issues[0]?.message ?? "Invalid preliminary request details.",
      );
    }

    const input = parsed.data;
    const selectedTier = ELIGIBILITY_PRECHECK_TIERS.find(
      (tier) => tier.name === input.loanCategory,
    );
    if (!selectedTier) {
      throw new LendingDomainError("VALIDATION_ERROR", "Select one of the available loan ranges.");
    }

    const normalizedPhone = normalizeKenyanPhone(input.phone);
    if (!normalizedPhone) {
      throw new LendingDomainError("VALIDATION_ERROR", "Enter a valid Kenyan mobile number.");
    }

    const nationalIdHash = hashIdentifier(input.nationalId);
    const hasExistingRequest = [...this.preliminaryRequests.values()].some(
      (request) => request.nationalIdHash === nationalIdHash,
    );
    const hasActiveApplication = [...this.applications.values()].some(
      (application) =>
        application.nationalIdHash === nationalIdHash &&
        ACTIVE_APPLICATION_STATUSES.has(application.status),
    );
    if (hasExistingRequest || hasActiveApplication) {
      throw new LendingDomainError(
        "DUPLICATE_APPLICATION",
        "An active request already exists for this National ID.",
      );
    }

    const request: PreliminaryLoanRequest = {
      id: this.nextId("PP-REQ"),
      applicantUserId: actor.userId,
      applicantName: input.fullName,
      nationalIdHash,
      nationalIdLast4: input.nationalId.slice(-4),
      phoneMsisdn: normalizedPhone,
      loanCategory: selectedTier.name,
      minimumAmountKes: selectedTier.minimumKes,
      maximumAmountKes: selectedTier.maximumKes,
      status: "AWAITING_FULL_APPLICATION",
      createdAt: new Date().toISOString(),
    };

    this.preliminaryRequests.set(request.id, request);
    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "PRELIMINARY_REQUEST_SUBMITTED",
      entityType: "preliminary_request",
      entityId: request.id,
      summary: `Preliminary loan request recorded for ${request.loanCategory}.`,
      metadata: {
        loanCategory: request.loanCategory,
        minimumAmountKes: request.minimumAmountKes,
        maximumAmountKes: request.maximumAmountKes,
        nationalIdLast4: request.nationalIdLast4,
      },
    });

    return { ...request };
  }

  private assertAdmin(actor: ActorContext, actionDescription: string): void {
    if (actor.role !== "admin") {
      throw new LendingDomainError(
        "FORBIDDEN",
        `Administrator authorization is required to ${actionDescription}.`,
      );
    }
  }

  private assertCallbackAuthorized(callbackToken: string | undefined): void {
    if (!verifyCallbackToken(callbackToken, this.callbackSecret)) {
      throw new LendingDomainError(
        "UNAUTHORIZED",
        "Unverified payment/refund callback rejected: invalid callback signature or token.",
      );
    }
  }

  private appendAudit(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
    this.auditLogs.unshift({
      id: this.nextId("PP-AUD"),
      timestamp: new Date().toISOString(),
      ...entry,
    });
  }

  private appendTransaction(
    entry: Omit<TransactionHistoryEntry, "id" | "timestamp" | "isDemoSimulation">,
    nowIso: string = new Date().toISOString(),
  ): void {
    const existing = this.transactionHistory.get(entry.applicationId) ?? [];
    existing.unshift({
      id: this.nextId("PP-TXN"),
      timestamp: nowIso,
      isDemoSimulation: this.mode === "DEMO",
      ...entry,
    });
    this.transactionHistory.set(entry.applicationId, existing);
  }

  submitApplication(
    actor: ActorContext,
    rawInput: LoanApplicationInput & { pin?: unknown; mpesaPin?: unknown; mpesa_pin?: unknown },
  ): { application: LoanApplication; assessment: AssessmentRecord } {
    if (
      rawInput.pin !== undefined ||
      rawInput.mpesaPin !== undefined ||
      rawInput.mpesa_pin !== undefined
    ) {
      throw new LendingDomainError(
        "SECURITY_VIOLATION",
        "M-Pesa PINs must never be collected or submitted.",
      );
    }

    const parsed = loanApplicationInputSchema.safeParse(rawInput);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0]?.message ?? "Invalid application details.";
      throw new LendingDomainError("VALIDATION_ERROR", firstIssue);
    }

    const input = parsed.data;
    const normalizedPhone = normalizeKenyanPhone(input.phone);
    if (!normalizedPhone) {
      throw new LendingDomainError("VALIDATION_ERROR", "Enter a valid Kenyan mobile number.");
    }

    const nationalIdHash = hashIdentifier(input.nationalId);

    for (const existing of this.applications.values()) {
      const sameApplicant =
        existing.applicantUserId === actor.userId || existing.nationalIdHash === nationalIdHash;
      if (sameApplicant && ACTIVE_APPLICATION_STATUSES.has(existing.status)) {
        throw new LendingDomainError(
          "DUPLICATE_APPLICATION",
          `An active loan application (${existing.id}) already exists and must be completed before submitting another.`,
        );
      }
    }

    const nowIso = new Date().toISOString();
    const applicationId = this.nextId("PP-APP");

    const application: LoanApplication = {
      id: applicationId,
      applicantUserId: actor.userId,
      applicantName: input.fullName,
      nationalIdHash,
      nationalIdLast4: input.nationalId.slice(-4),
      phoneMsisdn: normalizedPhone,
      email: input.email,
      birthDate: input.birthDate,
      location: input.location,
      employmentStatus: input.employmentStatus,
      occupation: input.occupation,
      monthlyIncomeKes: input.monthlyIncomeKes,
      existingMonthlyObligationsKes: input.existingMonthlyObligationsKes,
      employerName: input.employerName,
      incomeSource: input.incomeSource,
      requestedAmountKes: input.requestedAmountKes,
      durationDays: input.durationDays,
      purpose: input.purpose,
      repaymentMethod: input.repaymentMethod,
      status: "APPLICATION_SUBMITTED",
      createdAt: nowIso,
      updatedAt: nowIso,
      isDemoMode: this.mode === "DEMO",
    };

    const assessment = evaluateRepaymentCapacity(
      {
        monthlyIncomeKes: input.monthlyIncomeKes,
        existingMonthlyObligationsKes: input.existingMonthlyObligationsKes,
        requestedAmountKes: input.requestedAmountKes,
        durationDays: input.durationDays,
        employmentStatus: input.employmentStatus,
      },
      applicationId,
      nowIso,
    );

    this.applications.set(applicationId, application);
    this.assessments.set(applicationId, assessment);

    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "APPLICATION_SUBMITTED",
      entityType: "application",
      entityId: applicationId,
      summary: `Loan application submitted for ${input.requestedAmountKes} KSh (${input.durationDays} days).`,
      metadata: {
        requestedAmountKes: input.requestedAmountKes,
        durationDays: input.durationDays,
        isDemoMode: this.mode === "DEMO",
      },
    });

    this.appendAudit({
      actorId: "underwriting-engine",
      actorRole: "system_callback",
      action: "ASSESSMENT_RECORDED",
      entityType: "application",
      entityId: applicationId,
      summary: `Capacity assessment recorded (${assessment.affordabilityBand}, ratio ${Math.round(assessment.repaymentToIncomeRatio * 100)}%).`,
      metadata: {
        affordabilityBand: assessment.affordabilityBand,
        recommendation: assessment.recommendation,
      },
    });

    return { application: { ...application }, assessment: { ...assessment } };
  }

  initiateDeposit(
    actor: ActorContext,
    params: {
      applicationId: string;
      mpesaPhone: string;
      amountKes?: number;
      pin?: string;
      mpesaPin?: string;
    },
  ): DepositPaymentRecord {
    if (params.pin !== undefined || params.mpesaPin !== undefined) {
      throw new LendingDomainError(
        "SECURITY_VIOLATION",
        "M-Pesa PINs must never be collected, transmitted, or stored.",
      );
    }

    if (params.amountKes !== undefined && params.amountKes !== APP_FEE_KES) {
      throw new LendingDomainError(
        "VALIDATION_ERROR",
        `Application processing deposit must be exactly KSh ${APP_FEE_KES}.`,
      );
    }

    const application = this.applications.get(params.applicationId);
    if (!application) {
      throw new LendingDomainError("NOT_FOUND", "Loan application not found.");
    }

    if (actor.role !== "admin" && application.applicantUserId !== actor.userId) {
      throw new LendingDomainError(
        "FORBIDDEN",
        "You can only initiate deposits for your own loan application.",
      );
    }

    const existingDepositId = this.depositsByApplication.get(application.id);
    if (existingDepositId) {
      const existing = this.deposits.get(existingDepositId);
      if (existing && (existing.status === "PENDING" || existing.status === "PAID")) {
        throw new LendingDomainError(
          "DUPLICATE_PAYMENT",
          `A deposit (${existing.transactionReference}) is already ${existing.status} for this application.`,
        );
      }
    }

    const normalizedMsisdn = normalizeKenyanPhone(params.mpesaPhone);
    if (!normalizedMsisdn) {
      throw new LendingDomainError("VALIDATION_ERROR", "Enter a valid Kenyan M-Pesa phone number.");
    }

    const nowIso = new Date().toISOString();
    const depositId = this.nextId("PP-DEP");
    const checkoutRequestId = `ws_CO_${depositId.replace(/[^A-Z0-9]/gi, "")}`;

    const deposit: DepositPaymentRecord = {
      id: depositId,
      applicationId: application.id,
      applicantUserId: application.applicantUserId,
      amountKes: APP_FEE_KES,
      refundableAmountKes: APP_FEE_KES,
      paymentMethod: "M-Pesa",
      phoneMsisdn: normalizedMsisdn,
      transactionReference: depositId,
      checkoutRequestId,
      status: "PENDING",
      initiatedAt: nowIso,
      updatedAt: nowIso,
      isDemoMode: this.mode === "DEMO",
      processedCallbackIds: [],
    };

    this.deposits.set(depositId, deposit);
    this.depositsByApplication.set(application.id, depositId);
    this.depositsByCheckout.set(checkoutRequestId, depositId);

    application.status = "AWAITING_VERIFICATION";
    application.updatedAt = nowIso;

    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "DEPOSIT_INITIATED",
      entityType: "deposit",
      entityId: depositId,
      summary: `KSh ${APP_FEE_KES} refundable deposit initiated (${this.mode} mode) for ${application.id}.`,
      metadata: {
        applicationId: application.id,
        amountKes: APP_FEE_KES,
        isDemoMode: this.mode === "DEMO",
      },
    });

    this.appendTransaction(
      {
        applicationId: application.id,
        type: "DEPOSIT_STK_INITIATED",
        amountKes: APP_FEE_KES,
        reference: depositId,
        status: "PENDING",
        description: `STK Push request initiated (${this.mode} mode) to ${maskKenyanPhone(normalizedMsisdn)}.`,
      },
      nowIso,
    );

    return { ...deposit, processedCallbackIds: [...deposit.processedCallbackIds] };
  }

  /**
   * Processes a backend-verified Safaricom Daraja STK Push callback.
   * Never callable by a customer actor without the server callback secret.
   */
  processDepositCallback(
    callbackToken: string | undefined,
    rawCallback: DarajaStkCallbackRaw,
  ): { deposit: DepositPaymentRecord; application: LoanApplication; duplicateIgnored: boolean } {
    this.assertCallbackAuthorized(callbackToken);

    const parsed = parseDarajaStkCallback(rawCallback);
    const depositId = this.depositsByCheckout.get(parsed.checkoutRequestId);
    if (!depositId) {
      throw new LendingDomainError(
        "NOT_FOUND",
        `No deposit matches CheckoutRequestID ${parsed.checkoutRequestId}.`,
      );
    }

    const deposit = this.deposits.get(depositId);
    const application = deposit ? this.applications.get(deposit.applicationId) : undefined;
    if (!deposit || !application) {
      throw new LendingDomainError("NOT_FOUND", "Deposit or linked application not found.");
    }

    if (
      deposit.processedCallbackIds.includes(parsed.callbackId) ||
      deposit.status === "PAID" ||
      (parsed.mpesaReceiptNumber && this.usedMpesaReceipts.has(parsed.mpesaReceiptNumber))
    ) {
      this.appendAudit({
        actorId: "daraja-callback",
        actorRole: "system_callback",
        action: "DEPOSIT_CALLBACK_DUPLICATE_IGNORED",
        entityType: "deposit",
        entityId: deposit.id,
        summary: `Duplicate deposit callback ignored for ${deposit.transactionReference}.`,
      });
      return {
        deposit: { ...deposit, processedCallbackIds: [...deposit.processedCallbackIds] },
        application: { ...application },
        duplicateIgnored: true,
      };
    }

    const nowIso = new Date().toISOString();
    deposit.processedCallbackIds.push(parsed.callbackId);
    deposit.updatedAt = nowIso;

    if (parsed.succeeded && parsed.mpesaReceiptNumber) {
      deposit.status = "PAID";
      deposit.mpesaReceiptNumber = parsed.mpesaReceiptNumber;
      deposit.paidAt = nowIso;
      deposit.receiptIssuedAt = nowIso;
      delete deposit.failureReason;
      this.usedMpesaReceipts.add(parsed.mpesaReceiptNumber);

      application.status = "UNDER_REVIEW";
      application.updatedAt = nowIso;

      this.appendAudit({
        actorId: "daraja-callback",
        actorRole: "system_callback",
        action: "DEPOSIT_CALLBACK_VERIFIED",
        entityType: "deposit",
        entityId: deposit.id,
        summary: `Deposit ${deposit.transactionReference} verified as PAID (${parsed.mpesaReceiptNumber}); application ${application.id} queued for UNDER REVIEW.`,
        metadata: {
          applicationId: application.id,
          amountKes: APP_FEE_KES,
          mpesaReceiptNumber: parsed.mpesaReceiptNumber,
        },
      });

      this.appendTransaction(
        {
          applicationId: application.id,
          type: "DEPOSIT_CONFIRMED",
          amountKes: APP_FEE_KES,
          reference: parsed.mpesaReceiptNumber,
          status: "PAID",
          description: `Deposit confirmed (${this.mode} mode); application queued for review.`,
        },
        nowIso,
      );
    } else {
      deposit.status = "FAILED";
      deposit.failureReason =
        parsed.amountKes !== undefined && parsed.amountKes !== APP_FEE_KES
          ? `Amount mismatch: expected KSh ${APP_FEE_KES}, received KSh ${parsed.amountKes}.`
          : parsed.resultDesc;

      this.appendAudit({
        actorId: "daraja-callback",
        actorRole: "system_callback",
        action: "DEPOSIT_FAILED",
        entityType: "deposit",
        entityId: deposit.id,
        summary: `Deposit ${deposit.transactionReference} failed verification: ${deposit.failureReason}`,
      });

      this.appendTransaction(
        {
          applicationId: application.id,
          type: "DEPOSIT_FAILED",
          amountKes: APP_FEE_KES,
          reference: deposit.transactionReference,
          status: "FAILED",
          description: `Deposit attempt failed: ${deposit.failureReason}`,
        },
        nowIso,
      );
    }

    return {
      deposit: { ...deposit, processedCallbackIds: [...deposit.processedCallbackIds] },
      application: { ...application },
      duplicateIgnored: false,
    };
  }

  /**
   * Administrator underwriting decision.
   * Requires verified PAID deposit before entering review/decision.
   * Automatically initiates full KSh 100 refund on APPROVED or REJECTED decisions.
   */
  reviewApplication(
    actor: ActorContext,
    params: {
      applicationId: string;
      decision: "APPROVED" | "REJECTED" | "ADDITIONAL_INFO_REQUIRED";
      notes: string;
    },
  ): { application: LoanApplication; refund?: RefundRecord } {
    this.assertAdmin(actor, "review or decide loan applications");

    const application = this.applications.get(params.applicationId);
    if (!application) {
      throw new LendingDomainError("NOT_FOUND", "Loan application not found.");
    }

    const depositId = this.depositsByApplication.get(application.id);
    const deposit = depositId ? this.deposits.get(depositId) : undefined;
    if (!deposit || deposit.status !== "PAID") {
      throw new LendingDomainError(
        "INVALID_STATE",
        "Application cannot proceed to review or decision until the KSh 100 deposit is verified as PAID.",
      );
    }

    if (application.status === "APPROVED" || application.status === "REJECTED") {
      throw new LendingDomainError(
        "INVALID_STATE",
        `Application ${application.id} already has a final decision (${application.status}).`,
      );
    }

    const nowIso = new Date().toISOString();
    application.status = params.decision;
    application.reviewNotes =
      params.notes.trim() || `Marked ${params.decision} by ${actor.displayName}`;
    application.reviewedByAdminId = actor.userId;
    application.reviewedAt = nowIso;
    application.updatedAt = nowIso;

    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "APPLICATION_STATUS_UPDATED",
      entityType: "application",
      entityId: application.id,
      summary: `Application ${application.id} updated to ${params.decision} by ${actor.displayName}.`,
      metadata: { decision: params.decision },
    });

    if (params.decision === "APPROVED") {
      this.createRepaymentSchedule(application);
    }

    let refund: RefundRecord | undefined;
    if (params.decision === "APPROVED" || params.decision === "REJECTED") {
      refund = this.createOrGetAutomaticRefund(
        deposit,
        application,
        params.decision === "APPROVED" ? "AUTO_ON_APPROVAL" : "AUTO_ON_REJECTION",
        actor.userId,
      );
    }

    return {
      application: { ...application },
      ...(refund ? { refund: { ...refund } } : {}),
    };
  }

  private createRepaymentSchedule(application: LoanApplication): void {
    const estimate = estimateRepayment(application.requestedAmountKes, application.durationDays);
    const dueDate = new Date(Date.now() + application.durationDays * 86_400_000)
      .toISOString()
      .slice(0, 10);

    const schedule: RepaymentInstallment[] = [
      {
        id: this.nextId("PP-SCH"),
        applicationId: application.id,
        installmentNumber: 1,
        dueDate,
        principalKes: estimate.principalKes,
        interestKes: estimate.interestKes,
        totalDueKes: estimate.totalKes,
        status: "SCHEDULED",
      },
    ];
    this.schedules.set(application.id, schedule);
  }

  private createOrGetAutomaticRefund(
    deposit: DepositPaymentRecord,
    application: LoanApplication,
    triggerReason: RefundRecord["triggerReason"],
    initiatedBy: string,
  ): RefundRecord {
    const existingRefundId = this.refundsByDeposit.get(deposit.id);
    if (existingRefundId) {
      const existing = this.refunds.get(existingRefundId);
      if (existing) return existing;
    }

    const nowIso = new Date().toISOString();
    const refundId = this.nextId("PP-REF");

    const refund: RefundRecord = {
      id: refundId,
      depositId: deposit.id,
      applicationId: application.id,
      applicantUserId: application.applicantUserId,
      amountKes: APP_FEE_KES,
      destinationMsisdn: deposit.phoneMsisdn,
      refundReference: refundId,
      providerConversationId: `AG_B2C_${refundId.replace(/[^A-Z0-9]/gi, "")}`,
      status: "PROCESSING",
      triggerReason,
      retryCount: 0,
      initiatedBy,
      initiatedAt: nowIso,
      updatedAt: nowIso,
      isDemoMode: this.mode === "DEMO",
    };

    this.refunds.set(refundId, refund);
    this.refundsByDeposit.set(deposit.id, refundId);
    this.refundsByReference.set(refund.refundReference, refundId);

    this.appendAudit({
      actorId: initiatedBy,
      actorRole: triggerReason === "MANUAL_ADMIN_INITIATED" ? "admin" : "system_callback",
      action: "REFUND_INITIATED",
      entityType: "refund",
      entityId: refundId,
      summary: `Automatic KSh ${APP_FEE_KES} deposit refund (${refundId}) initiated to ${maskKenyanPhone(deposit.phoneMsisdn)} (${triggerReason}). Awaiting provider confirmation.`,
      metadata: {
        depositId: deposit.id,
        applicationId: application.id,
        amountKes: APP_FEE_KES,
      },
    });

    this.appendTransaction(
      {
        applicationId: application.id,
        type: "REFUND_INITIATED",
        amountKes: APP_FEE_KES,
        reference: refundId,
        status: "PROCESSING",
        description: `100% refundable deposit return initiated to ${maskKenyanPhone(deposit.phoneMsisdn)} (${triggerReason}).`,
      },
      nowIso,
    );

    return refund;
  }

  initiateManualRefund(
    actor: ActorContext,
    params: { depositId: string; reason: string },
  ): RefundRecord {
    this.assertAdmin(actor, "initiate manual deposit refunds");

    const deposit = this.deposits.get(params.depositId);
    if (!deposit) {
      throw new LendingDomainError("NOT_FOUND", "Deposit record not found.");
    }
    if (deposit.status !== "PAID") {
      throw new LendingDomainError("INVALID_STATE", "Only verified PAID deposits can be refunded.");
    }

    const application = this.applications.get(deposit.applicationId);
    if (!application) {
      throw new LendingDomainError("NOT_FOUND", "Linked application not found.");
    }

    const existingId = this.refundsByDeposit.get(deposit.id);
    if (existingId) {
      const existing = this.refunds.get(existingId);
      if (existing && (existing.status === "PROCESSING" || existing.status === "COMPLETED")) {
        throw new LendingDomainError(
          "INVALID_STATE",
          `Refund ${existing.refundReference} is already ${existing.status}.`,
        );
      }
      if (existing && existing.status === "FAILED") {
        return this.retryFailedRefund(actor, { refundId: existing.id, reason: params.reason });
      }
    }

    return {
      ...this.createOrGetAutomaticRefund(
        deposit,
        application,
        "MANUAL_ADMIN_INITIATED",
        actor.userId,
      ),
    };
  }

  retryFailedRefund(
    actor: ActorContext,
    params: { refundId: string; reason: string },
  ): RefundRecord {
    this.assertAdmin(actor, "retry failed refunds");

    const refund = this.refunds.get(params.refundId);
    if (!refund) {
      throw new LendingDomainError("NOT_FOUND", "Refund record not found.");
    }
    if (refund.status !== "FAILED") {
      throw new LendingDomainError("INVALID_STATE", "Only FAILED refunds can be retried.");
    }

    const nowIso = new Date().toISOString();
    refund.status = "PROCESSING";
    refund.retryCount += 1;
    delete refund.failureReason;
    refund.updatedAt = nowIso;

    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "REFUND_RETRIED",
      entityType: "refund",
      entityId: refund.id,
      summary: `Refund ${refund.refundReference} retry #${refund.retryCount} initiated by ${actor.displayName}: ${params.reason}`,
      metadata: { retryCount: refund.retryCount },
    });

    return { ...refund };
  }

  /**
   * Confirms or fails a refund strictly via verified backend callback / reconciliation.
   * Never marks a refund COMPLETED before provider confirmation.
   */
  processRefundCallback(
    callbackToken: string | undefined,
    payload: RefundCallbackPayload,
  ): RefundRecord {
    this.assertCallbackAuthorized(callbackToken);

    const refundId = this.refundsByReference.get(payload.refundReference);
    if (!refundId) {
      throw new LendingDomainError("NOT_FOUND", `Refund ${payload.refundReference} not found.`);
    }

    const refund = this.refunds.get(refundId);
    if (!refund) {
      throw new LendingDomainError("NOT_FOUND", "Refund record not found.");
    }

    if (refund.status === "COMPLETED") {
      return { ...refund };
    }

    const nowIso = new Date().toISOString();
    refund.updatedAt = nowIso;

    if (payload.succeeded && payload.mpesaRefundReceiptNumber) {
      refund.status = "COMPLETED";
      refund.mpesaRefundReceiptNumber = payload.mpesaRefundReceiptNumber;
      refund.completedAt = nowIso;
      delete refund.failureReason;

      this.appendAudit({
        actorId: "daraja-b2c-callback",
        actorRole: "system_callback",
        action: "REFUND_CALLBACK_CONFIRMED",
        entityType: "refund",
        entityId: refund.id,
        summary: `Refund ${refund.refundReference} (KSh ${refund.amountKes}) confirmed COMPLETED (${payload.mpesaRefundReceiptNumber}).`,
      });

      this.appendTransaction(
        {
          applicationId: refund.applicationId,
          type: "REFUND_COMPLETED",
          amountKes: refund.amountKes,
          reference: payload.mpesaRefundReceiptNumber,
          status: "COMPLETED",
          description: `Full KSh ${refund.amountKes} deposit refund confirmed (${this.mode} mode).`,
        },
        nowIso,
      );
    } else {
      refund.status = "FAILED";
      refund.failureReason = payload.failureReason ?? "Refund provider did not confirm completion.";

      this.appendAudit({
        actorId: "daraja-b2c-callback",
        actorRole: "system_callback",
        action: "REFUND_FAILED",
        entityType: "refund",
        entityId: refund.id,
        summary: `Refund ${refund.refundReference} FAILED: ${refund.failureReason}`,
      });

      this.appendTransaction(
        {
          applicationId: refund.applicationId,
          type: "REFUND_FAILED",
          amountKes: refund.amountKes,
          reference: refund.refundReference,
          status: "FAILED",
          description: `Refund attempt failed: ${refund.failureReason}`,
        },
        nowIso,
      );
    }

    return { ...refund };
  }

  reconcileDeposit(actor: ActorContext, depositId: string): ReconciliationResult {
    this.assertAdmin(actor, "reconcile payment and refund records");

    const deposit = this.deposits.get(depositId);
    if (!deposit) {
      throw new LendingDomainError("NOT_FOUND", "Deposit record not found.");
    }
    const application = this.applications.get(deposit.applicationId);
    const refundId = this.refundsByDeposit.get(deposit.id);
    const refund = refundId ? this.refunds.get(refundId) : undefined;

    const issues: string[] = [];

    if (deposit.amountKes !== APP_FEE_KES) {
      issues.push(`Deposit amount (${deposit.amountKes}) differs from KSh ${APP_FEE_KES}.`);
    }
    if (deposit.status === "PAID" && !deposit.mpesaReceiptNumber) {
      issues.push("PAID deposit is missing a verified M-Pesa receipt number.");
    }
    if (
      application &&
      (application.status === "APPROVED" || application.status === "REJECTED") &&
      deposit.status === "PAID" &&
      !refund
    ) {
      issues.push("Completed assessment with PAID deposit has no refund initiated.");
    }
    if (refund && refund.status === "COMPLETED" && !refund.mpesaRefundReceiptNumber) {
      issues.push("COMPLETED refund is missing provider confirmation receipt.");
    }
    if (refund && refund.status === "FAILED") {
      issues.push(`Refund failed (${refund.failureReason ?? "unknown"}) and requires retry.`);
    }

    const result: ReconciliationResult = {
      depositId: deposit.id,
      applicationId: deposit.applicationId,
      depositStatus: deposit.status,
      refundStatus: refund?.status ?? "NOT_ELIGIBLE",
      isConsistent: issues.length === 0,
      issues,
      checkedAt: new Date().toISOString(),
    };

    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "RECONCILIATION_RUN",
      entityType: "deposit",
      entityId: deposit.id,
      summary: `Reconciliation for ${deposit.id}: ${result.isConsistent ? "Consistent" : `${issues.length} issue(s) found`}.`,
    });

    return result;
  }

  /**
   * Records a loan disbursement. Only VERIFIED disbursements on APPROVED loans
   * ever appear in the verified disbursements feed.
   */
  recordVerifiedDisbursement(
    actor: ActorContext,
    params: { applicationId: string; providerReference: string; verified: boolean },
  ): DisbursementRecord {
    this.assertAdmin(actor, "record verified loan disbursements");

    const application = this.applications.get(params.applicationId);
    if (!application) {
      throw new LendingDomainError("NOT_FOUND", "Loan application not found.");
    }
    if (application.status !== "APPROVED") {
      throw new LendingDomainError(
        "INVALID_STATE",
        "Disbursements can only be recorded for APPROVED loan applications.",
      );
    }
    if (!params.providerReference.trim()) {
      throw new LendingDomainError(
        "VALIDATION_ERROR",
        "Provider transaction reference is required.",
      );
    }

    const nowIso = new Date().toISOString();
    const disbursementId = this.nextId("PP-DIS");
    const firstName = application.applicantName.trim().split(/\s+/)[0] ?? "Applicant";

    const record: DisbursementRecord = {
      id: disbursementId,
      applicationId: application.id,
      applicantFirstName: firstName,
      maskedPhone: maskKenyanPhone(application.phoneMsisdn),
      loanCategory: application.purpose.toLowerCase(),
      amountKes: application.requestedAmountKes,
      providerReference: params.providerReference.trim(),
      status: params.verified ? "VERIFIED" : "PENDING_VERIFICATION",
      ...(params.verified ? { verifiedByAdminId: actor.userId, verifiedAt: nowIso } : {}),
      createdAt: nowIso,
      isDemoMode: this.mode === "DEMO",
    };

    this.disbursements.set(disbursementId, record);
    this.disbursementsByApplication.set(application.id, disbursementId);

    this.appendAudit({
      actorId: actor.userId,
      actorRole: actor.role,
      action: "DISBURSEMENT_RECORDED",
      entityType: "disbursement",
      entityId: disbursementId,
      summary: `Disbursement ${disbursementId} (${record.status}) recorded for ${application.id} (${record.amountKes} KSh).`,
      metadata: { status: record.status, amountKes: record.amountKes },
    });

    this.appendTransaction(
      {
        applicationId: application.id,
        type: "DISBURSEMENT_RECORDED",
        amountKes: record.amountKes,
        reference: record.providerReference,
        status: record.status,
        description: `Loan disbursement recorded (${record.status}, ${this.mode} mode).`,
      },
      nowIso,
    );

    return { ...record };
  }

  /**
   * Returns ONLY backend-verified disbursements — never fabricated or unverified records.
   */
  getVerifiedDisbursements(): DisbursementRecord[] {
    return Array.from(this.disbursements.values())
      .filter((record) => record.status === "VERIFIED")
      .map((record) => ({ ...record }));
  }

  private buildPortfolioItem(application: LoanApplication): CustomerPortfolioItem {
    const assessment = this.assessments.get(application.id);
    if (!assessment) {
      throw new LendingDomainError("NOT_FOUND", `Assessment missing for ${application.id}.`);
    }
    const depositId = this.depositsByApplication.get(application.id);
    const deposit = depositId ? this.deposits.get(depositId) : undefined;
    const refundId = deposit ? this.refundsByDeposit.get(deposit.id) : undefined;
    const refund = refundId ? this.refunds.get(refundId) : undefined;
    const disbursementId = this.disbursementsByApplication.get(application.id);
    const disbursement = disbursementId ? this.disbursements.get(disbursementId) : undefined;
    const repaymentSchedule = this.schedules.get(application.id) ?? [];
    const transactionHistory = this.transactionHistory.get(application.id) ?? [];

    return {
      application: { ...application },
      assessment: { ...assessment },
      ...(deposit
        ? { deposit: { ...deposit, processedCallbackIds: [...deposit.processedCallbackIds] } }
        : {}),
      ...(refund ? { refund: { ...refund } } : {}),
      ...(disbursement ? { disbursement: { ...disbursement } } : {}),
      repaymentSchedule: repaymentSchedule.map((item) => ({ ...item })),
      transactionHistory: transactionHistory.map((tx) => ({ ...tx })),
    };
  }

  getCustomerPortfolio(actor: ActorContext): CustomerPortfolioItem[] {
    return Array.from(this.applications.values())
      .filter((app) => app.applicantUserId === actor.userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((app) => this.buildPortfolioItem(app));
  }

  getAdminDashboard(actor: ActorContext): AdminDashboardSnapshot {
    this.assertAdmin(actor, "access the administrator dashboard");

    const applications = Array.from(this.applications.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((app) => this.buildPortfolioItem(app));
    const deposits = Array.from(this.deposits.values()).map((d) => ({
      ...d,
      processedCallbackIds: [...d.processedCallbackIds],
    }));
    const refunds = Array.from(this.refunds.values()).map((r) => ({ ...r }));
    const disbursements = Array.from(this.disbursements.values()).map((d) => ({ ...d }));
    const preliminaryRequests = Array.from(this.preliminaryRequests.values())
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((request) => ({ ...request }));

    return {
      preliminaryRequests,
      applications,
      deposits,
      refunds,
      disbursements,
      auditLogs: this.auditLogs.map((entry) => ({ ...entry })),
      metrics: {
        totalApplications: applications.length,
        inReviewQueue: applications.filter((item) => item.application.status === "UNDER_REVIEW")
          .length,
        paidDepositsCount: deposits.filter((d) => d.status === "PAID").length,
        pendingDepositsCount: deposits.filter((d) => d.status === "PENDING").length,
        failedDepositsCount: deposits.filter((d) => d.status === "FAILED").length,
        pendingOrProcessingRefundsCount: refunds.filter(
          (r) => r.status === "PENDING" || r.status === "PROCESSING",
        ).length,
        completedRefundsCount: refunds.filter((r) => r.status === "COMPLETED").length,
        failedRefundsCount: refunds.filter((r) => r.status === "FAILED").length,
        verifiedDisbursementsCount: disbursements.filter((d) => d.status === "VERIFIED").length,
      },
    };
  }

  getAuditLogs(actor: ActorContext): AuditLogEntry[] {
    this.assertAdmin(actor, "read full transaction audit logs");
    return this.auditLogs.map((entry) => ({ ...entry }));
  }
}
