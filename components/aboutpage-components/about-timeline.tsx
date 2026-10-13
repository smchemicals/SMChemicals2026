"use client";

import React from "react";
import { useSection } from "@/hooks/use-section";
import type { AboutTimelineSection } from "@/data/about";
import { Eyebrow } from "@/components/ui/page-hero";

export function AboutTimeline({ content }: { content: AboutTimelineSection }) {
  const scope = useSection<HTMLDivElement>({
    stagger: 0.1,
    start: "top 85%",
    exitY: -50,
  });

  return (
    <section
      data-header-theme="dark"
      id="milestones"
      className="bg-surface py-24 lg:py-32 overflow-hidden border-y border-line"
    >
      <div ref={scope} className="max-w-7xl mx-auto px-6 sm:px-10">
        <div data-reveal className="mb-24 relative">
          <Eyebrow className="mb-8">{content.eyebrow}</Eyebrow>

          <h2 className="text-6xl md:text-8xl font-semibold tracking-tight text-foreground leading-none">
            {content.heading} <br />
            <span className="text-muted font-light text-5xl md:text-7xl">
              {content.headingAccent}
            </span>
          </h2>

          <div className="absolute top-0 right-0 hidden lg:block border-l border-line pl-6 py-2">
            <p className="type-label text-muted leading-relaxed">
              Chronological Data
              <br />
              Industrial Growth Archive
              <br />
              V.2024.01
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
          {content.items.map((item) => (
            <div
              key={item.year}
              data-cell
              className="bg-surface p-10 lg:p-12 hover:bg-background transition-colors group relative overflow-hidden"
            >
              <div className="relative z-10">
                <span data-cell-part className="font-heading text-4xl font-light tracking-tight text-foreground group-hover:text-accent-ink transition-colors duration-500 block mb-8">
                  {item.year}
                </span>

                <h3 data-cell-part className="type-label text-accent-ink mb-4">
                  {item.title}
                </h3>

                <p data-cell-part className="text-foreground/70 text-base leading-relaxed font-light">
                  {item.description}
                </p>
              </div>

              <div className="absolute top-0 left-0 w-8 h-8 border-t border-l border-accent/0 group-hover:border-accent/60 transition-all duration-700" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
