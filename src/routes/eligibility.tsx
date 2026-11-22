import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck } from "lucide-react";

import { CTAButton, DemoNotice, PageIntro, SelectField, SiteShell, TextField } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ELIGIBILITY_DEMO_STATES, isKenyanMobileNumber } from "@/lib/pesapap-config";

export const Route = createFileRoute("/eligibility")({
  head: () => ({
    meta: [
      { title: "Check Eligibility | Pesa Pap" },
      { name: "description", content: "Begin a demonstration eligibility check with clear privacy notices and no real credit decision." },
      { property: "og:title", content: "Check Eligibility | Pesa Pap" },
      { property: "og:description", content: "Share sample details to preview Pesa Pap's simple eligibility experience." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EligibilityPage,
});

type EligibilityState = (typeof ELIGIBILITY_DEMO_STATES)[number];

const eligibilityDescriptions: Record<EligibilityState, string> = {
  "Application information received": "Your sample details were checked in this browser. No request was sent and no credit assessment was performed.",
  "Assessment pending": "This sample status represents a pending review. No real assessment has started or been completed.",
  "Further information required": "This sample status shows where a lender might request more details. No real decision has been made.",
  "Not currently eligible": "This is only a sample status. Your eligibility has not been assessed and no actual decision was made.",
};

function EligibilityPage() {
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sampleState, setSampleState] = useState<EligibilityState>(ELIGIBILITY_DEMO_STATES[0]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!isKenyanMobileNumber(phone)) {
      setError("Enter a valid Kenyan mobile number, such as +254 712 345 678.");
      return;
    }
    if (!consent) {
      setError("Please confirm the privacy notice to continue.");
      return;
    }

    setLoading(true);
    window.setTimeout(() => {
      setFullName("");
      setNationalId("");
      setPhone("");
      setEmail("");
      setConsent(false);
      setSubmitted(true);
      setLoading(false);
    }, 550);
  }

  return (
    <SiteShell activePath="/eligibility">
      <section className="border-b border-brand-line bg-brand-mint">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <PageIntro eyebrow="A considered first step" title="Let's Find Out If You're Eligible." description="Complete a few basic details to begin your eligibility assessment. The process is straightforward and designed to help us understand your application." />
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:px-8">
        <div>
          <DemoNotice>Demonstration only. Please use sample details—not real identity information. This form does not send or save your data and cannot assess creditworthiness.</DemoNotice>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="mt-8 border border-brand-line bg-background p-5 sm:p-8">
              <div className="flex items-start justify-between gap-4 border-b border-brand-line pb-5">
                <div><h2 className="text-xl font-bold text-brand-forest">Your basic details</h2><p className="mt-1 text-sm text-muted-foreground">Fields marked * are required.</p></div>
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-sky text-brand-blue"><LockKeyhole aria-hidden="true" className="size-5" /></span>
              </div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <TextField id="eligibility-name" label="Full name" required autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Your full name" />
                <TextField id="eligibility-id" label="National ID number" required inputMode="numeric" autoComplete="off" value={nationalId} onChange={(event) => setNationalId(event.target.value.replace(/\D/g, "").slice(0, 12))} pattern="\d{7,12}" title="Enter 7 to 12 digits" placeholder="Sample number only" />
                <TextField id="eligibility-phone" label="Mobile phone number" required type="tel" autoComplete="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+254 712 345 678" hint="Use a Kenyan mobile number with +254 or 07/01 format." />
                <TextField id="eligibility-email" label="Email address" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="name@example.com" hint="Optional" />
              </div>
              <div className="mt-6 flex items-start gap-3 border-t border-brand-line pt-5">
                <Checkbox id="eligibility-consent" checked={consent} onCheckedChange={(value) => setConsent(value === true)} aria-describedby="eligibility-privacy" />
                <div><Label htmlFor="eligibility-consent" className="cursor-pointer text-sm font-medium leading-6">I have read and agree to the privacy notice.</Label><p id="eligibility-privacy" className="mt-1 text-xs leading-5 text-muted-foreground">This prototype does not transmit or store the details entered. A production service would require an approved privacy policy and secure processing.</p></div>
              </div>
              {error && <p role="alert" className="mt-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
              <Button type="submit" variant="accent" size="lg" disabled={loading} className="mt-6 h-12 w-full sm:w-auto sm:min-w-56">
                {loading ? "Checking sample details…" : "Check sample eligibility"}<ArrowRight aria-hidden="true" />
              </Button>
            </form>
          ) : (
            <div className="mt-8 border border-brand-line bg-background p-5 sm:p-8" aria-live="polite">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest"><CheckCircle2 aria-hidden="true" className="size-6" /></span>
                <div><p className="text-xs font-bold uppercase text-brand-forest">Demonstration result</p><h2 className="mt-2 text-2xl font-bold text-brand-forest">{sampleState}</h2><p className="mt-3 text-sm leading-6 text-muted-foreground">{eligibilityDescriptions[sampleState]}</p></div>
              </div>
              <div className="mt-6 border-t border-brand-line pt-5">
                <SelectField id="eligibility-sample-state" label="Preview another sample status" value={sampleState} onValueChange={(value) => setSampleState(value as EligibilityState)} options={ELIGIBILITY_DEMO_STATES.map((state) => ({ value: state, label: state }))} hint="Changing this preview does not change an actual application." />
              </div>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <CTAButton to="/loan-now" size="lg" variant="accent" className="h-12 px-5">Continue to loan application</CTAButton>
                <Button type="button" variant="outlineBrand" size="lg" className="h-12 px-5" onClick={() => setSubmitted(false)}>Start again</Button>
              </div>
            </div>
          )}
        </div>
        <aside className="lg:pl-4">
          <div className="border-l-2 border-brand-green pl-5">
            <p className="text-xs font-bold uppercase text-brand-forest">What happens next</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight text-brand-forest">Good decisions begin with clear information.</h2>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">An eligibility check is only a starting point. Any real assessment, offer or loan terms would be provided by a properly configured lending service.</p>
          </div>
          <div className="mt-8 space-y-0">
            <div className="flex gap-4 border-b border-brand-line py-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-mint text-sm font-bold text-brand-forest">1</span><div><h3 className="font-bold">Share a few details</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Use sample information in this website demonstration.</p></div></div>
            <div className="flex gap-4 border-b border-brand-line py-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-mint text-sm font-bold text-brand-forest">2</span><div><h3 className="font-bold">Review the sample response</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Preview possible status messages without receiving a credit score or decision.</p></div></div>
            <div className="flex gap-4 py-5"><span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-mint text-sm font-bold text-brand-forest">3</span><div><h3 className="font-bold">Explore the loan form</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">Continue to the guided application preview whenever you're ready.</p></div></div>
          </div>
          <div className="mt-6 flex items-start gap-3 bg-brand-sky p-4 text-sm leading-6 text-brand-blue"><ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" /><p>No guaranteed approval, credit score or loan amount is generated by this page.</p></div>
        </aside>
      </section>
    </SiteShell>
  );
}