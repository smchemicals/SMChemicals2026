"use client";

import { useRef } from "react";
import { Target, Eye } from "lucide-react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { AboutValuesSection } from "@/data/about";
import { Eyebrow } from "@/components/ui/page-hero";

const cardIcons = [Target, Eye];

export function AboutValues({ content }: { content: AboutValuesSection }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const el = scope.current;
      if (!el) return;

      const header = el.querySelector<HTMLElement>("[data-reveal]");
      const cards = gsap.utils.toArray<HTMLElement>("[data-card]", el);

      const tl = gsap.timeline({ delay: 0.06 });

      if (header) {
        gsap.set(header, { autoAlpha: 0, y: 16 });
        tl.to(header, {
          autoAlpha: 1,
          y: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }

      cards.forEach((c) => {
        gsap.set(c, { autoAlpha: 0, y: 64 });
      });

      if (cards.length) {
        tl.to(
          cards,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.35,
            ease: "power2.out",
            stagger: 0.05,
          },
          "-=0.2",
        );
      }

      gsap.to(el, {
        y: -50,
        autoAlpha: 0,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    },
    { scope },
  );
  return (
    <section
      data-header-theme="dark"
      className="bg-background border-t border-line py-16 lg:py-24 font-sans text-foreground"
    >
      <div ref={scope} className="mx-auto max-w-7xl px-6 lg:px-8">
        <div data-reveal className="max-w-2xl mb-12 lg:mb-16">
          <Eyebrow className="mb-5">{content.eyebrow}</Eyebrow>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tighter text-foreground">
            {content.heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 border border-line bg-line gap-px overflow-hidden relative">
          {content.cards.map((card, i) => {
            const Icon = cardIcons[i] ?? Target;
            return (
              <div
                key={i}
                data-card
                className="bg-background p-8 md:p-12 transition-all duration-500 hover:bg-surface group relative flex flex-col justify-between min-h-[280px] lg:min-h-[320px]"
              >
                <div>
                  <div className="mb-8">
                    <div className="w-12 h-12 flex items-center justify-center bg-accent/10 rounded-lg border border-accent/20 text-accent group-hover:border-accent/60 transition-all duration-500">
                      <Icon className="w-5 h-5 group-hover:scale-110 transition-transform duration-500" />
                    </div>
                  </div>

                  <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-foreground mb-4">
                    Our{" "}
                    <span className="font-light italic text-muted block sm:inline">
                      {card.title}
                    </span>
                  </h3>

                  <p className="text-base md:text-lg text-foreground/75 leading-relaxed max-w-md font-light">
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
