import type { EligibilityPrecheckTierName } from "@/lib/pesapap-config";

export type UserRole = "customer" | "admin";

export interface ActorContext {
  userId: string;
  role: UserRole;
  displayName: string;
  phone?: string;
}

export interface CustomerProfile {
  userId: string;
  fullName: string;
  nationalIdMasked: string;
  phoneMsisdn: string;
  email: string;
  location: string;
  createdAt: string;
}

export type LoanApplicationStatus =
  | "APPLICATION_SUBMITTED"
  | "AWAITING_VERIFICATION"
  | "UNDER_REVIEW"
  | "ADDITIONAL_INFO_REQUIRED"
  | "APPROVED"
  | "REJECTED";

export const LOAN_STATUS_LABELS: Record<LoanApplicationStatus, string> = {
  APPLICATION_SUBMITTED: "Application Submitted",
  AWAITING_VERIFICATION: "Awaiting Verification",
  UNDER_REVIEW: "Under Review",
  ADDITIONAL_INFO_REQUIRED: "Additional Information Required",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export type DepositPaymentStatus = "NOT_INITIATED" | "PENDING" | "PAID" | "FAILED";
export type RefundStatus = "NOT_ELIGIBLE" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type DisbursementStatus = "PENDING_VERIFICATION" | "VERIFIED" | "FAILED";

export type AffordabilityBand = "STRONG" | "MODERATE" | "STRETCHED";
export type AssessmentRecommendation =
  "RECOMMENDED_FOR_REVIEW" | "ADDITIONAL_INFO_REQUIRED" | "HIGH_RISK_DECLINE_RECOMMENDED";

export interface AssessmentRecord {
  id: string;
  applicationId: string;
  evaluatedAt: string;
  requestedAmountKes: number;
  durationDays: number;
  estimatedInterestKes: number;
  estimatedTotalRepaymentKes: number;
  monthlyIncomeKes: number;
  existingMonthlyObligationsKes: number;
  disposableMonthlyIncomeKes: number;
  monthlyEquivalentObligationKes: number;
  repaymentToIncomeRatio: number;
  maxIndicativeCapacityKes: number;
  affordabilityBand: AffordabilityBand;
  recommendation: AssessmentRecommendation;
  reasons: string[];
  guaranteeDisclaimer: string;
}

export interface LoanApplicationInput {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  birthDate: string;
  location: string;
  employmentStatus: "Employed" | "Self-employed" | "Business owner" | "Other";
  occupation: string;
  monthlyIncomeKes: number;
  existingMonthlyObligationsKes: number;
  employerName: string;
  incomeSource: "Salary" | "Business income" | "Agriculture" | "Contract or freelance" | "Other";
  requestedAmountKes: number;
  durationDays: 14 | 30 | 60 | 90;
  purpose: "Business stock" | "Working capital" | "Agriculture" | "Personal goal" | "Other";
  repaymentMethod: "M-Pesa" | "Bank transfer";
  termsAccepted: boolean;
}

export interface PreliminaryLoanRequestInput {
  fullName: string;
  nationalId: string;
  phone: string;
  loanCategory: EligibilityPrecheckTierName;
}

export interface PreliminaryLoanRequest {
  id: string;
  applicantUserId: string;
  applicantName: string;
  nationalIdHash: string;
  nationalIdLast4: string;
  phoneMsisdn: string;
  loanCategory: EligibilityPrecheckTierName;
  minimumAmountKes: number;
  maximumAmountKes: number;
  status: "AWAITING_FULL_APPLICATION";
  createdAt: string;
}

export interface LoanApplication {
  id: string;
  applicantUserId: string;
  applicantName: string;
  nationalIdHash: string;
  nationalIdLast4: string;
  phoneMsisdn: string;
  email: string;
  birthDate: string;
  location: string;
  employmentStatus: LoanApplicationInput["employmentStatus"];
  occupation: string;
  monthlyIncomeKes: number;
  existingMonthlyObligationsKes: number;
  employerName: string;
  incomeSource: LoanApplicationInput["incomeSource"];
  requestedAmountKes: number;
  durationDays: LoanApplicationInput["durationDays"];
  purpose: LoanApplicationInput["purpose"];
  repaymentMethod: LoanApplicationInput["repaymentMethod"];
  status: LoanApplicationStatus;
  reviewNotes?: string;
  reviewedByAdminId?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  isDemoMode: boolean;
}

export interface DepositPaymentRecord {
  id: string;
  applicationId: string;
  applicantUserId: string;
  amountKes: number;
  refundableAmountKes: number;
  paymentMethod: "M-Pesa";
  phoneMsisdn: string;
  transactionReference: string;
  checkoutRequestId: string;
  mpesaReceiptNumber?: string;
  receiptIssuedAt?: string;
  status: DepositPaymentStatus;
  failureReason?: string;
  initiatedAt: string;
  paidAt?: string;
  updatedAt: string;
  isDemoMode: boolean;
  processedCallbackIds: string[];
}

export interface RefundRecord {
  id: string;
  depositId: string;
  applicationId: string;
  applicantUserId: string;
  amountKes: number;
  destinationMsisdn: string;
  refundReference: string;
  providerConversationId?: string;
  mpesaRefundReceiptNumber?: string;
  status: RefundStatus;
  triggerReason: "AUTO_ON_APPROVAL" | "AUTO_ON_REJECTION" | "MANUAL_ADMIN_INITIATED";
  retryCount: number;
  failureReason?: string;
  initiatedBy: string;
  initiatedAt: string;
  completedAt?: string;
  updatedAt: string;
  isDemoMode: boolean;
}

export interface DisbursementRecord {
  id: string;
  applicationId: string;
  applicantFirstName: string;
  maskedPhone: string;
  loanCategory: string;
  amountKes: number;
  providerReference: string;
  status: DisbursementStatus;
  verifiedByAdminId?: string;
  verifiedAt?: string;
  createdAt: string;
  isDemoMode: boolean;
}

export interface RepaymentInstallment {
  id: string;
  applicationId: string;
  installmentNumber: number;
  dueDate: string;
  principalKes: number;
  interestKes: number;
  totalDueKes: number;
  status: "SCHEDULED" | "PAID" | "OVERDUE";
}

export interface TransactionHistoryEntry {
  id: string;
  applicationId: string;
  timestamp: string;
  type:
    | "DEPOSIT_STK_INITIATED"
    | "DEPOSIT_CONFIRMED"
    | "DEPOSIT_FAILED"
    | "REFUND_INITIATED"
    | "REFUND_COMPLETED"
    | "REFUND_FAILED"
    | "DISBURSEMENT_RECORDED";
  amountKes: number;
  reference: string;
  status: string;
  description: string;
  isDemoSimulation: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorRole: UserRole | "system_callback";
  action:
    | "PRELIMINARY_REQUEST_SUBMITTED"
    | "APPLICATION_SUBMITTED"
    | "ASSESSMENT_RECORDED"
    | "DEPOSIT_INITIATED"
    | "DEPOSIT_CALLBACK_VERIFIED"
    | "DEPOSIT_CALLBACK_DUPLICATE_IGNORED"
    | "DEPOSIT_FAILED"
    | "APPLICATION_STATUS_UPDATED"
    | "REFUND_INITIATED"
    | "REFUND_CALLBACK_CONFIRMED"
    | "REFUND_FAILED"
    | "REFUND_RETRIED"
    | "RECONCILIATION_RUN"
    | "DISBURSEMENT_RECORDED";
  entityType: "preliminary_request" | "application" | "deposit" | "refund" | "disbursement";
  entityId: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface ReconciliationResult {
  depositId: string;
  applicationId: string;
  depositStatus: DepositPaymentStatus;
  refundStatus: RefundStatus;
  isConsistent: boolean;
  issues: string[];
  checkedAt: string;
}
