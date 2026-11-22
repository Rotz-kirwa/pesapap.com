import { useState, type ComponentProps, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  CircleDollarSign,
  FileText,
  Leaf,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";

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
import { CONTACT_PLACEHOLDERS } from "@/lib/pesapap-config";

export type PesaPapPath = "/" | "/eligibility" | "/loan-now" | "/testimonials" | "/contact";

const NAV_ITEMS = [
  { to: "/", label: "Home" },
  { to: "/eligibility", label: "Eligibility" },
  { to: "/loan-now", label: "Loan now" },
  { to: "/testimonials", label: "Stories" },
  { to: "/contact", label: "Contact" },
] as const;

export function BrandMark({ compact = false, reversed = false }: { compact?: boolean; reversed?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span className="grid size-10 place-items-center rounded-full bg-brand-forest text-primary-foreground">
        <Leaf aria-hidden="true" className="size-5" />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display text-lg font-extrabold ${reversed ? "text-primary-foreground" : "text-brand-forest"}`}>Pesa Pap</span>
        {!compact && <span className={`mt-1 text-[0.65rem] font-semibold ${reversed ? "text-primary-foreground/70" : "text-muted-foreground"}`}>MOVE WITH CLARITY</span>}
      </span>
    </span>
  );
}

export function CTAButton({
  to,
  children,
  ...props
}: ButtonProps & { to: PesaPapPath }) {
  return (
    <Button asChild {...props}>
      <Link to={to}>
        {children}
        <ArrowRight aria-hidden="true" />
      </Link>
    </Button>
  );
}

export function SiteShell({ activePath, children }: { activePath: PesaPapPath; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SiteHeader activePath={activePath} />
      <main>{children}</main>
      <SiteFooter />
    </div>
  );
}

function SiteHeader({ activePath }: { activePath: PesaPapPath }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="hidden bg-brand-forest text-primary-foreground sm:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-2 text-xs font-medium">
          <span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" className="size-3.5" /> Clear terms. Thoughtful decisions.</span>
          <span>Designed for Kenya</span>
        </div>
      </div>
      <header className="sticky top-0 z-40 border-b border-brand-line bg-background/95 backdrop-blur">
        <div className="mx-auto flex min-h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Pesa Pap home" className="shrink-0"><BrandMark /></Link>
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
            <CTAButton to="/eligibility" size="default" variant="outlineBrand" className="h-10 px-4">Check eligibility</CTAButton>
            <CTAButton to="/loan-now" size="default" variant="accent" className="h-10 px-4">Apply now</CTAButton>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
        {menuOpen && (
          <nav aria-label="Mobile navigation" className="border-t border-brand-line bg-background px-4 py-3 lg:hidden">
            <div className="mx-auto grid max-w-7xl gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={activePath === item.to ? "page" : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`rounded-md px-3 py-3 text-sm font-semibold ${activePath === item.to ? "bg-brand-mint text-brand-forest" : "text-foreground hover:bg-muted"}`}
                >
                  {item.label}
                </Link>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 border-t border-brand-line pt-3">
                <CTAButton to="/eligibility" size="default" variant="outlineBrand" className="h-11 px-3" onClick={() => setMenuOpen(false)}>Check eligibility</CTAButton>
                <CTAButton to="/loan-now" size="default" variant="accent" className="h-11 px-3" onClick={() => setMenuOpen(false)}>Apply now</CTAButton>
              </div>
            </div>
          </nav>
        )}
      </header>
    </>
  );
}

function SiteFooter() {
  return (
    <footer className="bg-brand-ink text-primary-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr] lg:px-8">
        <div>
          <Link to="/" aria-label="Pesa Pap home"><BrandMark reversed /></Link>
          <p className="mt-4 max-w-xs text-sm leading-6 text-primary-foreground/75">
            A straightforward digital lending experience, built around clear information and considered choices.
          </p>
          <p className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-brand-green"><CircleDollarSign aria-hidden="true" className="size-4" /> Designed for Kenya</p>
        </div>
        <div>
          <h2 className="text-sm font-bold">Explore</h2>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li><Link to="/" className="transition-colors hover:text-primary-foreground">Home</Link></li>
            <li><Link to="/eligibility" className="transition-colors hover:text-primary-foreground">Eligibility</Link></li>
            <li><Link to="/loan-now" className="transition-colors hover:text-primary-foreground">Loan application</Link></li>
            <li><Link to="/testimonials" className="transition-colors hover:text-primary-foreground">Demo stories</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">Support</h2>
          <ul className="mt-4 space-y-3 text-sm text-primary-foreground/75">
            <li><Link to="/contact" className="transition-colors hover:text-primary-foreground">Contact us</Link></li>
            <li><Link to="/contact" hash="privacy" className="transition-colors hover:text-primary-foreground">Privacy notice</Link></li>
            <li><Link to="/contact" hash="terms" className="transition-colors hover:text-primary-foreground">Loan disclosure</Link></li>
            <li><span>Support channels: {CONTACT_PLACEHOLDERS.email}</span></li>
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">A note on lending</h2>
          <p className="mt-4 text-sm leading-6 text-primary-foreground/75">
            Approval, amounts, interest and repayment terms depend on an actual assessment and published lending terms. Figures on this website are illustrative demonstrations.
          </p>
        </div>
      </div>
      <div className="border-t border-primary-foreground/15">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-5 text-xs text-primary-foreground/65 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
          <span>© {new Date().getFullYear()} Pesa Pap. All rights reserved.</span>
          <span className="inline-flex items-center gap-2"><FileText aria-hidden="true" className="size-3.5" /> Demonstration website — no loan decisions or payments are made here.</span>
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
      <h1 className="font-display text-balance text-4xl font-bold leading-tight text-brand-forest sm:text-5xl">{title}</h1>
      <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{description}</p>
    </div>
  );
}

export function DemoNotice({ children }: { children: ReactNode }) {
  return (
    <div role="note" className="flex items-start gap-3 border border-brand-line bg-brand-mint px-4 py-3 text-sm leading-6 text-brand-forest">
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
      <h2 className="mt-3 font-display text-3xl font-bold leading-tight text-brand-forest sm:text-4xl">{title}</h2>
      {description && <p className="mt-4 text-base leading-7 text-muted-foreground">{description}</p>}
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
        <span className="grid size-11 place-items-center rounded-full bg-brand-mint text-brand-forest">{icon}</span>
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
        {label}{required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
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
      <Input id={id} required={required} className="h-12 rounded-md border-brand-line bg-background px-4" {...props} />
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
}: {
  id: string;
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: readonly { value: string; label: string }[];
  hint?: string;
}) {
  return (
    <Field id={id} label={label} {...(hint === undefined ? {} : { hint })}>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id={id} className="h-12 rounded-md border-brand-line bg-background px-4">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

export function DemoStoryCard({
  name,
  role,
  quote,
  image,
  imageAlt,
}: {
  name: string;
  role: string;
  quote: string;
  image: string;
  imageAlt: string;
}) {
  return (
    <article className="overflow-hidden border border-brand-line bg-background">
      <div className="relative aspect-[4/3] overflow-hidden bg-brand-mint">
        <img src={image} alt={imageAlt} loading="lazy" className="h-full w-full object-cover" />
        <span className="absolute left-3 top-3 bg-background/95 px-2.5 py-1 text-[0.65rem] font-bold uppercase text-brand-forest">Demo story</span>
      </div>
      <div className="p-5">
        <p className="text-sm leading-6 text-muted-foreground">“{quote}”</p>
        <p className="mt-3 inline-flex items-center gap-1 text-xs text-brand-orange"><span aria-hidden="true">★★★★★</span><span className="text-muted-foreground">illustrative, not a rating</span></p>
        <div className="mt-5 border-t border-brand-line pt-4">
          <p className="font-bold text-foreground">{name}</p>
          <p className="mt-1 text-xs text-muted-foreground">{role} · illustrative profile</p>
        </div>
      </div>
    </article>
  );
}

export function IconFeature({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="flex gap-4 border-b border-brand-line py-5">
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-sky text-brand-blue">{icon}</span>
      <div>
        <h3 className="font-bold text-foreground">{title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">{children}</p>
      </div>
    </article>
  );
}

export function ConfirmationMark() {
  return <span className="grid size-12 place-items-center rounded-full bg-brand-mint text-brand-forest"><Check aria-hidden="true" className="size-6" /></span>;
}