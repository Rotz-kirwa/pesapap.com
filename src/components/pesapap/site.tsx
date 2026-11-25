import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowRight, Check, CircleDollarSign, Menu, ShieldCheck } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { DEMO_DISBURSEMENT_ACTIVITY } from "@/lib/disbursement-activity";
import { CONTACT_DETAILS, formatKes } from "@/lib/pesapap-config";

export type PesaPapPath = "/" | "/eligibility" | "/loan-now" | "/testimonials" | "/contact";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/eligibility", label: "Eligibility" },
  { to: "/loan-now", label: "Loan now" },
  { to: "/testimonials", label: "Stories" },
  { to: "/contact", label: "Contact" },
] as const;

export function BrandMark({
  compact = false,
  reversed = false,
}: {
  compact?: boolean;
  reversed?: boolean;
}) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <img
        src="/logo.webp?v=2"
        alt=""
        width={40}
        height={40}
        className="size-10 shrink-0 rounded-full bg-white object-contain p-0.5 shadow-sm ring-2 ring-brand-green/45"
      />
      <span className="flex flex-col leading-none">
        <span className="inline-flex items-baseline gap-0.5 font-display text-[1.22rem] font-black tracking-tight">
          <span className={reversed ? "text-primary-foreground" : "text-brand-forest"}>Pesa</span>
          <span
            className={`bg-clip-text text-transparent ${
              reversed
                ? "bg-gradient-to-r from-brand-orange to-brand-green"
                : "bg-gradient-to-r from-brand-orange via-amber-500 to-brand-forest"
            }`}
          >
            Pap
          </span>
          <span
            aria-hidden="true"
            className="ml-0.5 inline-block size-1.5 rounded-full bg-brand-orange"
          />
        </span>
        {!compact && (
          <span
            className={`mt-1 inline-flex items-center gap-1.5 text-[0.58rem] font-extrabold uppercase tracking-[0.11em] sm:text-[0.6rem] sm:tracking-[0.14em] ${
              reversed ? "text-brand-green/90" : "text-brand-forest/75"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-[2px] w-2.5 shrink-0 rounded-full ${reversed ? "bg-brand-orange" : "bg-brand-green"}`}
            />
            Fast · Efficient Loans
          </span>
        )}
      </span>
    </span>
  );
}

