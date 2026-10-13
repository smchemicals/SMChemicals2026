"use client";

import { Target, Eye } from "lucide-react";
import { useSection } from "@/hooks/use-section";
import type { AboutValuesSection } from "@/data/about";
import { Eyebrow } from "@/components/ui/page-hero";

const cardIcons = [Target, Eye];

export function AboutValues({ content }: { content: AboutValuesSection }) {
  const scope = useSection<HTMLDivElement>({
    stagger: 0.08,
    start: "top 85%",
    exitY: -50,
  });

  return (
    <section
      data-header-theme="dark"
      className="bg-background pt-12 pb-24 lg:pt-16 lg:pb-32 font-sans text-foreground"
    >
      <div ref={scope} className="mx-auto max-w-7xl px-6 sm:px-10">
        <div data-reveal className="max-w-2xl mb-12 lg:mb-16">
          <Eyebrow className="mb-5">{content.eyebrow}</Eyebrow>
          <h2 className="text-3xl lg:text-5xl font-semibold tracking-tight text-foreground">
            {content.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 border border-line divide-y divide-line lg:divide-y-0 lg:divide-x overflow-hidden relative">
          {content.cards.map((card, i) => {
            const Icon = cardIcons[i] ?? Target;
            return (
              <div
                key={i}
                data-cell
                className="bg-background p-8 md:p-12 transition-colors duration-500 hover:bg-surface group relative flex flex-col justify-between min-h-[280px] lg:min-h-[320px]"
              >
                <div>
                  <div data-cell-part className="mb-8">
                    <div className="w-12 h-12 flex items-center justify-center bg-accent/10 rounded-lg border border-accent/20 text-accent-ink group-hover:border-accent/60 transition-all duration-500">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </div>

                  <h3 data-cell-part className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight text-foreground mb-4">
                    Our{" "}
                    <span className="font-light text-muted block sm:inline">
                      {card.title}
                    </span>
                  </h3>

                  <p data-cell-part className="text-base md:text-lg text-foreground/75 leading-relaxed max-w-md font-light">
                    {card.body}
                  </p>
                </div>

                <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-line opacity-0 group-hover:opacity-100 transition-all duration-500" />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
