import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck } from "lucide-react";

import { CTAButton, DemoNotice, DemoStoryCard, PageIntro, SiteShell } from "@/components/pesapap/site";
import { DEMO_STORIES } from "@/lib/demo-stories";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Customer Stories | Pesa Pap" },
      { name: "description", content: "Explore fictional demonstration profiles showing different financial goals and small-business contexts." },
      { property: "og:title", content: "Customer Stories | Pesa Pap" },
      { property: "og:description", content: "Illustrative stories about planning, business, farming, and personal goals." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TestimonialsPage,
});

function TestimonialsPage() {
  return (
    <SiteShell activePath="/testimonials">
      <section className="border-b border-brand-line bg-brand-sky">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
          <PageIntro eyebrow="Customer stories" title="Real Stories. Real Financial Progress." description="Discover how customers use financial solutions to support their goals, businesses and everyday needs." />
          <div className="mt-7 flex items-center gap-3 text-sm text-brand-blue"><HeartHandshake aria-hidden="true" className="size-5" /><span>Customer voices deserve accuracy, consent, and care.</span></div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <DemoNotice>These are demonstration profiles with fictional names and sample quotes. They are not verified customers or endorsements; all portraits are generated for this prototype.</DemoNotice>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {DEMO_STORIES.map((story) => <DemoStoryCard key={story.name} {...story} />)}
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-soft">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-brand-forest"><ShieldCheck aria-hidden="true" className="size-4" /> Your voice matters</p>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-forest">Your Story Could Be Next.</h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">Real customer stories should only appear with permission and accurate, approved details.</p>
          </div>
          <CTAButton to="/loan-now" variant="accent" size="lg" className="h-12 px-5">Apply now</CTAButton>
        </div>
      </section>
    </SiteShell>
  );
}