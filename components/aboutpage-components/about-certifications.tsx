"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import type { AboutCertsSection } from "@/data/about";

/*
 * Verified standards as a checklist: each is a large row, and its tick draws
 * itself as the row scrolls into view.
 */
export function AboutCertifications({ content }: { content: AboutCertsSection }) {
    const root = useRef<HTMLElement>(null);

    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                gsap.from("[data-head]", {
                    autoAlpha: 0,
                    y: 24,
                    duration: 1,
                    stagger: 0.1,
                    ease: "expoOut",
                    scrollTrigger: { trigger: "[data-head]", start: "top 85%", once: true },
                });
                gsap.utils.toArray<HTMLElement>("[data-row]", root.current).forEach((row) => {
                    const ring = row.querySelector("[data-ring]");
                    const tick = row.querySelector("[data-tick]");
                    const text = row.querySelectorAll("[data-text]");
                    gsap.set(ring, { scale: 0.6, autoAlpha: 0 });
                    gsap.set(tick, { strokeDashoffset: 1 });
                    gsap.set(text, { autoAlpha: 0, y: 24 });
                    gsap
                        .timeline({
                            defaults: { ease: "expoOut" },
                            scrollTrigger: { trigger: row, start: "top 88%", once: true },
                        })
                        .to(ring, { scale: 1, autoAlpha: 1, duration: 0.7 })
                        .to(tick, { strokeDashoffset: 0, duration: 0.7, ease: "power2.out" }, "-=0.35")
                        .to(text, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08 }, "-=0.7");
                });
            });
        },
        { scope: root, dependencies: [content.specs.length] },
    );

    return (
        <section ref={root} data-motion="off" data-surface="inverse" className="bg-background py-24 text-foreground lg:py-36">
            <div className="mx-auto max-w-7xl px-6 sm:px-10">
                <div className="grid gap-8 lg:grid-cols-12 lg:items-end lg:gap-16">
                    <h2
                        data-head
                        className="font-heading text-[clamp(3rem,8vw,8rem)] font-semibold leading-[0.95] tracking-tighter lg:col-span-8"
                    >
                        {content.heading}
                        <br />
                        <span className="text-accent">{content.headingAccent}</span>
                    </h2>
                    <p data-head className="max-w-sm text-lg leading-[1.6] text-muted lg:col-span-4 lg:pb-3">
                        {content.body}
                    </p>
                </div>

                <ul className="mt-16 grid gap-6 lg:mt-24 lg:gap-8">
                    {content.specs.map((item) => (
                        <li
                            key={item.title}
                            data-row
                            className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between md:gap-10"
                        >
                            <div className="flex items-center gap-5 lg:gap-8">
                                <span
                                    data-ring
                                    aria-hidden
                                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-cta text-white lg:h-16 lg:w-16"
                                >
                                    <svg viewBox="0 0 24 24" className="h-6 w-6 lg:h-8 lg:w-8" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path data-tick d="M5 12.5l4.5 4.5L19 7.5" pathLength={1} strokeDasharray={1} strokeDashoffset={0} />
                                    </svg>
                                </span>
                                <span
                                    data-text
                                    className="font-heading text-[clamp(2rem,5.5vw,5.25rem)] font-semibold leading-[1.02] tracking-tighter"
                                >
                                    {item.title}
                                </span>
                            </div>
                            <span data-text className="pl-17 text-lg text-muted md:pl-0 md:text-right lg:text-xl">
                                {item.detail}
                            </span>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