export function CTAButton({ to, children, ...props }: ButtonProps & { to: PesaPapPath }) {
  return (
    <Button asChild {...props}>
      <Link to={to}>
        {children}
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function SiteShell({
  activePath,
  children,
}: {
  activePath: PesaPapPath;
  children: ReactNode;
}) {
  return (
    <div className="min-h-screen overflow-x-clip bg-background text-foreground">
      <SiteHeader activePath={activePath} />
      {activePath === "/" && <SyntheticActivityTicker />}
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function SyntheticActivityTicker() {
  const firstGroupRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const firstGroup = firstGroupRef.current;
    const track = trackRef.current;
    if (!firstGroup || !track) return;

    const updateDuration = (width: number) => {
      if (width > 0) {
        track.style.setProperty("--marquee-duration", `${width / 20}s`);
      }
    };

    if (typeof ResizeObserver === "undefined") {
      updateDuration(firstGroup.getBoundingClientRect().width);
      return;
    }

    const observer = new ResizeObserver(([entry]) => {
      if (entry) updateDuration(entry.contentRect.width);
    });
    observer.observe(firstGroup);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      aria-label="Disbursements — demo activity with synthetic examples"
      className="overflow-hidden border-b border-primary-foreground/15 bg-brand-forest text-primary-foreground"
    >
      <div className="mx-auto flex h-11 max-w-7xl items-center gap-2 px-3 text-xs sm:h-9 sm:gap-3 sm:px-6 lg:px-8">
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-brand-ink/85 px-2 py-1 text-[0.58rem] font-bold uppercase tracking-wide text-amber-300 ring-1 ring-brand-orange/40 sm:px-2.5 sm:py-0.5 sm:text-[0.62rem]">
          <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-brand-green" />
          <span>Disbursements</span>
        </span>

        <div
          className="relative min-w-0 flex-1 overflow-hidden motion-reduce:overflow-x-auto"
          style={{
            maskImage:
              "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
            WebkitMaskImage:
              "linear-gradient(to right, transparent, black 16px, black calc(100% - 16px), transparent)",
          }}
        >
          <div
            ref={trackRef}
            aria-hidden="true"
            className="marquee-rtl flex w-max items-center motion-reduce:animate-none"
          >
            {[0, 1].map((copyIndex) => (
              <div
                key={copyIndex}
                ref={copyIndex === 0 ? firstGroupRef : undefined}
                className="flex shrink-0 items-center"
              >
                {DEMO_DISBURSEMENT_ACTIVITY.map((item) => (
                  <span
                    key={`${copyIndex}-${item.id}`}
                    className="inline-flex items-center gap-1.5 whitespace-nowrap pr-8"
                  >
                    <span className="font-bold text-amber-300">{item.name}</span>
                    <span className="font-mono text-[0.7rem] text-sky-200">{item.maskedPhone}</span>
                    <span className="text-primary-foreground/85">{item.loanCategory}:</span>
                    <span className="font-bold text-brand-green">{formatKes(item.amountKes)}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StatusPill({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "info" | "warning" | "success" | "danger";
}) {
  const styles = {
    neutral: "border-brand-line bg-brand-soft text-foreground",
    info: "border-brand-blue/30 bg-brand-sky text-brand-blue",
    warning: "border-brand-orange/50 bg-brand-orange/15 text-brand-ink",
    success: "border-brand-green/60 bg-brand-mint text-brand-forest",
    danger: "border-destructive/40 bg-destructive/10 text-destructive",
  }[tone];

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[0.68rem] font-bold uppercase tracking-wide ${styles}`}
    >
      {label}
    </span>
  );
}

function SiteHeader({ activePath }: { activePath: PesaPapPath }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="hidden bg-brand-forest text-primary-foreground sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs font-medium">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck aria-hidden="true" className="size-3.5" /> Clear terms. Thoughtful
            decisions.
          </span>
          <span>Designed for Kenya</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-brand-line bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Pesa Pap home" className="shrink-0">
            <BrandMark />
          </Link>
          <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                aria-current={activePath === item.to ? "page" : undefined}
                className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${activePath === item.to ? "bg-brand-mint text-brand-forest" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <CTAButton
              to="/eligibility"
              size="default"
              variant="outlineBrand"
              className="h-10 px-4"
            >
              Check eligibility
            </CTAButton>
            <CTAButton to="/loan-now" size="default" variant="accent" className="h-10 px-4">
              Apply now
            </CTAButton>
          </div>
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation menu"
              >
                <Menu aria-hidden="true" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="flex w-[min(19rem,80vw)] flex-col gap-0 border-l border-brand-line bg-background p-0 lg:hidden"
            >
              <SheetTitle className="sr-only">Navigation menu</SheetTitle>
              <SheetDescription className="sr-only">
                Navigate Pesa Pap pages and loan tools.
              </SheetDescription>
              <div className="border-b border-brand-line px-5 py-4 pr-12">
                <Link
                  to="/"
                  aria-label="Pesa Pap home"
                  onClick={() => setMenuOpen(false)}
                  className="inline-block"
                >
                  <BrandMark compact />
                </Link>
              </div>
              <nav
                aria-label="Mobile navigation"
                className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-4"
              >
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-current={activePath === item.to ? "page" : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={`rounded-md px-3.5 py-3 text-sm font-semibold transition-colors ${
                      activePath === item.to
                        ? "bg-brand-mint text-brand-forest"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="flex flex-col gap-2.5 border-t border-brand-line bg-brand-soft/60 p-4">
                <CTAButton
                  to="/loan-now"
                  size="default"
                  variant="accent"
                  className="h-11 w-full justify-between px-4 font-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  Apply now
                </CTAButton>
                <CTAButton
                  to="/eligibility"
                  size="default"
                  variant="brandGreen"
                  className="h-11 w-full justify-between px-4 font-bold"
                  onClick={() => setMenuOpen(false)}
                >
                  Check eligibility
                </CTAButton>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-brand-ink text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <Link to="/" aria-label="Pesa Pap home">
            <BrandMark reversed />
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/75">
            A straightforward digital lending experience, built around clear information and
            considered choices.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-green">
            <CircleDollarSign aria-hidden="true" className="size-4" /> Designed for Kenya
          </p>
        </div>
        <div>
          <h2 className="text-sm font-bold">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li>
              <Link to="/" className="transition-colors hover:text-primary-foreground">
                Home
              </Link>
            </li>
            <li>
              <Link to="/eligibility" className="transition-colors hover:text-primary-foreground">
                Eligibility
              </Link>
            </li>
            <li>
              <Link to="/loan-now" className="transition-colors hover:text-primary-foreground">
                Loan application
              </Link>
            </li>
            <li>
              <Link to="/testimonials" className="transition-colors hover:text-primary-foreground">
                Customer stories
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">Support</h2>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li>
              <Link to="/contact" className="transition-colors hover:text-primary-foreground">
                Contact us
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                hash="privacy"
                className="transition-colors hover:text-primary-foreground"
              >
                Privacy notice
              </Link>
            </li>
            <li>
              <Link
                to="/contact"
                hash="terms"
                className="transition-colors hover:text-primary-foreground"
              >
                Loan disclosure
              </Link>
            </li>
            <li>
              <span>
                Support: {CONTACT_DETAILS.phone} · {CONTACT_DETAILS.email}
              </span>
            </li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">A note on lending</h2>
          <p className="mt-4 text-sm leading-6 text-primary-foreground/75">
            Approval, amounts, interest and repayment terms depend on an actual assessment and
            published lending terms. Figures shown are illustrative.
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/65 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Pesa Pap. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

export function PageIntro({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-3xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase text-brand-forest">
        <span className="size-2 rounded-full bg-brand-orange" /> {eyebrow}
      </p>
      <h1 className="font-display text-balance text-4xl font-bold leading-tight text-brand-forest sm:text-5xl">
        {title}
      </h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div
      role="note"
      className="flex items-start gap-3 border border-brand-line bg-brand-mint px-4 py-3 text-sm leading-6 text-brand-forest"
    >
      <ShieldCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  centered = false,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  centered?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${centered ? "mx-auto text-center" : ""}`}>
      <p className="text-xs font-bold uppercase text-brand-forest">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-brand-forest sm:text-4xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>
      )}
    </div>
  );
}

export function StepTile({
  number,
  title,
  description,
  icon,
}: {
  number: string;
  title: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <article className="border-t-2 border-brand-green bg-background px-5 py-6">
      <div className="flex items-center justify-between">
        <span className="grid size-11 place-items-center rounded-full bg-brand-mint text-brand-forest">
          {icon}
        </span>
        <span className="font-display text-2xl font-bold text-brand-green">{number}</span>
      </div>
      <h3 className="mt-6 text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
    </article>
  );
}

export function Field({
  id,
  label,
  required = false,
  hint,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-foreground">
        {label}
        {required && (
          <span className="ml-1 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </Label>
      {children}
      {hint && <p className="text-xs leading-5 text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function TextField({
  id,
  label,
  required = false,
  hint,
  ...props
}: ComponentProps<typeof Input> & { id: string; label: string; hint?: string }) {
  return (
    <Field id={id} label={label} required={required} {...(hint === undefined ? {} : { hint })}>
      <Input
        id={id}
        required={required}
        className="h-12 rounded-md border-brand-line bg-background px-4"
        {...props}
      />
    </Field>
  );
}

export function SelectField({
  id,
  label,
  value,
  onValueChange,
  options,
  hint,
  placeholder,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  hint?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <Field id={id} label={label} required={required} {...(hint === undefined ? {} : { hint })}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="h-12 rounded-md border-brand-line bg-background px-4">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function CustomerStoryCard({
  name,
  role,
  title,
  story,
  image,
  imageAlt,
}: {
  name: string;
  role: string;
  title: string;
  story: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <article className="overflow-hidden border border-brand-line bg-background">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-mint">
        <img src={image} alt={imageAlt} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 bg-background/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase text-brand-forest">
          Customer story
        </span>
      </div>
      <div className="p-5">
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{story}</p>
        <div className="mt-5 border-t border-brand-line pt-4">
          <p className="font-bold text-foreground">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{role}</p>
        </div>
      </div>
    </article>
  );
}

export function IconFeature({
  icon,
  title,
  children,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
}) {
  return (
    <article className="flex gap-4 border-b border-brand-line py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-sky text-brand-blue">
        {icon}
      </span>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
      </div>
    </article>
  );
}

export function ConfirmationMark() {
  return (
    <span className="grid size-12 place-items-center rounded-full bg-brand-mint text-brand-forest">
      <Check aria-hidden="true" className="size-6" />
    </span>
  );
}
