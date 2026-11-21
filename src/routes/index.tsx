import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  ClipboardCheck,
  Clock3,
  HandCoins,
  HeartHandshake,
  Leaf,
  ShieldCheck,
  Smartphone,
} from "lucide-react";

import heroPhoto from "@/assets/pesapap-hero.png.asset.json";
import { CTAButton, DemoNotice, DemoStoryCard, IconFeature, SectionHeading, SiteShell, StepTile } from "@/components/pesapap/site";
import { Button } from "@/components/ui/button";
import { DEMO_STORIES } from "@/lib/demo-stories";
import { DEMO_PRODUCTS, formatKes, SAMPLE_MONTHLY_RATE_PERCENT } from "@/lib/pesapap-config";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Pesa Pap | Your next financial move starts here" },
      { name: "description", content: "Explore a clear, convenient lending experience for your next financial move with Pesa Pap." },
      { property: "og:title", content: "Pesa Pap | Your next financial move starts here" },
      { property: "og:description", content: "Simple applications. Transparent lending. A smarter way to explore financial opportunities." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  return (
    <SiteShell activePath="/">
      <section className="overflow-hidden border-b border-brand-line bg-brand-mint">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[0.94fr_1.06fr] lg:gap-12 lg:px-8 lg:py-20">
          <div className="relative z-10 max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-brand-line bg-background/80 px-3 py-1.5 text-xs font-bold uppercase text-brand-forest">
              <Leaf aria-hidden="true" className="size-3.5" /> A clearer way forward
            </p>
            <h1 className="mt-6 font-display text-balance text-4xl font-bold leading-[1.1] text-brand-forest sm:text-5xl lg:text-6xl">
              Your Next Financial Move Starts Here.
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              Access a simple, convenient and transparent loan application experience with Pesa Pap. Take the next step towards your financial goals.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <CTAButton to="/eligibility" variant="accent" size="lg" className="h-12 px-5">Check your eligibility</CTAButton>
              <CTAButton to="/loan-now" variant="outlineBrand" size="lg" className="h-12 px-5">Apply for a loan</CTAButton>
            </div>
            <p className="mt-5 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck aria-hidden="true" className="size-4 text-brand-forest" /> No credit decision is made on this demonstration website.
            </p>
          </div>

          <div className="relative mx-auto w-full max-w-[42rem] lg:ml-auto">
            <div className="absolute -left-4 top-8 z-10 hidden rounded-md border border-brand-line bg-background px-4 py-3 shadow-sm sm:block float-soft">
              <p className="text-[0.65rem] font-bold uppercase text-muted-foreground">A thoughtful start</p>
              <p className="mt-1 text-sm font-bold text-brand-forest">Clear steps, at your pace</p>
            </div>
            <div className="absolute -right-2 top-1/4 z-10 grid size-12 place-items-center rounded-full bg-brand-orange text-brand-ink shadow-sm sm:-right-4">
              <span className="font-display text-xl font-bold">KSh</span>
            </div>
            <figure className="relative aspect-[5/4] overflow-hidden rounded-md bg-brand-sky shadow-sm sm:aspect-[6/5]">
              <img src={heroPhoto.url} alt="A smiling Kenyan small-business owner in her bright shop" className="h-full w-full object-cover object-[58%_center]" fetchPriority="high" />
              <figcaption className="absolute bottom-4 left-4 right-4 flex items-center gap-3 border border-background/70 bg-background/95 p-3.5 shadow-sm sm:bottom-6 sm:left-6 sm:right-auto sm:max-w-[18rem]">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest"><Check aria-hidden="true" className="size-5" /></span>
                <span><span className="block text-xs font-bold uppercase text-brand-forest">Make an informed choice</span><span className="mt-1 block text-xs text-muted-foreground">Understand the terms before you proceed.</span></span>
              </figcaption>
            </figure>
            <span className="absolute -bottom-4 -right-2 -z-0 hidden size-24 rounded-full bg-brand-orange/25 sm:block" aria-hidden="true" />
          </div>
        </div>
      </section>

      <section aria-label="Pesa Pap commitments" className="border-b border-brand-line bg-background">
        <div className="mx-auto grid max-w-7xl gap-px bg-brand-line sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: <ClipboardCheck aria-hidden="true" className="size-5" />, title: "Simple application", text: "A clear path from first step to review." },
            { icon: <BadgeCheck aria-hidden="true" className="size-5" />, title: "Transparent terms", text: "Know what is illustrative and what is not." },
            { icon: <Smartphone aria-hidden="true" className="size-5" />, title: "Digital experience", text: "Explore your options from one place." },
            { icon: <HeartHandshake aria-hidden="true" className="size-5" />, title: "Support minded", text: "A people-first approach to questions." },
          ].map((item) => (
            <div key={item.title} className="flex items-center gap-4 bg-background px-5 py-5 sm:px-7">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-mint text-brand-forest">{item.icon}</span>
              <div><h2 className="text-sm font-bold text-foreground">{item.title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{item.text}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <SectionHeading eyebrow="A simple process" title="Small steps. Clear expectations." description="A straightforward journey starts with information, not promises." />
          <div className="grid gap-4 sm:grid-cols-3">
            <StepTile number="01" title="Check eligibility" description="Share basic details to begin a demonstration assessment." icon={<ClipboardCheck aria-hidden="true" className="size-5" />} />
            <StepTile number="02" title="Apply for a loan" description="Review sample options and complete the application steps." icon={<HandCoins aria-hidden="true" className="size-5" />} />
            <StepTile number="03" title="Application review" description="A real application would be assessed and updated by the lender." icon={<Clock3 aria-hidden="true" className="size-5" />} />
          </div>
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-soft">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <SectionHeading eyebrow="Built around clarity" title="A financial experience that puts understanding first." description="From the first question to the final terms, every step should help you make a considered choice." />
            <div className="mt-7"><CTAButton to="/eligibility" variant="default" size="lg" className="h-12 px-5">Start with eligibility</CTAButton></div>
          </div>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <IconFeature icon={<Smartphone aria-hidden="true" className="size-5" />} title="Convenient application">A guided digital flow with room to review each step.</IconFeature>
            <IconFeature icon={<FileText aria-hidden="true" className="size-5" />} title="Clear repayment information">See the sample repayment breakdown before you submit.</IconFeature>
            <IconFeature icon={<ShieldCheck aria-hidden="true" className="size-5" />} title="Privacy-minded by design">This demo does not transmit or save the details you enter.</IconFeature>
            <IconFeature icon={<HeartHandshake aria-hidden="true" className="size-5" />} title="Human support">Contact details will appear here once the support channels are configured.</IconFeature>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading eyebrow="Sample configuration" title="Explore illustrative loan options." description="These example products are placeholders, not offers or approved loan terms." />
          <CTAButton to="/loan-now" variant="outlineBrand" size="lg" className="h-12 px-5">Explore the calculator</CTAButton>
        </div>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {DEMO_PRODUCTS.map((product, index) => (
            <article key={product.name} className="flex flex-col border border-brand-line bg-background p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-full bg-brand-sky text-brand-blue"><BriefcaseBusiness aria-hidden="true" className="size-5" /></span>
                <span className="border border-brand-line px-2 py-1 text-[0.65rem] font-bold uppercase text-muted-foreground">Sample {String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-5 text-xl font-bold text-brand-forest">{product.name}</h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{product.summary}</p>
              <dl className="mt-5 space-y-3 border-y border-brand-line py-4 text-sm">
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Example range</dt><dd className="text-right font-semibold text-foreground">{formatKes(product.minimumKes)}–{formatKes(product.maximumKes)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Example duration</dt><dd className="text-right font-semibold text-foreground">{product.duration}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-muted-foreground">Sample rate</dt><dd className="text-right font-semibold text-foreground">{SAMPLE_MONTHLY_RATE_PERCENT}% monthly</dd></div>
              </dl>
              <p className="mt-4 text-xs leading-5 text-muted-foreground">Illustrative only. Additional fees are not configured; actual terms require a real assessment.</p>
              <div className="mt-auto pt-5"><CTAButton to="/loan-now" variant="ghost" className="h-10 px-0 text-brand-forest">View sample details</CTAButton></div>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-sky">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <SectionHeading eyebrow="Customer stories" title="A few ways people think about their next step." description="These illustrative profiles show the kinds of goals a lending experience may support." />
            <CTAButton to="/testimonials" variant="outlineBrand" size="lg" className="h-12 px-5">See all demo stories</CTAButton>
          </div>
          <p className="mt-6 inline-flex items-center gap-2 text-xs font-semibold text-brand-blue"><ShieldCheck aria-hidden="true" className="size-4" /> Fictional profiles and quotes for demonstration only.</p>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {DEMO_STORIES.slice(0, 3).map((story) => <DemoStoryCard key={story.name} {...story} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
        <DemoNotice>Sample products, rates, and results on this website are illustrative configuration, not a loan offer. No credit assessment, application submission, or payment takes place here.</DemoNotice>
      </section>

      <section className="bg-brand-forest text-primary-foreground">
        <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-14 sm:px-6 sm:py-16 lg:flex-row lg:items-center lg:justify-between lg:px-8">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase text-brand-green">Your next chapter</p>
            <h2 className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl">Ready to Take Your Next Financial Step?</h2>
            <p className="mt-4 text-base leading-7 text-primary-foreground/75">Start with a simple eligibility check and explore your available options.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <CTAButton to="/eligibility" variant="accent" size="lg" className="h-12 px-5">Check eligibility</CTAButton>
            <CTAButton to="/loan-now" variant="outline" size="lg" className="h-12 border-primary-foreground/50 bg-transparent px-5 text-primary-foreground hover:bg-primary-foreground/10">Apply now</CTAButton>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}