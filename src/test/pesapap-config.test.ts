import { describe, expect, it } from "vitest";

import {
  APP_FEE_KES,
  DEPOSIT_DISCLOSURE,
  ELIGIBILITY_PRECHECK_TIERS,
  estimateRepayment,
  isKenyanMobileNumber,
  maskKenyanPhone,
  normalizeKenyanPhone,
} from "@/lib/pesapap-config";
import { DEMO_DISBURSEMENT_ACTIVITY } from "@/lib/disbursement-activity";

describe("Pesa Pap configuration", () => {
  it("keeps the refundable application processing deposit at KSh 100 (100% refundable) in Sandbox Preview", () => {
    expect(APP_FEE_KES).toBe(100);
    expect(DEPOSIT_DISCLOSURE.amountKes).toBe(100);
    expect(DEPOSIT_DISCLOSURE.refundablePercent).toBe(100);
    expect(DEPOSIT_DISCLOSURE.paymentMethod).toContain("Sandbox Preview");
  });

  it("provides unique, masked synthetic ticker examples within the requested amount range", () => {
    expect(DEMO_DISBURSEMENT_ACTIVITY.length).toBeGreaterThanOrEqual(200);
    const combinations = DEMO_DISBURSEMENT_ACTIVITY.map((item) =>
      [item.name, item.maskedPhone, item.loanCategory, item.amountKes].join("|"),
    );
    expect(new Set(combinations).size).toBe(combinations.length);

    for (const item of DEMO_DISBURSEMENT_ACTIVITY) {
      expect(item.id).toMatch(/^DEMO-ACTIVITY-/);
      expect(item.name.length).toBeGreaterThan(0);
      expect(item.maskedPhone).toMatch(/^0[17]\d{2}\*{4}\d{2}$/);
      expect(item.loanCategory.length).toBeGreaterThan(0);
      expect(item.amountKes).toBeGreaterThanOrEqual(5_000);
      expect(item.amountKes).toBeLessThanOrEqual(500_000);
    }
  });

  it("provides four sample eligibility ranges, each starting at KSh 10,000 or more", () => {
    expect(ELIGIBILITY_PRECHECK_TIERS).toHaveLength(4);
    for (const tier of ELIGIBILITY_PRECHECK_TIERS) {
      expect(tier.minimumKes).toBeGreaterThanOrEqual(10_000);
      expect(tier.maximumKes).toBeGreaterThan(tier.minimumKes);
    }
  });

  it("validates, normalizes, and masks Kenyan mobile numbers accurately", () => {
    expect(isKenyanMobileNumber("+254 712 345 678")).toBe(true);
    expect(isKenyanMobileNumber("0791234517")).toBe(true);
    expect(isKenyanMobileNumber("0112345678")).toBe(true);
    expect(isKenyanMobileNumber("12345")).toBe(false);

    expect(normalizeKenyanPhone("0791234517")).toBe("254791234517");
    expect(normalizeKenyanPhone("+254 712 345 678")).toBe("254712345678");
    expect(maskKenyanPhone("254791234517")).toBe("0791****17");
  });

  it("computes prorated repayment estimates", () => {
    expect(estimateRepayment(25_000, 30)).toEqual({
      principalKes: 25_000,
      interestKes: 1_250,
      totalKes: 26_250,
    });
  });
});
