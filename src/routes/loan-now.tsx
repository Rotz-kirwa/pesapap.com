import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, CircleDollarSign, ClipboardList, ShieldCheck } from "lucide-react";

import { CTAButton, DemoNotice, Field, PageIntro, SelectField, SiteShell, TextField } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { APPLICATION_DEMO_STATES, APP_FEE_KES, estimateRepayment, formatKes, isKenyanMobileNumber, LOAN_CALCULATOR, SAMPLE_MONTHLY_RATE_PERCENT } from "@/lib/pesapap-config";

export const Route = createFileRoute("/loan-now")({
  head: () => ({
    meta: [
      { title: "Loan Application | Pesa Pap" },
      { name: "description", content: "Explore Pesa Pap's guided loan application and illustrative repayment calculator." },
      { property: "og:title", content: "Loan Application | Pesa Pap" },
      { property: "og:description", content: "Preview a clear, step-by-step loan application. No real application is submitted here." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoanNowPage,
});

type ApplicationStatus = (typeof APPLICATION_DEMO_STATES)[number];
type ApplicationDetails = {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  birthDate: string;
  location: string;
  employment: string;
  occupation: string;
  monthlyIncome: string;
  employer: string;
  incomeSource: string;
  amount: string;
  purpose: string;
  duration: string;
  repaymentMethod: string;
};

const INITIAL_DETAILS: ApplicationDetails = {
  fullName: "",
  nationalId: "",
  phone: "",
  email: "",
  birthDate: "",
  location: "",
  employment: "Employed",
  occupation: "",
  monthlyIncome: "",
  employer: "",
  incomeSource: "",
  amount: String(LOAN_CALCULATOR.initialKes),
  purpose: "Business stock",
  duration: "30",
  repaymentMethod: "Mobile money (placeholder)",
};

const STEPS = ["Personal", "Income", "Loan details", "Review"] as const;
const STATUS_COPY: Record<ApplicationStatus, string> = {
  Draft: "A draft is not sent to a lender and has no reference number.",
  Submitted: "This sample submission stays in this browser only; no application was sent.",
  "Under review": "A real application would be reviewed by a lender. No review is underway here.",
  "Additional information required": "This sample status shows where a lender might ask for more information.",
  Approved: "Sample status only. No loan has been approved or offered.",
  Declined: "Sample status only. No application has been assessed or declined.",
  Disbursed: "Sample status only. No funds have been paid or disbursed.",
};

function LoanNowPage() {
  const [details, setDetails] = useState<ApplicationDetails>(INITIAL_DETAILS);
  const [step, setStep] = useState(1);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sampleStatus, setSampleStatus] = useState<ApplicationStatus>("Draft");

  const amount = Number(details.amount) || LOAN_CALCULATOR.minimumKes;
  const duration = Number(details.duration);
  const estimate = estimateRepayment(amount, duration);

  function update<K extends keyof ApplicationDetails>(key: K, value: ApplicationDetails[K]) {
    setDetails((current) => ({ ...current, [key]: value }));
  }

  function advanceStep() {
    setError("");
    const form = document.getElementById("loan-step-form");
    if (form instanceof HTMLFormElement && !form.reportValidity()) return;
    if (step === 1 && !isKenyanMobileNumber(details.phone)) {
      setError("Enter a valid Kenyan mobile number, such as +254 712 345 678.");
      return;
    }
    if (step === 2 && Number(details.monthlyIncome) <= 0) {
      setError("Enter a monthly income greater than zero.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEPS.length));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!termsAccepted) {
      setError("Please confirm the demonstration terms notice to continue.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setDetails(INITIAL_DETAILS);
      setTermsAccepted(false);
      setSampleStatus("Submitted");
      setSubmitted(true);
      setLoading(false);
    }, 650);
  }

  const stepNumber = step as 1 | 2 | 3 | 4;
  const progressWidth = { 1: "w-1/4", 2: "w-2/4", 3: "w-3/4", 4: "w-full" }[stepNumber];

  return (
    <SiteShell activePath="/loan-now">
      <section className="border-b border-brand-line bg-brand-mint">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <PageIntro eyebrow="Guided application" title="Apply for Your Loan with Pesa Pap." description="Complete your application details and let us guide you through the process." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <DemoNotice>Prototype only. Please use sample details, not real personal or financial information. Nothing is transmitted, stored, assessed, approved, or paid through this form.</DemoNotice>

        {!submitted ? (
          <div className="mt-8 grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
            <div className="min-w-0 border border-brand-line bg-background">
              <div className="border-b border-brand-line px-5 py-5 sm:px-8">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div><p className="text-xs font-bold uppercase text-brand-forest">Step {step} of 4</p><h2 className="mt-1 text-xl font-bold text-brand-forest">{STEPS[step - 1]}</h2></div>
                  <span className="grid size-10 place-items-center rounded-full bg-brand-sky text-brand-blue"><ClipboardList aria-hidden="true" className="size-5" /></span>
                </div>
                <div className="mt-5 h-1.5 overflow-hidden bg-brand-soft" role="progressbar" aria-label="Application steps" aria-valuemin={1} aria-valuemax={4} aria-valuenow={step}>
                  <div className={`h-full bg-brand-forest transition-all ${progressWidth}`} />
                </div>
                <ol className="mt-4 grid grid-cols-4 gap-2 text-[0.65rem] font-semibold sm:text-xs">
                  {STEPS.map((stepTitle, index) => {
                    const number = index + 1;
                    return <li key={stepTitle} className={number <= step ? "text-brand-forest" : "text-muted-foreground"}><span className="mr-1">{String(number).padStart(2, "0")}</span><span className="hidden sm:inline">{stepTitle}</span></li>;
                  })}
                </ol>
              </div>

              <form id="loan-step-form" onSubmit={handleSubmit} className="p-5 sm:p-8">
                {step === 1 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <TextField id="loan-name" label="Full name" required autoComplete="name" value={details.fullName} onChange={(event) => update("fullName", event.target.value)} placeholder="Your full name" />
                    <TextField id="loan-id" label="National ID number" required inputMode="numeric" autoComplete="off" value={details.nationalId} onChange={(event) => update("nationalId", event.target.value.replace(/\D/g, "").slice(0, 12))} pattern="\d{7,12}" title="Enter 7 to 12 digits" placeholder="Sample number only" />
                    <TextField id="loan-phone" label="Mobile phone number" required type="tel" autoComplete="tel" value={details.phone} onChange={(event) => update("phone", event.target.value)} placeholder="+254 712 345 678" hint="Kenyan number in +254, 07 or 01 format." />
                    <TextField id="loan-email" label="Email address" required type="email" autoComplete="email" value={details.email} onChange={(event) => update("email", event.target.value)} placeholder="name@example.com" />
                    <TextField id="loan-birth-date" label="Date of birth" required type="date" autoComplete="bday" value={details.birthDate} onChange={(event) => update("birthDate", event.target.value)} />
                    <TextField id="loan-location" label="Residential location" required autoComplete="address-level2" value={details.location} onChange={(event) => update("location", event.target.value)} placeholder="Town or county" />
                  </div>
                )}

                {step === 2 && (
                  <div className="grid gap-5 sm:grid-cols-2">
                    <SelectField id="loan-employment" label="Employment status" value={details.employment} onValueChange={(value) => update("employment", value)} options={[{ value: "Employed", label: "Employed" }, { value: "Self-employed", label: "Self-employed" }, { value: "Business owner", label: "Business owner" }, { value: "Other", label: "Other" }]} />
                    <TextField id="loan-occupation" label="Occupation" required value={details.occupation} onChange={(event) => update("occupation", event.target.value)} placeholder="Your role or trade" />
                    <TextField id="loan-income" label="Monthly income (KSh)" required type="number" min="1" inputMode="numeric" value={details.monthlyIncome} onChange={(event) => update("monthlyIncome", event.target.value)} placeholder="Sample amount" />
                    <TextField id="loan-employer" label="Employer or business name" required value={details.employer} onChange={(event) => update("employer", event.target.value)} placeholder="Sample name" />
                    <div className="sm:col-span-2">
                      <SelectField id="loan-income-source" label="Main source of income" value={details.incomeSource} onValueChange={(value) => update("incomeSource", value)} options={[{ value: "Salary", label: "Salary" }, { value: "Business income", label: "Business income" }, { value: "Agriculture", label: "Agriculture" }, { value: "Contract or freelance", label: "Contract or freelance" }, { value: "Other", label: "Other" }]} />
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-7">
                    <div className="border border-brand-line bg-brand-soft p-5 sm:p-6">
                      <div className="flex flex-wrap items-end justify-between gap-3">
                        <div><p className="text-xs font-bold uppercase text-brand-forest">Illustrative loan calculator</p><p className="mt-1 text-sm text-muted-foreground">Sample configuration only</p></div>
                        <div className="text-right"><p className="text-xs text-muted-foreground">Estimated total</p><p className="font-display text-2xl font-bold text-brand-forest">{formatKes(estimate.totalKes)}</p></div>
                      </div>
                      <div className="mt-5 grid gap-5 sm:grid-cols-[1fr_10rem] sm:items-end">
                        <div>
                          <Field id="loan-amount-slider" label="Requested amount">
                            <Slider id="loan-amount-slider" value={[amount]} min={LOAN_CALCULATOR.minimumKes} max={LOAN_CALCULATOR.maximumKes} step={LOAN_CALCULATOR.stepKes} onValueChange={(values) => { const next = values[0]; if (typeof next === "number") update("amount", String(next)); }} aria-label="Requested loan amount" className="mt-4 py-2" />
                            <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{formatKes(LOAN_CALCULATOR.minimumKes)}</span><span>{formatKes(LOAN_CALCULATOR.maximumKes)}</span></div>
                          </Field>
                        </div>
                        <TextField id="loan-amount" label="Amount (KSh)" required type="number" inputMode="numeric" min={LOAN_CALCULATOR.minimumKes} max={LOAN_CALCULATOR.maximumKes} step={LOAN_CALCULATOR.stepKes} value={details.amount} onChange={(event) => update("amount", event.target.value)} />
                      </div>
                      <div className="mt-5 grid gap-5 sm:grid-cols-2">
                        <SelectField id="loan-duration" label="Preferred repayment duration" value={details.duration} onValueChange={(value) => update("duration", value)} options={LOAN_CALCULATOR.durationsDays.map((days) => ({ value: String(days), label: `${days} days` }))} />
                        <SelectField id="loan-purpose" label="Loan purpose" value={details.purpose} onValueChange={(value) => update("purpose", value)} options={[{ value: "Business stock", label: "Business stock" }, { value: "Working capital", label: "Working capital" }, { value: "Agriculture", label: "Agriculture" }, { value: "Personal goal", label: "Personal goal" }, { value: "Other", label: "Other" }]} />
                        <div className="sm:col-span-2">
                          <SelectField id="loan-repayment-method" label="Preferred repayment method" value={details.repaymentMethod} onValueChange={(value) => update("repaymentMethod", value)} options={[{ value: "Mobile money (placeholder)", label: "Mobile money (placeholder)" }, { value: "Bank transfer (placeholder)", label: "Bank transfer (placeholder)" }, { value: "Other (placeholder)", label: "Other (placeholder)" }]} hint="No payment service is connected to this demonstration." />
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <div className="border border-brand-line p-4"><p className="text-xs text-muted-foreground">Sample principal</p><p className="mt-1 font-bold text-foreground">{formatKes(estimate.principalKes)}</p></div>
                      <div className="border border-brand-line p-4"><p className="text-xs text-muted-foreground">Sample interest</p><p className="mt-1 font-bold text-foreground">{formatKes(estimate.interestKes)}</p></div>
                      <div className="border border-brand-line p-4"><p className="text-xs text-muted-foreground">One payment on day {duration}</p><p className="mt-1 font-bold text-foreground">{formatKes(estimate.totalKes)}</p></div>
                    </div>
                    <p className="text-xs leading-5 text-muted-foreground">Estimate uses a flat {SAMPLE_MONTHLY_RATE_PERCENT}% monthly demonstration rate, prorated by the selected duration. It is not a quote, offer, approval, or repayment promise; actual terms and fees are not configured.</p>
                  </div>
                )}

                {step === 4 && (
                  <div>
                    <h3 className="text-xl font-bold text-brand-forest">Review your sample application</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">This summary is generated in your browser for demonstration only.</p>
                    <dl className="mt-6 divide-y divide-brand-line border-y border-brand-line">
                      {[
                        ["Applicant", details.fullName || "Sample applicant"],
                        ["Requested amount", formatKes(amount)],
                        ["Duration", `${duration} days`],
                        ["Sample interest", formatKes(estimate.interestKes)],
                        ["Illustrative total repayment", formatKes(estimate.totalKes)],
                        ["Schedule", `One illustrative payment on day ${duration}`],
                        ["Application fee", `${formatKes(APP_FEE_KES)} — not included or collected`],
                      ].map(([label, value]) => <div key={label} className="flex flex-col gap-1 py-3 sm:flex-row sm:justify-between sm:gap-5"><dt className="text-sm text-muted-foreground">{label}</dt><dd className="text-sm font-semibold text-foreground sm:text-right">{value}</dd></div>)}
                    </dl>
                    <div className="mt-6 flex items-start gap-3">
                      <Checkbox id="loan-terms-consent" checked={termsAccepted} onCheckedChange={(value) => setTermsAccepted(value === true)} aria-describedby="loan-terms-note" />
                      <div><Label htmlFor="loan-terms-consent" className="cursor-pointer text-sm font-medium leading-6">I understand this is a demonstration and not a real loan offer.</Label><p id="loan-terms-note" className="mt-1 text-xs leading-5 text-muted-foreground">Actual terms require a genuine assessment and published lending terms.</p></div>
                    </div>
                  </div>
                )}

                {error && <p role="alert" className="mt-5 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
                <div className="mt-8 flex flex-col-reverse gap-3 border-t border-brand-line pt-5 sm:flex-row sm:justify-between">
                  {step > 1 ? <Button type="button" variant="outlineBrand" size="lg" className="h-12 px-5" onClick={() => { setError(""); setStep((current) => Math.max(current - 1, 1)); }}><ArrowLeft aria-hidden="true" /> Back</Button> : <span />}
                  {step < 4 ? <Button type="button" variant="default" size="lg" className="h-12 px-5" onClick={advanceStep}>Continue <ArrowRight aria-hidden="true" /></Button> : <Button type="submit" variant="accent" size="lg" disabled={loading} className="h-12 px-5">{loading ? "Submitting sample…" : "Submit sample application"}<ArrowRight aria-hidden="true" /></Button>}
                </div>
              </form>
            </div>

            <aside className="space-y-5 lg:sticky lg:top-24">
              <section className="border border-brand-line bg-brand-sky p-5 sm:p-6">
                <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-brand-blue"><CircleDollarSign aria-hidden="true" className="size-4" /> Application Processing Fee</p>
                <p className="mt-4 font-display text-3xl font-bold text-brand-blue">{formatKes(APP_FEE_KES)}</p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Refundable upon successful loan disbursement, subject to published terms and conditions.</p>
                <dl className="mt-5 space-y-3 border-t border-brand-blue/15 pt-4 text-xs">
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Payment method</dt><dd className="text-right font-semibold text-brand-blue">Not connected</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Payment status</dt><dd className="text-right font-semibold text-brand-blue">No payment requested</dd></div>
                  <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Receipt</dt><dd className="text-right font-semibold text-brand-blue">Not issued</dd></div>
                </dl>
                <div className="mt-4 border-t border-brand-blue/15 pt-4 text-xs leading-5 text-brand-blue">No fee is collected on this website. Do not pay until legitimacy, regulatory compliance, and refund conditions have been verified.</div>
              </section>
              <section className="border border-brand-line bg-background p-5 sm:p-6">
                <div className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-full bg-brand-mint text-brand-forest"><ShieldCheck aria-hidden="true" className="size-4" /></span><h2 className="font-bold text-brand-forest">A clear estimate, not a promise</h2></div>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">Sample rates, amounts and repayment calculations are illustrative. Actual lending terms depend on assessment and published terms.</p>
              </section>
            </aside>
          </div>
        ) : (
          <section className="mx-auto mt-8 max-w-3xl border border-brand-line bg-background p-6 sm:p-10" aria-live="polite">
            <div className="flex items-start gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest"><CheckCircle2 aria-hidden="true" className="size-6" /></span><div><p className="text-xs font-bold uppercase text-brand-forest">Demonstration submitted</p><h2 className="mt-2 text-2xl font-bold text-brand-forest">No application was sent.</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">Your sample details were cleared from this page. No reference number was generated, and nothing was assessed, approved, declined, or disbursed.</p></div></div>
            <div className="mt-7 border-t border-brand-line pt-6">
              <SelectField id="application-sample-status" label="Preview an example application status" value={sampleStatus} onValueChange={(value) => setSampleStatus(value as ApplicationStatus)} options={APPLICATION_DEMO_STATES.map((status) => ({ value: status, label: status }))} hint="All listed outcomes are previews only. They do not affect a real application." />
              <div className="mt-4 flex items-start gap-3 bg-brand-sky p-4 text-sm leading-6 text-brand-blue"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p><strong>{sampleStatus}:</strong> {STATUS_COPY[sampleStatus]}</p></div>
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row"><Button type="button" variant="outlineBrand" size="lg" className="h-12 px-5" onClick={() => { setSubmitted(false); setStep(1); setSampleStatus("Draft"); }}>Start a new sample</Button><CTAButton to="/contact" variant="default" size="lg" className="h-12 px-5">Contact support</CTAButton></div>
          </section>
        )}
      </section>
    </SiteShell>
  );
}