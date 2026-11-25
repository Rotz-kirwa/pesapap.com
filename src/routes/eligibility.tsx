import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, ClipboardCheck } from "lucide-react";

import { CTAButton, SelectField, SiteShell, TextField } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { eligibilityAssessmentInputSchema } from "@/lib/lending/assessment";
import type { LoanApplicationInput } from "@/lib/lending/types";
import { ELIGIBILITY_PRECHECK_TIERS, formatKes, LOAN_CALCULATOR } from "@/lib/pesapap-config";

const eligibilityPrecheckInputSchema = eligibilityAssessmentInputSchema.omit({
  email: true,
  birthDate: true,
  monthlyIncomeKes: true,
  existingMonthlyObligationsKes: true,
});

const PRECHECK_TIER_CTA_VARIANTS = ["brandGreen", "accent", "default", "brandBlue"] as const;

export const Route = createFileRoute("/eligibility")({
  head: () => ({
    meta: [
      { title: "Eligibility Assessment | Pesa Pap" },
      {
        name: "description",
        content:
          "Complete a short eligibility pre-check and continue to a full Pesa Pap loan application.",
      },
      { property: "og:title", content: "Eligibility Assessment | Pesa Pap" },
      {
        property: "og:description",
        content: "Share basic details to learn the next steps for a Pesa Pap loan application.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EligibilityPage,
});

function EligibilityPage() {
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [employmentStatus, setEmploymentStatus] =
    useState<LoanApplicationInput["employmentStatus"]>("Employed");
  const [requestedAmount, setRequestedAmount] = useState("");
  const [durationDays, setDurationDays] = useState<string>("30");
  const [consent, setConsent] = useState(false);

  const [precheckComplete, setPrecheckComplete] = useState(false);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!consent) {
      setError("Please confirm that this pre-check does not determine loan approval.");
      return;
    }

    const parsed = eligibilityPrecheckInputSchema.safeParse({
      fullName,
      nationalId,
      phone,
      employmentStatus,
      requestedAmountKes: Number(requestedAmount),
      durationDays: Number(durationDays),
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your entries and try again.");
      return;
    }

    setPrecheckComplete(true);
    setNationalId("");
    setPhone("");
  }

  return (
    <SiteShell activePath="/eligibility">
      {!precheckComplete && (
        <section className="border-b border-brand-line bg-brand-mint">
          <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6 sm:py-6">
            <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-forest">
              <span className="size-1.5 rounded-full bg-brand-orange" /> Quick eligibility pre-check
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-brand-forest sm:text-3xl">
              Check Your Eligibility
            </h1>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              Share a few basic details to see how to continue. A full affordability assessment
              takes place during the loan application.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          {!precheckComplete ? (
            <form
              onSubmit={handleSubmit}
              className="rounded-lg border border-brand-line bg-background p-5 shadow-sm sm:p-6"
            >
              <div className="flex items-center justify-between gap-3 border-b border-brand-line pb-4">
                <div>
                  <h2 className="text-lg font-bold text-brand-forest">
                    Basic Applicant Information
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Complete this short pre-check to see the next steps.
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest">
                  <ClipboardCheck aria-hidden="true" className="size-4" />
                </span>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <TextField
                  id="eligibility-name"
                  label="Full name"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                />
                <TextField
                  id="eligibility-id"
                  label="National ID number"
                  required
                  inputMode="numeric"
                  value={nationalId}
                  onChange={(e) => setNationalId(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  placeholder="7–12 digits"
                />
                <TextField
                  id="eligibility-phone"
                  label="Kenyan mobile number"
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+254 712 345 678"
                />
                <SelectField
                  id="eligibility-employment"
                  label="Employment status"
                  value={employmentStatus}
                  onValueChange={(value) =>
                    setEmploymentStatus(value as LoanApplicationInput["employmentStatus"])
                  }
                  options={[
                    { value: "Employed", label: "Employed" },
                    { value: "Self-employed", label: "Self-employed" },
                    { value: "Business owner", label: "Business owner" },
                    { value: "Other", label: "Other" },
                  ]}
                />
                <TextField
                  id="eligibility-amount"
                  label="Requested loan amount (KSh)"
                  required
                  type="number"
                  min={LOAN_CALCULATOR.minimumKes}
                  max={LOAN_CALCULATOR.maximumKes}
                  step={LOAN_CALCULATOR.stepKes}
                  inputMode="numeric"
                  value={requestedAmount}
                  onChange={(e) => setRequestedAmount(e.target.value)}
                />
                <SelectField
                  id="eligibility-duration"
                  label="Repayment duration"
                  value={durationDays}
                  onValueChange={setDurationDays}
                  options={LOAN_CALCULATOR.durationsDays.map((days) => ({
                    value: String(days),
                    label: `${days} days`,
                  }))}
                />
              </div>

              <div className="mt-5 flex items-start gap-2.5 border-t border-brand-line pt-4">
                <Checkbox
                  id="eligibility-consent"
                  checked={consent}
                  onCheckedChange={(value) => setConsent(value === true)}
                />
                <Label
                  htmlFor="eligibility-consent"
                  className="cursor-pointer text-xs font-medium leading-5 text-muted-foreground"
                >
                  I understand this pre-check does not determine loan approval.
                </Label>
              </div>

              {error && (
                <p
                  role="alert"
                  className="mt-4 flex items-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                >
                  <AlertCircle aria-hidden="true" className="size-4 shrink-0" />
                  {error}
                </p>
              )}

              <Button
                type="submit"
                variant="accent"
                size="lg"
                className="mt-5 h-11 w-full font-bold sm:w-auto sm:px-6"
              >
                See next steps <ArrowRight aria-hidden="true" />
              </Button>
            </form>
          ) : (
            <div
              aria-live="polite"
              className="rounded-lg border border-brand-line bg-background p-5 shadow-sm sm:p-6"
            >
              <p className="text-[0.68rem] font-bold uppercase text-brand-forest">
                Quick pre-check complete
              </p>
              <h2 className="mt-1 text-xl font-bold text-brand-forest">
                Congratulations, <span className="italic text-brand-blue">{fullName}</span>! 🎉
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-foreground">
                Great news! You’ve successfully qualified for the next stage of our loan application
                process.
              </p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Based on your initial pre-check, you meet the requirements to continue to the full
                application. Explore the available loan categories and funding ranges below.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {ELIGIBILITY_PRECHECK_TIERS.map((tier, index) => (
                  <article
                    key={tier.name}
                    className="rounded-md border border-brand-line bg-brand-soft p-4"
                  >
                    <h3 className="text-sm font-bold text-brand-forest">{tier.name}</h3>
                    <p className="mt-1 font-display text-lg font-extrabold text-brand-forest">
                      {formatKes(tier.minimumKes)}–{formatKes(tier.maximumKes)}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{tier.summary}</p>
                    <CTAButton
                      to="/loan-now"
                      size="default"
                      variant={PRECHECK_TIER_CTA_VARIANTS[index]}
                      className="mt-4 h-10 w-full font-bold"
                    >
                      Apply now
                    </CTAButton>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
