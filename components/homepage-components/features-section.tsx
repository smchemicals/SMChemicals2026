"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const steps = [
  {
    verb: "Make",
    title: "Blended for your process",
    body: "Need a different concentration or a custom blend? We develop it around your plant.",
  },
  {
    verb: "Test",
    title: "Checked before it ships",
    body: "Every batch is tested against its specification, so what arrives is what you ordered.",
  },
  {
    verb: "Ship",
    title: "Supply you can plan around",
    body: "Regular dispatch to industrial customers, scheduled to fit your production.",
  },
  {
    verb: "Call",
    title: "Engineers on the phone",
    body: "Ask the people who make it about dosing, handling and troubleshooting.",
  },
];

/*
 * The claim is a sequence, so it is shown as one: the statement holds the left
 * while four stages light up in turn on the right, joined by a line that draws
 * as you read down.
 */
export function FeaturesSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-step]", root.current).forEach((step) => {
          const body = step.querySelectorAll("[data-body]");
          const node = step.querySelector("[data-node]");
          const seg = step.querySelector("[data-seg]");

          gsap.set(body, { opacity: 0.22 });
          gsap.set(node, { scale: 0.6, backgroundColor: "rgba(230,241,248,0.18)" });
          gsap.set(seg, { scaleY: 0, transformOrigin: "top center" });

          // The dot lights when it reaches the reading line...
          gsap
            .timeline({
              scrollTrigger: { trigger: step, start: "top 65%", toggleActions: "play none none reverse" },
              defaults: { ease: "expoOut" },
            })
            .to(body, { opacity: 1, duration: 0.8 }, 0)
            .to(node, { scale: 1, backgroundColor: "#0087cb", duration: 0.6 }, 0);

          // ...and its line runs down to the next dot, arriving exactly as the next one lights.
          if (seg) {
            gsap.to(seg, {
              scaleY: 1,
              ease: "none",
              scrollTrigger: { trigger: step, start: "top 65%", end: "bottom 65%", scrub: true },
            });
          }
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} data-motion="off" data-surface="inverse" className="bg-background py-24 text-foreground lg:py-40">
      <div className="mx-auto grid max-w-7xl gap-16 px-6 sm:px-10 lg:grid-cols-12 lg:gap-x-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <h2 className="font-heading text-[clamp(2.5rem,5.4vw,5rem)] font-semibold leading-none tracking-[-0.03em]">
              We make it, test it and ship it ourselves.
            </h2>
            <p className="mt-8 max-w-md text-xl leading-[1.55] text-muted">
              So when you call, you are talking to the people who made your product.
            </p>
          </div>
        </div>

        <ol data-steps className="lg:col-span-7">
          {steps.map((st, i) => (
            <li
              key={st.verb}
              data-step
              className="relative grid grid-cols-[2.25rem_1fr] gap-x-6 pb-20 [--c:1.875rem] [--w:2.25rem] last:pb-0 sm:grid-cols-[2.75rem_1fr] sm:gap-x-8 sm:[--c:2.375rem] sm:[--w:2.75rem] lg:pb-28"
            >
              {/* The line from this dot to the next: its centre is the dot's centre. */}
              {i < steps.length - 1 && (
                <span
                  aria-hidden
                  className="absolute -bottom-(--c) left-[calc(var(--w)/2)] top-(--c) w-0.75 -translate-x-1/2 rounded-full bg-foreground/15"
                >
                  <span data-seg className="absolute inset-0 rounded-full bg-accent" />
                </span>
              )}
              <span
                data-node
                aria-hidden
                className="relative z-10 mt-3 block h-9 w-9 rounded-full ring-8 ring-background sm:mt-4 sm:h-11 sm:w-11"
              />
              <div>
                <h3
                  data-body
                  className="font-heading text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-none tracking-[-0.055em]"
                >
                  {st.verb}
                </h3>
                <p data-body className="mt-3 font-heading text-xl font-semibold tracking-tight text-accent lg:text-2xl">
                  {st.title}
                </p>
                <p data-body className="mt-3 max-w-md text-lg leading-[1.6] text-muted">
                  {st.body}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
