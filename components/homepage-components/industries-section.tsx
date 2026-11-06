"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { ProductCategory } from "@/data/products";
import { ButtonLink } from "@/components/ui/button";
import { PopularTag } from "@/components/ui/popular-tag";
import { setScrollCategory } from "@/lib/handoff";
import { useReveal } from "@/hooks/use-reveal";

function goTo(id: string) {
  setScrollCategory(id);
  if (window.location.pathname === "/products") {
    window.dispatchEvent(new Event("scroll-to-category"));
  }
}

/*
 * An index, not a grid of boxes: each industry is a line of large type with the
 * chemicals we make for it running alongside, set on the page itself with only
 * space between lines. The arrow is always there, so a line reads as a link
 * without being pointed at.
 */
export function IndustriesSection({ categories }: { categories: ProductCategory[] }) {
  const scope = useReveal<HTMLDivElement>({ y: 20, blur: 0, duration: 0.9, stagger: 0.04, scroll: true, start: "top 85%" });
  const sorted = useMemo(
    // The popular industries lead (as marked in the admin), then the rest, each group alphabetical.
    () => [...categories].sort((a, b) => Number(Boolean(b.popular)) - Number(Boolean(a.popular)) || a.name.localeCompare(b.name)),
    [categories],
  );

  return (
    <section id="industries" className="bg-background py-24 text-foreground lg:py-36">
      <div ref={scope} className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <h2
            data-reveal
            className="max-w-4xl font-heading text-[clamp(2.5rem,6.2vw,5.75rem)] font-semibold leading-none tracking-[-0.03em]"
          >
            Find the right chemical for <span className="text-accent-ink">your industry.</span>
          </h2>
          <div data-reveal>
            <ButtonLink href="/products" variant="outline" arrow="right">
              View full catalogue
            </ButtonLink>
          </div>
        </div>

        <ul className="mt-16 lg:mt-24">
          {sorted.map((c) => {
            const sample = c.products.slice(0, 5).map((p) => p.name);
            const more = c.products.length - sample.length;
            return (
              <li key={c.id} data-reveal>
                <Link
                  href="/products"
                  onClick={() => goTo(c.id)}
                  className="group/i grid items-center gap-x-10 gap-y-2 py-5 outline-none focus-visible:text-accent-ink lg:grid-cols-12 lg:py-6"
                >
                  {/* The tag rides with the name's last word, so it sits in the same place on every line: after the name, on the
                      last line of it, and wraps with that word on a narrow screen. */}
                  <span className="font-heading text-[clamp(1.75rem,3.6vw,3.25rem)] font-semibold leading-[1.08] tracking-[-0.03em] transition-colors duration-300 group-hover/i:text-accent-ink group-focus-visible/i:text-accent-ink lg:col-span-7">
                    {c.name.split(" ").slice(0, -1).join(" ")}{c.name.includes(" ") ? " " : ""}
                    <span className="whitespace-nowrap">
                      {c.name.split(" ").slice(-1)}
                      {c.popular && <PopularTag className="ml-3 -translate-y-[0.35em] align-middle tracking-normal" />}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-6 lg:col-span-5">
                    <span className="text-base leading-[1.6] text-muted lg:text-lg">
                      {sample.join(", ")}
                      {more > 0 ? ` and ${more} more` : ""}
                    </span>
                    <ArrowUpRight
                      aria-hidden
                      strokeWidth={2}
                      className="h-6 w-6 shrink-0 text-accent-ink transition-transform duration-300 group-hover/i:translate-x-1 group-hover/i:-translate-y-0.5 group-focus-visible/i:translate-x-1"
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
