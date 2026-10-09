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
      className="bg-surface py-32 overflow-hidden border-y border-line"
    >
      <div ref={scope} className="max-w-7xl mx-auto px-6">
        <div data-reveal className="mb-24 relative">
          <Eyebrow className="mb-8">{content.eyebrow}</Eyebrow>

          <h2 className="text-6xl md:text-8xl font-bold tracking-tighter text-foreground leading-[0.8]">
            {content.heading} <br />
            <span className="text-muted font-light italic text-5xl md:text-7xl">
              {content.headingAccent}
            </span>
          </h2>

          <div className="absolute top-0 right-0 hidden lg:block border-l border-line pl-6 py-2">
            <p className="text-[11px] text-muted uppercase tracking-[0.2em] leading-relaxed font-bold">
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
              data-reveal
              className="bg-surface p-10 lg:p-12 hover:bg-background transition-colors group relative overflow-hidden"
            >
              <div className="relative z-10">
                <span className="text-4xl font-light tracking-tighter text-foreground group-hover:text-accent transition-colors duration-500 block mb-8">
                  {item.year}
                </span>

                <h3 className="text-accent font-black uppercase tracking-[0.2em] text-[11px] mb-4">
                  {item.title}
                </h3>

                <p className="text-foreground/70 text-base leading-relaxed font-light">
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
