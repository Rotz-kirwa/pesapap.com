import { z } from "zod";

import {
  estimateRepayment,
  ELIGIBILITY_PRECHECK_TIERS,
  isKenyanMobileNumber,
  LOAN_CALCULATOR,
  UNDERWRITING_POLICY,
} from "@/lib/pesapap-config";
import type {
  AffordabilityBand,
  AssessmentRecommendation,
  AssessmentRecord,
  LoanApplicationInput,
} from "@/lib/lending/types";

function calculateAgeYears(birthDateIso: string, now: Date = new Date()): number {
  const parsed = new Date(birthDateIso);
  if (Number.isNaN(parsed.getTime())) return -1;
  let age = now.getUTCFullYear() - parsed.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - parsed.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < parsed.getUTCDate())) {
    age -= 1;
  }
  return age;
}

export const eligibilityAssessmentInputSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Enter your full name (at least 2 characters).")
    .max(100, "Full name is too long."),
  nationalId: z
    .string()
    .trim()
    .regex(/^\d{7,12}$/, "National ID must be 7 to 12 digits."),
  phone: z
    .string()
    .trim()
    .refine(isKenyanMobileNumber, "Enter a valid Kenyan mobile number (+254, 07, or 01)."),
  email: z.string().trim().email("Enter a valid email address."),
  birthDate: z
    .string()
    .trim()
    .refine(
      (value) => calculateAgeYears(value) >= UNDERWRITING_POLICY.minimumAgeYears,
      `Applicant must be at least ${UNDERWRITING_POLICY.minimumAgeYears} years old.`,
    ),
  employmentStatus: z.enum(["Employed", "Self-employed", "Business owner", "Other"]),
  monthlyIncomeKes: z.number().finite().positive("Monthly income must be greater than zero."),
  existingMonthlyObligationsKes: z
    .number()
    .finite()
    .min(0, "Existing monthly obligations cannot be negative."),
  requestedAmountKes: z
    .number()
    .finite()
    .min(
      LOAN_CALCULATOR.minimumKes,
      `Minimum requested amount is KSh ${LOAN_CALCULATOR.minimumKes.toLocaleString("en-KE")}.`,
    )
    .max(
      LOAN_CALCULATOR.maximumKes,
      `Maximum requested amount is KSh ${LOAN_CALCULATOR.maximumKes.toLocaleString("en-KE")}.`,
    ),
  durationDays: z.union([z.literal(14), z.literal(30), z.literal(60), z.literal(90)]),
});

export type EligibilityAssessmentInput = z.infer<typeof eligibilityAssessmentInputSchema>;

export const loanApplicationInputSchema = eligibilityAssessmentInputSchema.extend({
  location: z.string().trim().min(2, "Enter your residential town or county.").max(100),
  occupation: z.string().trim().min(2, "Enter your occupation or trade.").max(100),
  employerName: z.string().trim().min(2, "Enter your employer or business name.").max(120),
  incomeSource: z.enum([
    "Salary",
    "Business income",
    "Agriculture",
    "Contract or freelance",
    "Other",
  ]),
  purpose: z.enum(["Business stock", "Working capital", "Agriculture", "Personal goal", "Other"]),
  repaymentMethod: z.enum(["M-Pesa", "Bank transfer"]),
  termsAccepted: z.literal(true, {
    errorMap: () => ({ message: "You must confirm the disclosure and terms before continuing." }),
  }),
});

export const preliminaryLoanRequestInputSchema = eligibilityAssessmentInputSchema
  .pick({
    fullName: true,
    nationalId: true,
    phone: true,
  })
  .extend({
    loanCategory: z
      .string()
      .refine(
        (value) => ELIGIBILITY_PRECHECK_TIERS.some((tier) => tier.name === value),
        "Select one of the available loan ranges.",
      ),
  });

