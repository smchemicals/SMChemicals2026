"use client";

import type { AboutValuesSection, AboutTimelineSection } from "@/data/about";
import { IndexList } from "@/components/ui/index-list";

/* Purpose & Direction, then the milestones: the same typographic list the rest of the site uses. */
export function AboutStack({
  values,
  timeline,
}: {
  values: AboutValuesSection;
  timeline: AboutTimelineSection;
}) {
  return (
    <section id="milestones" className="bg-background py-24 text-foreground lg:py-36">
      <div className="mx-auto grid max-w-7xl gap-28 px-6 sm:px-10 lg:gap-40">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
          <h2 className="font-heading text-[clamp(2.25rem,4.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] lg:col-span-6">
            {values.heading}
          </h2>
          <div className="lg:col-span-5 lg:col-start-8">
            <IndexList items={values.cards.map((c) => ({ lead: c.title, text: c.body }))} />
          </div>
        </div>
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-x-10">
          <h2 className="font-heading text-[clamp(2.25rem,4.4vw,4rem)] font-semibold leading-[1.02] tracking-[-0.03em] lg:col-span-6">
            {timeline.heading} <span className="text-accent-ink">{timeline.headingAccent}</span>
          </h2>
          <div className="lg:col-span-5 lg:col-start-8">
            <IndexList items={timeline.items.map((t) => ({ lead: t.year, title: t.title, text: t.description }))} />
          </div>
        </div>
      </div>
    </section>
  );
}
