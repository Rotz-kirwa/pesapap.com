import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { AlertCircle, ArrowRight, CheckCircle2, ClipboardList } from "lucide-react";

import { SelectField, SiteShell, TextField } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { useDemoLendingStore } from "@/lib/lending/demo-store";
import { LendingDomainError } from "@/lib/lending/service";
import type { PreliminaryLoanRequest } from "@/lib/lending/types";
import { APP_FEE_KES, ELIGIBILITY_PRECHECK_TIERS, formatKes } from "@/lib/pesapap-config";

export const Route = createFileRoute("/loan-now")({
  head: () => ({
    meta: [
      { title: "Preliminary Loan Request | Pesa Pap" },
      {
        name: "description",
        content:
          "Start a preliminary Pesa Pap loan request with your name, National ID, phone number, and requested loan range.",
      },
      { property: "og:title", content: "Preliminary Loan Request | Pesa Pap" },
      {
        property: "og:description",
        content: "Submit basic contact details to begin a Pesa Pap loan request.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: LoanNowPage,
});

function LoanNowPage() {
  const store = useDemoLendingStore();
  const [fullName, setFullName] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [loanCategory, setLoanCategory] = useState("");
  const [request, setRequest] = useState<PreliminaryLoanRequest | null>(null);
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const selectedTier = ELIGIBILITY_PRECHECK_TIERS.find((tier) => tier.name === loanCategory);
    if (!selectedTier) {
      setError("Select one of the available loan ranges.");
      return;
    }

    try {
      const submittedRequest = store.submitCustomerPreliminaryRequest({
        fullName,
        nationalId,
        phone,
        loanCategory: selectedTier.name,
      });
      setRequest(submittedRequest);
      setPaymentPhone(phone);
    } catch (caught) {
      if (caught instanceof LendingDomainError) {
        setError(caught.message);
      } else {
        setError("Could not submit your preliminary request. Please review your details.");
      }
    }
  }

  return (
    <SiteShell activePath="/loan-now">
      {!request && (
        <section className="border-b border-brand-line bg-brand-mint">
          <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
            <p className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wide text-brand-forest">
              <span className="size-1.5 rounded-full bg-brand-orange" /> Preliminary request
            </p>
            <h1 className="mt-1 font-display text-2xl font-bold leading-tight text-brand-forest sm:text-3xl">
              Apply for a Loan
            </h1>
            <p className="mt-1 text-xs leading-5 text-muted-foreground sm:text-sm">
              Enter your name, National ID, phone number, and requested loan range to start a
              preliminary loan request.
            </p>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-10">
        {request ? (
          <div
            aria-live="polite"
            className="rounded-lg border border-brand-line bg-background p-5 shadow-sm sm:p-6"
          >
            <span className="grid size-10 place-items-center rounded-full bg-brand-mint text-brand-forest">
              <CheckCircle2 aria-hidden="true" className="size-5" />
            </span>
            <p className="mt-4 text-xs font-bold uppercase text-brand-forest">Request recorded</p>
            <h2 className="mt-1 text-xl font-bold text-brand-forest">
              Thank you, {request.applicantName}! 🎉
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {request.loanCategory} request:{" "}
              <strong>
                {formatKes(request.minimumAmountKes)}–{formatKes(request.maximumAmountKes)}
              </strong>
              .
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Approval requires full verification and underwriting.
            </p>

            <section className="mt-5 rounded-lg border border-brand-line bg-brand-soft p-4 sm:p-5">
              <h3 className="text-base font-bold text-brand-forest">
                Next: Confirm your application
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                A refundable {formatKes(APP_FEE_KES)} processing deposit is required to proceed. It
                will be refunded if your loan is disbursed.
              </p>

              <h4 className="mt-5 text-sm font-bold text-brand-forest">Confirm payment</h4>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                Enter your registered M-Pesa number. Once connected, an STK Push will be sent. To
                pay, enter your PIN in the official M-Pesa prompt on your phone.
              </p>
              <div className="mt-4 max-w-md">
                <TextField
                  id="confirmation-mpesa-phone"
                  label="M-Pesa number"
                  required
                  type="tel"
                  autoComplete="tel"
                  value={paymentPhone}
                  onChange={(event) => setPaymentPhone(event.target.value)}
                  placeholder="+254 712 345 678"
                />
              </div>
              <Button
                type="button"
                variant="accent"
                size="lg"
                disabled
                className="mt-4 h-11 font-bold"
              >
                Confirm payment
              </Button>
            </section>

            <p className="mt-4 inline-flex items-center gap-2 rounded-md bg-brand-sky px-3 py-2 text-xs font-semibold text-brand-blue">
              <ClipboardList aria-hidden="true" className="size-4" />
              Reference: <span className="font-mono">{request.id}</span>
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="rounded-lg border border-brand-line bg-background p-5 shadow-sm sm:p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="loan-name"
                label="Full name"
                required
                autoComplete="name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Enter your full name"
              />
              <TextField
                id="loan-id"
                label="National ID number"
                required
                inputMode="numeric"
                autoComplete="off"
                value={nationalId}
                onChange={(event) =>
                  setNationalId(event.target.value.replace(/\D/g, "").slice(0, 12))
                }
                pattern="[0-9]{7,12}"
                title="Enter 7 to 12 digits"
                placeholder="7–12 digits"
              />
              <TextField
                id="loan-phone"
                label="Registered M-Pesa phone number"
                required
                type="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+254 712 345 678"
              />
              <SelectField
                id="loan-range"
                label="Requested loan range"
                required
                value={loanCategory}
                onValueChange={setLoanCategory}
                placeholder="Select a loan range"
                options={ELIGIBILITY_PRECHECK_TIERS.map((tier) => ({
                  value: tier.name,
                  label: `${tier.name} · ${formatKes(tier.minimumKes)}–${formatKes(tier.maximumKes)}`,
                }))}
              />
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
              Submit preliminary request <ArrowRight aria-hidden="true" />
            </Button>
            <p className="mt-3 text-xs leading-5 text-muted-foreground">
              No payment is collected at this stage. A preliminary request is not an approval; a
              full application and verification are required for an affordability assessment.
            </p>
          </form>
        )}
      </section>
    </SiteShell>
  );
}
