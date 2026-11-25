import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  BadgeCheck,
  Banknote,
  BriefcaseBusiness,
  ClipboardCheck,
  Clock3,
  FileText,
  HandCoins,
  HeartHandshake,
  Home,
  Leaf,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import {
  CTAButton,
  DemoNotice,
  DemoStoryCard,
  IconFeature,
  SectionHeading,
  SiteShell,
  StepTile,
} from "@/components/pesapap/site";
import { DEMO_STORIES } from "@/lib/demo-stories";
import {
  DEMO_PRODUCTS,
  formatKes,
  HERO_CYCLE_AMOUNTS_KES,
  HERO_DROP_AMOUNTS,
  HERO_FLOW_AMOUNTS,
  SAMPLE_MONTHLY_RATE_PERCENT,
} from "@/lib/pesapap-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pesa Pap | Your next financial move starts here" },
      {
        name: "description",
        content:
          "Explore a clear, convenient lending experience for your next financial move with Pesa Pap.",
      },
      { property: "og:title", content: "Pesa Pap | Your next financial move starts here" },
      {
        property: "og:description",
        content:
          "Simple applications. Transparent lending. A smarter way to explore financial opportunities.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [amountIndex, setAmountIndex] = useState(0);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setAmountIndex((current) => (current + 1) % HERO_CYCLE_AMOUNTS_KES.length);
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const activeAmountKes = HERO_CYCLE_AMOUNTS_KES[amountIndex] ?? HERO_CYCLE_AMOUNTS_KES[0];

  return (
    <SiteShell activePath="/">
      <section className="relative overflow-hidden border-b border-brand-line bg-brand-ink text-primary-foreground">
        <img
          src="/images/hero-celebrating.jpg?v=2"
          alt="A joyful Kenyan loan recipient celebrating at home with smartphone surrounded by floating Kenyan Shilling banknotes"
          width={1376}
          height={768}
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-[72%_25%] lg:object-[66%_22%]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-r from-brand-ink/90 via-brand-ink/70 to-brand-ink/25"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-t from-brand-ink/80 via-transparent to-brand-ink/15 lg:from-brand-ink/45"
        />

        <div className="relative z-10 mx-auto grid min-h-[34rem] max-w-7xl content-between gap-4 px-4 pb-5 pt-8 sm:px-6 sm:pb-7 sm:pt-12 lg:min-h-[37rem] lg:grid-cols-[1fr_auto] lg:items-stretch lg:gap-12 lg:px-8 lg:pb-8 lg:pt-14">
          <div className="flex max-w-lg flex-col justify-between">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-brand-ink/55 px-3 py-1.5 text-xs font-bold uppercase text-brand-green backdrop-blur-sm">
                <Leaf aria-hidden="true" className="size-3.5" /> Pesa Pap · Kenya
              </p>
              <h1 className="mt-4 font-display text-balance text-4xl font-bold leading-[1.08] text-primary-foreground sm:text-5xl lg:text-6xl">
                Funds for Your Home &amp; Goals.
              </h1>
              <p className="mt-3 text-base leading-6 text-primary-foreground/85 sm:text-lg">
                Simple, transparent digital lending.
              </p>
            </div>

            <div className="mt-36 sm:mt-40 lg:mt-44">
              <div className="flex flex-row flex-wrap items-center gap-3">
                <CTAButton
                  to="/loan-now"
                  variant="accent"
                  size="lg"
                  className="h-11 px-5 font-bold shadow-md sm:h-12 sm:px-6"
                >
                  Apply now
                </CTAButton>
                <CTAButton
                  to="/eligibility"
                  variant="brandGreen"
                  size="lg"
                  className="h-11 px-5 font-bold shadow-md sm:h-12 sm:px-6"
                >
                  Check eligibility
                </CTAButton>
              </div>
            </div>
          </div>

          <div
            aria-label="Illustrative preview of loan fund flow"
            className="mt-2 w-full max-w-[17rem] self-end rounded-lg border border-primary-foreground/20 bg-brand-ink/75 px-3 py-2.5 shadow-lg backdrop-blur-md lg:mt-0 lg:justify-self-end"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 text-[0.6rem] font-bold uppercase tracking-wide text-brand-green">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-brand-green" />
                Disbursements
              </span>
              <span
                key={activeAmountKes}
                className="font-display text-xs font-bold tabular-nums text-brand-orange animate-in fade-in slide-in-from-bottom-1 duration-300"
              >
                +{formatKes(activeAmountKes)}
              </span>
            </div>

            <div
              aria-hidden="true"
              className="relative mt-2 flex h-12 items-center justify-between overflow-hidden rounded-md border border-primary-foreground/15 bg-brand-forest/35 px-3"
            >
              <div className="absolute left-9 right-10 top-1/2 border-t border-dashed border-brand-green/45" />

              <div className="relative z-10 grid size-7 place-items-center rounded-full bg-brand-orange/20 text-brand-orange ring-1 ring-brand-orange/45">
                <Banknote className="size-3.5" />
              </div>

              <div className="pointer-events-none absolute inset-y-0 left-8 right-9 flex items-center">
                {HERO_FLOW_AMOUNTS.map((amountLabel, index) => {
                  const chipStyles = [
                    "bg-brand-green text-brand-ink",
                    "bg-brand-orange text-brand-ink",
                    "bg-brand-mint text-brand-forest",
                    "bg-amber-300 text-brand-ink",
                  ][index % 4];
                  return (
                    <span
                      key={amountLabel}
                      className={`money-into-home absolute left-0 inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[0.55rem] font-extrabold shadow-sm ${chipStyles}`}
                      style={{ animationDelay: `${index * 1.1}s` }}
                    >
                      <Banknote className="size-2.5" /> {amountLabel}
                    </span>
                  );
                })}
              </div>

              <div className="relative z-10 flex items-center justify-center">
                {HERO_DROP_AMOUNTS.map((amountLabel, index) => (
                  <span
                    key={amountLabel}
                    className={`money-drop-home pointer-events-none absolute -top-1.5 inline-flex items-center rounded-full px-1 py-0.5 text-[0.5rem] font-extrabold text-brand-ink shadow-sm ${
                      index === 0 ? "bg-brand-orange" : "bg-brand-green"
                    }`}
                    style={{ animationDelay: index === 0 ? "0.5s" : "2.2s" }}
                  >
                    {amountLabel}
                  </span>
                ))}
                <span className="home-receive-pulse absolute inset-0 rounded-full bg-brand-green/50" />
                <span className="relative grid size-8 place-items-center rounded-full bg-brand-green text-brand-ink shadow-md ring-1 ring-primary-foreground/30">
                  <Home className="size-4" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        aria-label="Pesa Pap reach and availability"
        className="border-b border-amber-400 bg-amber-300 text-brand-ink"
      >
        <div className="mx-auto grid max-w-7xl grid-cols-3 divide-x divide-brand-ink/20 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
          {[
            { value: "100K", label: "Customers" },
            { value: "47", label: "Counties" },
            { value: "24/7", label: "Accessible" },
          ].map((stat) => (
            <div key={stat.label} className="flex flex-col items-center px-2 text-center">
              <span className="font-display text-xl font-extrabold leading-tight text-brand-forest sm:text-2xl">
                {stat.value}
              </span>
              <span className="mt-1 text-[0.65rem] font-semibold text-brand-ink/85 sm:text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section
        aria-label="Pesa Pap commitments"
        className="border-b border-brand-line bg-background"
      >
        <div className="mx-auto grid max-w-7xl gap-px bg-brand-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: <ClipboardCheck aria-hidden="true" className="size-5" />,
              title: "Simple application",
              text: "A clear path from first step to review.",
            },
            {
              icon: <BadgeCheck aria-hidden="true" className="size-5" />,
              title: "Transparent terms",
              text: "Know what is illustrative and what is not.",
            },
            {
              icon: <Smartphone aria-hidden="true" className="size-5" />,
              title: "Digital experience",
              text: "Explore your options from one place.",
            },
            {
              icon: <HeartHandshake aria-hidden="true" className="size-5" />,
              title: "Support minded",
              text: "A people-first approach to questions.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="flex items-center gap-4 bg-background px-5 py-5 sm:px-7"
            >
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest">
                {item.icon}
              </span>
              <div>
                <h2 className="text-sm font-bold text-foreground">{item.title}</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionHeading
            eyebrow="A simple process"
            title="Small steps. Clear expectations."
            description="A straightforward journey starts with information, not promises."
          />
          <div className="grid gap-4 sm:grid-cols-3">
            <StepTile
              number="01"
              title="Check eligibility"
              description="Share basic details to begin a demonstration assessment."
              icon={<ClipboardCheck aria-hidden="true" className="size-5" />}
            />
            <StepTile
              number="02"
              title="Apply for a loan"
              description="Review sample options and complete the application steps."
              icon={<HandCoins aria-hidden="true" className="size-5" />}
            />
            <StepTile
              number="03"
              title="Application review"
              description="A real application would be assessed and updated by the lender."
              icon={<Clock3 aria-hidden="true" className="size-5" />}
            />
          </div>
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-soft">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <SectionHeading
              eyebrow="Built around clarity"
              title="A financial experience that puts understanding first."
              description="From the first question to the final terms, every step should help you make a considered choice."
            />
            <div className="mt-7">
              <CTAButton to="/eligibility" variant="default" size="lg" className="h-12 px-5">
                Start with eligibility
              </CTAButton>
            </div>
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <IconFeature
              icon={<Smartphone aria-hidden="true" className="size-5" />}
              title="Convenient application"
            >
              A guided digital flow with room to review each step.
            </IconFeature>
            <IconFeature
              icon={<FileText aria-hidden="true" className="size-5" />}
              title="Clear repayment information"
            >
              See the sample repayment breakdown before you submit.
            </IconFeature>
            <IconFeature
              icon={<ShieldCheck aria-hidden="true" className="size-5" />}
              title="Privacy-minded by design"
            >
              This demo does not transmit or save the details you enter.
            </IconFeature>
            <IconFeature
              icon={<HeartHandshake aria-hidden="true" className="size-5" />}
              title="Human support"
            >
              Contact details will appear here once the support channels are configured.
            </IconFeature>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            eyebrow="Indicative products"
            title="Explore flexible loan options."
            description="Indicative product tiers and ranges; final terms depend on underwriting review."
          />
          <CTAButton to="/loan-now" variant="outlineBrand" size="lg" className="h-12 px-5">
            Explore the calculator
          </CTAButton>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {DEMO_PRODUCTS.map((product, index) => (
            <article
              key={product.name}
              className="flex flex-col border border-brand-line bg-background p-6"
            >
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand-sky text-brand-blue">
                  <BriefcaseBusiness aria-hidden="true" className="size-5" />
                </span>
                <span className="border border-brand-line px-2 py-1 text-[0.65rem] font-bold uppercase text-muted-foreground">
                  Option {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-brand-forest">{product.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">
                {product.summary}
              </p>
              <dl className="mt-5 space-y-3 border-y border-brand-line py-4 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Indicative range</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {formatKes(product.minimumKes)}–{formatKes(product.maximumKes)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Repayment window</dt>
                  <dd className="text-right font-semibold text-foreground">{product.duration}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Indicative rate</dt>
                  <dd className="text-right font-semibold text-foreground">
                    {SAMPLE_MONTHLY_RATE_PERCENT}% monthly
                  </dd>
                </div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">
                Indicative terms only. Final eligibility and pricing require completed underwriting
                assessment.
              </p>
              <div className="mt-auto pt-5">
                <CTAButton to="/loan-now" variant="ghost" className="h-10 px-0 text-brand-forest">
                  Continue to application
                </CTAButton>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-sky">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading
              eyebrow="Lending use cases"
              title="A few ways people plan their next step."
              description="Illustrative scenarios showing common business, agricultural, and household financing goals."
            />
            <CTAButton to="/testimonials" variant="outlineBrand" size="lg" className="h-12 px-5">
              Explore all use cases
            </CTAButton>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-brand-blue">
            <ShieldCheck aria-hidden="true" className="size-4" /> Illustrative scenarios — not
            individual customer endorsements.
          </p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {DEMO_STORIES.slice(0, 3).map((story) => (
              <DemoStoryCard key={story.name} {...story} />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <DemoNotice>
          Product ranges, rates, and estimates shown on this prototype are indicative
          configurations, not a binding loan offer or live credit commitment.
        </DemoNotice>
      </section>

      <section className="bg-brand-forest text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-brand-green">Your next chapter</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">
              Ready to Take Your Next Financial Step?
            </h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/75">
              Start with a simple eligibility check and explore your available options.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CTAButton to="/eligibility" variant="accent" size="lg" className="h-12 px-5">
              Check eligibility
            </CTAButton>
            <CTAButton
              to="/loan-now"
              variant="outline"
              size="lg"
              className="h-12 border-primary-foreground/50 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10"
            >
              Apply now
            </CTAButton>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
