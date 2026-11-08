"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

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
 * The claim is a sequence, so it is shown as one. The statement holds the left while four stages sit on the right, joined
 * by a single line. A drop runs down that line at the reading height of the screen as you scroll, and each stage wakes as
 * the drop arrives: its dot fills with the brand blue and sends out one ring, its word rises through its mask, and its
 * text comes up to full strength. Scroll back and it all withdraws the same way. The drop lags a little behind the
 * scroll, so it feels like it is moving under its own weight rather than being dragged. Reduced motion shows every
 * stage awake, with the line drawn.
 */
const READ_AT = 0.62; // the reading height, as a fraction of the screen

export function FeaturesSection() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      const list = scope.querySelector<HTMLElement>("[data-steps]");
      const rail = scope.querySelector<HTMLElement>("[data-rail]");
      const fill = scope.querySelector<HTMLElement>("[data-trail]");
      const bead = scope.querySelector<HTMLElement>("[data-bead]");
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]", scope);
      if (!list || !rail || !fill || !bead || !steps.length) return;

      const mm = gsap.matchMedia();

      // Everything awake and drawn, for reduced motion: the content is never hidden behind an animation.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set("[data-node]", { backgroundColor: "#0087cb" });
        const place = () => {
          const o = list.getBoundingClientRect();
          const mid = (el: Element) => el.getBoundingClientRect().top + el.getBoundingClientRect().height / 2 - o.top;
          const nodes = steps.map((st) => st.querySelector("[data-node]")!);
          const top = mid(nodes[0]);
          const len = mid(nodes[nodes.length - 1]) - top;
          rail.style.top = `${top}px`;
          rail.style.height = `${len}px`;
          fill.style.height = `${len}px`;
        };
        place();
        window.addEventListener("resize", place);
        return () => window.removeEventListener("resize", place);
      });

      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const nodes = steps.map((st) => st.querySelector<HTMLElement>("[data-node]")!);
        const rings = steps.map((st) => st.querySelector<HTMLElement>("[data-ring]")!);
        let offsets: number[] = [];
        let len = 0;

        // Where each dot sits on the line, measured from the first one (stages differ in height, so measure, don't assume).
        const measure = () => {
          const o = list.getBoundingClientRect();
          const centers = nodes.map((n) => n.getBoundingClientRect().top + n.getBoundingClientRect().height / 2 - o.top);
          offsets = centers.map((c) => c - centers[0]);
          len = offsets[offsets.length - 1];
          rail.style.top = `${centers[0]}px`;
          rail.style.height = `${len}px`;
        };

        // One timeline per stage, played when the drop reaches it and reversed when it leaves.
        const wake = steps.map((st, i) => {
          const body = st.querySelectorAll("[data-body]");
          const verb = st.querySelector("[data-verb]");
          gsap.set(body, { opacity: 0.22, y: 10 });
          gsap.set(verb, { yPercent: 108 });
          gsap.set(nodes[i], { scale: 0.55, backgroundColor: "rgba(230,241,248,0.18)" });
          gsap.set(rings[i], { scale: 1, opacity: 0 });
          return gsap
            .timeline({ paused: true, defaults: { ease: "expoOut" } })
            .to(nodes[i], { scale: 1, backgroundColor: "#0087cb", duration: 0.7 }, 0)
            .fromTo(rings[i], { scale: 1, opacity: 0.55 }, { scale: 2.4, opacity: 0, duration: 1.2, ease: "power2.out" }, 0.05)
            .to(verb, { yPercent: 0, duration: 1 }, 0.05)
            .to(body, { opacity: 1, y: 0, duration: 0.9, stagger: 0.07 }, 0.12);
        });
        const lit = steps.map(() => false);

        // The drop's position: -1 (not yet on the line) to the line's length. It eases toward where the scroll says it should be.
        const drop = { y: -1 };
        const paint = () => {
          const y = Math.max(0, drop.y);
          fill.style.height = `${y}px`;
          bead.style.transform = `translate(-50%, ${y}px) translateY(-50%) scale(${drop.y < 0 || drop.y > len - 1 ? 0 : 1})`;
          offsets.forEach((at, i) => {
            const on = drop.y >= at - 0.5;
            if (on !== lit[i]) {
              lit[i] = on;
              if (on) wake[i].play();
              else wake[i].reverse();
            }
          });
        };
        const follow = gsap.quickTo(drop, "y", { duration: 0.45, ease: "power3.out", onUpdate: paint });

        const target = () => {
          const top = list.getBoundingClientRect().top + parseFloat(rail.style.top || "0");
          return Math.min(len, Math.max(-1, window.innerHeight * READ_AT - top));
        };

        measure();
        const trigger = ScrollTrigger.create({
          trigger: list,
          start: "top bottom",
          end: "bottom top",
          onUpdate: () => follow(target()),
          onRefresh: () => {
            measure();
            drop.y = target();
            paint();
          },
        });
        document.fonts?.ready.then(() => ScrollTrigger.refresh());
        paint();

        return () => {
          trigger.kill();
          wake.forEach((t) => t.kill());
        };
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

        <ol data-steps className="relative lg:col-span-7">
          {/* One line for the whole sequence. Its top and length are set from the dots' real positions (see above). */}
          <span
            data-rail
            aria-hidden
            className="absolute left-[calc(var(--w)/2)] top-0 w-0.75 -translate-x-1/2 rounded-full bg-foreground/15 [--w:2.25rem] sm:[--w:2.75rem]"
          >
            <span data-trail className="absolute left-0 top-0 w-full rounded-full bg-accent" style={{ height: 0 }} />
            {/* The drop that leads the fill. It sits on the line like the dots do, ringed in the page colour. */}
            <span
              data-bead
              className="absolute left-1/2 top-0 block h-3.5 w-3.5 rounded-full bg-accent ring-4 ring-background"
              style={{ transform: "translate(-50%, 0) translateY(-50%) scale(0)" }}
            />
          </span>
          {steps.map((st) => (
            <li
              key={st.verb}
              data-step
              className="relative grid grid-cols-[2.25rem_1fr] gap-x-6 pb-20 last:pb-0 sm:grid-cols-[2.75rem_1fr] sm:gap-x-8 lg:pb-28"
            >
              <span className="relative z-10 mt-3 block h-9 w-9 sm:mt-4 sm:h-11 sm:w-11">
                <span data-node aria-hidden className="block h-full w-full rounded-full ring-8 ring-background" />
                {/* The one ring that leaves a dot as it wakes. */}
                <span data-ring aria-hidden className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-accent" style={{ opacity: 0 }} />
              </span>
              <div>
                <h3 className="overflow-hidden pb-[0.08em] font-heading text-[clamp(2.75rem,7vw,6.5rem)] font-semibold leading-none tracking-[-0.055em]">
                  <span data-verb className="block">
                    {st.verb}
                  </span>
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