export function evaluateRepaymentCapacity(
  input: Pick<
    LoanApplicationInput,
    | "monthlyIncomeKes"
    | "existingMonthlyObligationsKes"
    | "requestedAmountKes"
    | "durationDays"
    | "employmentStatus"
  >,
  applicationId: string,
  nowIso: string = new Date().toISOString(),
): AssessmentRecord {
  const repayment = estimateRepayment(input.requestedAmountKes, input.durationDays);
  const disposableMonthlyIncomeKes = Math.max(
    0,
    input.monthlyIncomeKes - input.existingMonthlyObligationsKes,
  );
  const monthsEquivalent = Math.max(1, input.durationDays / 30);
  const monthlyEquivalentObligationKes = Math.round(repayment.totalKes / monthsEquivalent);

  const totalMonthlyDebtLoad = input.existingMonthlyObligationsKes + monthlyEquivalentObligationKes;
  const repaymentToIncomeRatio =
    input.monthlyIncomeKes > 0
      ? Number((totalMonthlyDebtLoad / input.monthlyIncomeKes).toFixed(3))
      : 1;

  const maxAffordableMonthlyPayment = Math.max(
    0,
    input.monthlyIncomeKes * UNDERWRITING_POLICY.maxDebtToIncomeRatio -
      input.existingMonthlyObligationsKes,
  );
  const rawCapacity = Math.min(
    maxAffordableMonthlyPayment * monthsEquivalent,
    input.monthlyIncomeKes * UNDERWRITING_POLICY.maxLoanToMonthlyIncomeMultiplier,
    LOAN_CALCULATOR.maximumKes,
  );
  const maxIndicativeCapacityKes =
    rawCapacity < LOAN_CALCULATOR.minimumKes
      ? 0
      : Math.floor(rawCapacity / LOAN_CALCULATOR.stepKes) * LOAN_CALCULATOR.stepKes;

  const reasons: string[] = [];
  let affordabilityBand: AffordabilityBand = "STRONG";
  let recommendation: AssessmentRecommendation = "RECOMMENDED_FOR_REVIEW";

  if (disposableMonthlyIncomeKes <= 0) {
    affordabilityBand = "STRETCHED";
    recommendation = "HIGH_RISK_DECLINE_RECOMMENDED";
    reasons.push("Existing monthly obligations equal or exceed reported monthly income.");
  } else if (repaymentToIncomeRatio > UNDERWRITING_POLICY.maxDebtToIncomeRatio) {
    affordabilityBand = "STRETCHED";
    recommendation = "HIGH_RISK_DECLINE_RECOMMENDED";
    reasons.push(
      `Combined monthly obligations (${Math.round(repaymentToIncomeRatio * 100)}% of income) exceed the ${Math.round(UNDERWRITING_POLICY.maxDebtToIncomeRatio * 100)}% affordability guideline.`,
    );
  } else if (repaymentToIncomeRatio > UNDERWRITING_POLICY.strongAffordabilityMaxRatio) {
    affordabilityBand = "MODERATE";
    recommendation = "ADDITIONAL_INFO_REQUIRED";
    reasons.push(
      `Combined obligations (${Math.round(repaymentToIncomeRatio * 100)}% of income) require income verification during review.`,
    );
  } else {
    affordabilityBand = "STRONG";
    recommendation = "RECOMMENDED_FOR_REVIEW";
    reasons.push(
      `Estimated repayment fits within ${Math.round(repaymentToIncomeRatio * 100)}% of reported monthly income.`,
    );
  }

  if (input.requestedAmountKes > maxIndicativeCapacityKes && maxIndicativeCapacityKes > 0) {
    reasons.push(
      `Requested amount exceeds indicative capacity (KSh ${maxIndicativeCapacityKes.toLocaleString("en-KE")}); a smaller amount may be recommended during review.`,
    );
    if (recommendation === "RECOMMENDED_FOR_REVIEW") {
      recommendation = "ADDITIONAL_INFO_REQUIRED";
    }
  }

  if (input.employmentStatus === "Other") {
    reasons.push("Non-standard employment requires supporting income documentation.");
    if (recommendation === "RECOMMENDED_FOR_REVIEW") {
      recommendation = "ADDITIONAL_INFO_REQUIRED";
    }
  }

  return {
    id: `PP-ASM-${applicationId.replace(/^PP-APP-/, "")}`,
    applicationId,
    evaluatedAt: nowIso,
    requestedAmountKes: input.requestedAmountKes,
    durationDays: input.durationDays,
    estimatedInterestKes: repayment.interestKes,
    estimatedTotalRepaymentKes: repayment.totalKes,
    monthlyIncomeKes: input.monthlyIncomeKes,
    existingMonthlyObligationsKes: input.existingMonthlyObligationsKes,
    disposableMonthlyIncomeKes,
    monthlyEquivalentObligationKes,
    repaymentToIncomeRatio,
    maxIndicativeCapacityKes,
    affordabilityBand,
    recommendation,
    reasons,
    guaranteeDisclaimer:
      "Indicative capacity assessment only. Submitting an application does not guarantee loan approval; final decisions require verification and underwriting review.",
  };
}
