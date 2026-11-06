"use client";

import type { StatItem } from "@/data/content";
import { useReveal } from "@/hooks/use-reveal";

/* Navy band under the hero wave: who we supply, then the headline numbers. */
export function ProofBand({
  sectors,
  stats,
}: {
  sectors: string[];
  stats: StatItem[];
}) {
  const scope = useReveal<HTMLDivElement>({ y: 20, blur: 0, duration: 1, stagger: 0.12, scroll: true, start: "top 80%" });

  return (
    <section
      data-surface="inverse"
      className="-mt-px bg-background text-foreground"
    >
      <div ref={scope} className="mx-auto max-w-7xl px-6 pb-24 pt-16 sm:px-10 lg:pb-36 lg:pt-20">
        <p
          data-reveal
          className="max-w-[min(100%,64rem)] font-heading text-[clamp(1.75rem,4.2vw,3.75rem)] font-medium leading-[1.15] tracking-[-0.03em]"
        >
          <span className="text-muted">We supply</span> <span className="font-semibold text-accent-ink">chemicals</span>{" "}
          <span className="text-muted">for</span>{" "}
          {sectors.map((s, i) => (
            <span key={s}>
              <span className="font-semibold">{s}</span>
              {i < sectors.length - 1 ? (
                <span className="text-muted">{i === sectors.length - 2 ? (sectors.length === 2 ? " and " : ", and ") : ", "}</span>
              ) : (
                <span className="text-muted">.</span>
              )}
            </span>
          ))}
        </p>

        <dl className="mt-16 grid grid-cols-2 gap-x-10 gap-y-12 lg:mt-24 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} data-reveal>
              {/* Number and unit share one baseline and one unit size, so +, % and Yrs all sit the same way. */}
              <dd className="flex items-baseline gap-[0.12em] whitespace-nowrap font-heading font-semibold leading-none tracking-[-0.04em] tabular-nums text-[clamp(2.25rem,4vw,4rem)]">
                <span>{s.value.toFixed(s.decimals ?? 0)}</span>
                <span className="text-[0.6em] font-semibold tracking-[-0.02em] text-accent">{s.suffix}</span>
              </dd>
              <dt className="mt-3 text-base text-muted">{s.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
