export const APP_FEE_KES = 100;
export const SAMPLE_MONTHLY_RATE_PERCENT = 5;

export const LOAN_CALCULATOR = {
  minimumKes: 2_000,
  maximumKes: 100_000,
  stepKes: 1_000,
  initialKes: 25_000,
  durationsDays: [14, 30, 60, 90],
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

export const CONTACT_PLACEHOLDERS = {
  phone: "Not configured",
  email: "Not configured",
  address: "Not configured",
  hours: "Not configured",
  whatsapp: "Not configured",
} as const;

export const ELIGIBILITY_DEMO_STATES = [
  "Application information received",
  "Assessment pending",
  "Further information required",
  "Not currently eligible",
] as const;

export const APPLICATION_DEMO_STATES = [
  "Draft",
  "Submitted",
  "Under review",
  "Additional information required",
  "Approved",
  "Declined",
  "Disbursed",
] as const;

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