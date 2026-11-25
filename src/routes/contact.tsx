import { useState, type FormEvent, type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  CheckCircle2,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { Field, PageIntro, SelectField, SiteShell, TextField } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { CONTACT_DETAILS, isKenyanMobileNumber } from "@/lib/pesapap-config";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us | Pesa Pap" },
      {
        name: "description",
        content:
          "Contact Pesa Pap by phone, email, or WhatsApp, or visit our office in Westlands, Nairobi.",
      },
      { property: "og:title", content: "Contact Us | Pesa Pap" },
      {
        property: "og:description",
        content:
          "Questions about eligibility, applications, or repayments? Explore Pesa Pap support options.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ContactPage,
});

type ContactValues = {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
};
const INITIAL_CONTACT: ContactValues = {
  fullName: "",
  email: "",
  phone: "",
  subject: "Eligibility question",
  message: "",
};

function ContactPage() {
  const [values, setValues] = useState<ContactValues>(INITIAL_CONTACT);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  function update<K extends keyof ContactValues>(key: K, value: ContactValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (values.phone && !isKenyanMobileNumber(values.phone)) {
      setError("Enter a valid Kenyan mobile number, or leave the phone field blank.");
      return;
    }
    setLoading(true);
    window.setTimeout(() => {
      setValues(INITIAL_CONTACT);
      setSubmitted(true);
      setLoading(false);
    }, 550);
  }

  return (
    <SiteShell activePath="/contact">
      <section className="border-b border-brand-line bg-brand-mint">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <PageIntro
            eyebrow="Here when you need us"
            title="We're Here to Help."
            description="Have a question about eligibility, applications or repayments? Our support team is ready to assist."
          />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <p className="text-xs font-bold uppercase text-brand-forest">Support details</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-forest">
              Reach out when you have a question.
            </h2>
            <p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">
              Call, email, or WhatsApp us, or visit our office at The Mall in Westlands. Support is
              available 24/7.
            </p>

            <div className="mt-8 grid gap-0 sm:grid-cols-2">
              <ContactInfo
                icon={<Phone aria-hidden="true" className="size-5" />}
                label="Phone"
                value={CONTACT_DETAILS.phone}
                href={CONTACT_DETAILS.phoneHref}
              />
              <ContactInfo
                icon={<Mail aria-hidden="true" className="size-5" />}
                label="Email"
                value={CONTACT_DETAILS.email}
                href={CONTACT_DETAILS.emailHref}
              />
              <ContactInfo
                icon={<MapPin aria-hidden="true" className="size-5" />}
                label="Office address"
                value={CONTACT_DETAILS.address}
                href={CONTACT_DETAILS.mapUrl}
                targetBlank
              />
              <ContactInfo
                icon={<Clock3 aria-hidden="true" className="size-5" />}
                label="Working hours"
                value={CONTACT_DETAILS.hours}
              />
              <ContactInfo
                icon={<MessageCircle aria-hidden="true" className="size-5" />}
                label="WhatsApp support"
                value={CONTACT_DETAILS.whatsapp}
                href={CONTACT_DETAILS.whatsappHref}
                targetBlank
              />
            </div>

            <div className="mt-8 overflow-hidden border border-brand-line bg-background">
              <iframe
                title="Map to The Mall, Westlands, Nairobi"
                src={CONTACT_DETAILS.mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-64 w-full border-0"
              />
              <div className="border-t border-brand-line px-4 py-3">
                <a
                  href={CONTACT_DETAILS.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand-blue underline underline-offset-4"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          <div>
            {!submitted ? (
              <form
                onSubmit={handleSubmit}
                className="mt-6 border border-brand-line bg-background p-5 sm:p-8"
              >
                <h2 className="text-xl font-bold text-brand-forest">Send a message</h2>
                <p className="mt-2 text-sm text-muted-foreground">Fields marked * are required.</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                  <TextField
                    id="contact-name"
                    label="Full name"
                    required
                    autoComplete="name"
                    value={values.fullName}
                    onChange={(event) => update("fullName", event.target.value)}
                    placeholder="Your full name"
                  />
                  <TextField
                    id="contact-email"
                    label="Email address"
                    required
                    type="email"
                    autoComplete="email"
                    value={values.email}
                    onChange={(event) => update("email", event.target.value)}
                    placeholder="name@example.com"
                  />
                  <TextField
                    id="contact-phone"
                    label="Phone number"
                    type="tel"
                    autoComplete="tel"
                    value={values.phone}
                    onChange={(event) => update("phone", event.target.value)}
                    placeholder="+254 712 345 678"
                    hint="Optional — Kenyan number format."
                  />
                  <SelectField
                    id="contact-subject"
                    label="Subject"
                    value={values.subject}
                    onValueChange={(value) => update("subject", value)}
                    options={[
                      { value: "Eligibility question", label: "Eligibility question" },
                      { value: "Loan application", label: "Loan application" },
                      { value: "Repayments", label: "Repayments" },
                      { value: "Other", label: "Other" },
                    ]}
                  />
                  <div className="sm:col-span-2">
                    <Field id="contact-message" label="Message" required>
                      <Textarea
                        id="contact-message"
                        required
                        minLength={10}
                        rows={5}
                        className="min-h-32 rounded-md border-brand-line bg-background px-4 py-3"
                        value={values.message}
                        onChange={(event) => update("message", event.target.value)}
                        placeholder="How can we help?"
                      />
                    </Field>
                  </div>
                </div>
                {error && (
                  <p
                    role="alert"
                    className="mt-4 border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive"
                  >
                    {error}
                  </p>
                )}
                <Button
                  type="submit"
                  variant="accent"
                  size="lg"
                  disabled={loading}
                  className="mt-6 h-12 w-full sm:w-auto sm:min-w-48"
                >
                  {loading ? "Preparing preview…" : "Preview message"}
                </Button>
              </form>
            ) : (
              <div
                className="mt-6 border border-brand-line bg-background p-6 sm:p-8"
                aria-live="polite"
              >
                <span className="grid size-12 place-items-center rounded-full bg-brand-mint text-brand-forest">
                  <CheckCircle2 aria-hidden="true" className="size-6" />
                </span>
                <h2 className="mt-5 text-xl font-bold text-brand-forest">
                  Message preview complete
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  Your sample details were cleared. This message was not sent or delivered; support
                  channels are not connected.
                </p>
                <Button
                  type="button"
                  variant="outlineBrand"
                  size="lg"
                  className="mt-6 h-12 px-5"
                  onClick={() => setSubmitted(false)}
                >
                  Start another message
                </Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-soft">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <p className="text-xs font-bold uppercase text-brand-forest">Common questions</p>
          <h2 className="mt-3 font-display text-3xl font-bold text-brand-forest">
            A few helpful answers.
          </h2>
          <div className="mt-7 grid gap-x-10 md:grid-cols-2">
            <FAQ title="What loan terms should I review?">
              Before accepting, review the loan amount, interest rate, fees, total repayable, and
              repayment schedule. Figures shown here are indicative; your final offer sets your
              terms.
            </FAQ>
            <FAQ title="What repayment periods are available?">
              Indicative periods vary by product: Personal Support is 14–30 days, Business Working
              Capital is 30–90 days, and Seasonal Opportunity is 60–90 days.
            </FAQ>
            <FAQ title="Are the displayed rates and terms final?">
              No. The rate, fees, and repayment schedule shown are illustrative. Confirm your exact
              terms in the lender's written offer before accepting.
            </FAQ>
          </div>
          <div className="mt-10 grid gap-6 border-t border-brand-line pt-8 md:grid-cols-2">
            <section id="privacy" className="scroll-mt-24">
              <h3 className="flex items-center gap-2 font-bold text-brand-forest">
                <ShieldCheck aria-hidden="true" className="size-4" /> Privacy notice
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                This prototype keeps form entries in temporary page state only and does not transmit
                or save them. A real service needs an approved privacy notice and secure data
                handling.
              </p>
            </section>
            <section id="terms" className="scroll-mt-24">
              <h3 className="flex items-center gap-2 font-bold text-brand-forest">
                <ShieldCheck aria-hidden="true" className="size-4" /> Loan disclosure
              </h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                Approval, amount, interest, fees and repayment terms depend on an actual assessment
                and published lending terms. No sample shown here represents an offer.
              </p>
            </section>
          </div>
          <p className="mt-8 border-t border-brand-line pt-6 text-xs text-muted-foreground">
            Social media channels are not configured.
          </p>
        </div>
      </section>
    </SiteShell>
  );
}

function ContactInfo({
  icon,
  label,
  value,
  href,
  targetBlank = false,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
  targetBlank?: boolean;
}) {
  return (
    <div className="flex items-start gap-3 border-b border-brand-line py-4 sm:pr-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest">
        {icon}
      </span>
      <div>
        <h3 className="text-sm font-bold text-foreground">{label}</h3>
        {href ? (
          <a
            href={href}
            target={targetBlank ? "_blank" : undefined}
            rel={targetBlank ? "noopener noreferrer" : undefined}
            className="mt-1 inline-block text-sm text-muted-foreground underline underline-offset-4"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 text-sm text-muted-foreground">{value}</p>
        )}
      </div>
    </div>
  );
}

function FAQ({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="border-b border-brand-line py-4">
      <summary className="cursor-pointer list-none font-semibold text-foreground marker:hidden">
        {title}
        <span className="float-right text-brand-forest" aria-hidden="true">
          +
        </span>
      </summary>
      <p className="mt-3 pr-6 text-sm leading-6 text-muted-foreground">{children}</p>
    </details>
  );
}
