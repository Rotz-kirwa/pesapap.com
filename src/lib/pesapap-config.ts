export const APP_FEE_KES = 100;
export const SAMPLE_MONTHLY_RATE_PERCENT = 5;

export const LOAN_CALCULATOR = {
  minimumKes: 2_000,
  maximumKes: 100_000,
  stepKes: 1_000,
  initialKes: 25_000,
  durationsDays: [14, 30, 60, 90],
} as const;

export const HERO_FLOW_AMOUNTS = ["10k", "20k", "50k", "100k"] as const;
export const HERO_DROP_AMOUNTS = ["+15k", "+75k"] as const;
export const HERO_CYCLE_AMOUNTS_KES = [
  25_000, 10_000, 50_000, 100_000, 20_000, 75_000, 15_000, 60_000, 85_000, 35_000,
] as const;

/**
 * Illustrative underwriting thresholds kept separate from assessment logic.
 * Production underwriting must be governed by licensed credit policy & backend rules.
 */
export const UNDERWRITING_POLICY = {
  minimumAgeYears: 18,
  maxDebtToIncomeRatio: 0.4,
  strongAffordabilityMaxRatio: 0.25,
  maxLoanToMonthlyIncomeMultiplier: 2.5,
} as const;

export const DEMO_PRODUCTS = [
  {
    name: "Personal support",
    minimumKes: 2_000,
    maximumKes: 30_000,
    duration: "14–30 days",
    summary: "For a planned expense or an unexpected need.",
  },
  {
    name: "Business working capital",
    minimumKes: 5_000,
    maximumKes: 100_000,
    duration: "30–90 days",
    summary: "For stock, supplies, or day-to-day operations.",
  },
  {
    name: "Seasonal opportunity",
    minimumKes: 10_000,
    maximumKes: 100_000,
    duration: "60–90 days",
    summary: "For a time-bound opportunity or seasonal plan.",
  },
] as const;

export const ELIGIBILITY_PRECHECK_TIERS = [
  {
    name: "Personal Support",
    minimumKes: 10_000,
    maximumKes: 20_000,
    summary: "For planned personal expenses and everyday needs.",
  },
  {
    name: "Emergency Support",
    minimumKes: 20_000,
    maximumKes: 40_000,
    summary: "For unexpected costs and urgent needs.",
  },
  {
    name: "Education Support",
    minimumKes: 40_000,
    maximumKes: 70_000,
    summary: "For education-related expenses and learning plans.",
  },
  {
    name: "Business Working Capital",
    minimumKes: 70_000,
    maximumKes: 100_000,
    summary: "For stock, supplies, or day-to-day operations.",
  },
] as const;

export type EligibilityPrecheckTierName = (typeof ELIGIBILITY_PRECHECK_TIERS)[number]["name"];

export const CONTACT_PLACEHOLDERS = {
  phone: "Not configured",
  email: "Not configured",
  address: "Not configured",
  hours: "Not configured",
  whatsapp: "Not configured",
} as const;

export const APPLICATION_WORKFLOW_STATUSES = [
  "Application Submitted",
  "Awaiting Verification",
  "Under Review",
  "Additional Information Required",
  "Approved",
  "Rejected",
] as const;

export const DEPOSIT_DISCLOSURE = {
  amountKes: APP_FEE_KES,
  refundablePercent: 100,
  paymentMethod: "M-Pesa (Safaricom Daraja STK Push — Sandbox Preview)",
  timeline:
    "Initiated automatically to the original M-Pesa number once underwriting assessment is completed (whether approved or rejected).",
  summary:
    "The KSh 100 application-processing deposit is 100% refundable once loan application assessment is completed, regardless of whether the application is approved or rejected.",
} as const;

export function formatKes(amount: number): string {
  return `KSh ${new Intl.NumberFormat("en-KE", { maximumFractionDigits: 0 }).format(amount)}`;
}

export function estimateRepayment(amountKes: number, durationDays: number) {
  const interestKes = Math.round(
    amountKes * (SAMPLE_MONTHLY_RATE_PERCENT / 100) * (durationDays / 30),
  );

  return {
    principalKes: amountKes,
    interestKes,
    totalKes: amountKes + interestKes,
  };
}

export function isKenyanMobileNumber(value: string): boolean {
  const digits = value.replace(/\D/g, "");

  if (digits.startsWith("254")) return /^254[17]\d{8}$/.test(digits);
  if (digits.startsWith("0")) return /^0[17]\d{8}$/.test(digits);
  return /^[17]\d{8}$/.test(digits);
}

export function normalizeKenyanPhone(value: string): string | null {
  if (!isKenyanMobileNumber(value)) return null;
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return `254${digits}`;
}

export function maskKenyanPhone(msisdn: string): string {
  const digits = msisdn.replace(/\D/g, "");
  const local = digits.startsWith("254") ? `0${digits.slice(3)}` : digits;
  if (local.length < 10) return "07** **** **";
  return `${local.slice(0, 4)}****${local.slice(-2)}`;
}
