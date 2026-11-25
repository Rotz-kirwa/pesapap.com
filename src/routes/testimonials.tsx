import { createFileRoute } from "@tanstack/react-router";
import { HeartHandshake, ShieldCheck } from "lucide-react";

import { CTAButton, CustomerStoryCard, SiteShell } from "@/components/pesapap/site";
import { CUSTOMER_STORIES } from "@/lib/customer-stories";

export const Route = createFileRoute("/testimonials")({
  head: () => ({
    meta: [
      { title: "Customer Stories | Pesa Pap" },
      {
        name: "description",
        content:
          "Read stories from Pesa Pap customers who used loans to support personal and business goals.",
      },
      { property: "og:title", content: "Customer Stories | Pesa Pap" },
      {
        property: "og:description",
        content: "Stories from customers who used loans to support personal and business goals.",
      },
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-brand-forest">
            <span aria-hidden="true" className="size-2 rounded-full bg-brand-orange" />
            Customer stories
          </p>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight text-brand-forest sm:text-3xl">
            Real goals. Real steps.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-5 text-muted-foreground sm:text-base">
            See how Pesa Pap customers used loans for education, business, and everyday needs.
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-brand-blue">
            <HeartHandshake aria-hidden="true" className="size-4" />
            <span>Stories shared with each customer's permission.</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CUSTOMER_STORIES.map((story) => (
            <CustomerStoryCard key={story.name} {...story} />
          ))}
        </div>
      </section>

      <section className="border-y border-brand-line bg-brand-soft">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-14 sm:px-6 md:grid-cols-[1fr_auto] md:items-center lg:px-8">
          <div className="max-w-2xl">
            <p className="inline-flex items-center gap-2 text-xs font-bold uppercase text-brand-forest">
              <ShieldCheck aria-hidden="true" className="size-4" /> Your voice matters
            </p>
            <h2 className="mt-3 font-display text-3xl font-bold text-brand-forest">
              Your Story Could Be Next.
            </h2>
          </div>
          <CTAButton to="/loan-now" variant="accent" size="lg" className="h-12 px-5">
            Apply now
          </CTAButton>
        </div>
      </section>
    </SiteShell>
  );
}
