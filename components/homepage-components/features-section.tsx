"use client";

import React from "react";
import {Shield, Microscope, Truck, Zap} from "lucide-react";
import {useSection} from "@/hooks/use-section";
import {Eyebrow} from "@/components/ui/page-hero";

const features = [
    {
        name: "QC Compliance",
        stat: "99.9%",
        description: "Standardized purity across all batches.",
        icon: Shield,
    },
    {
        name: "Rapid Prototyping",
        stat: "12d",
        description: "Agile R&D for bespoke formulations.",
        icon: Microscope,
    },
    {
        name: "On-Time Delivery",
        stat: "100%",
        description: "Reliable logistics across industrial hubs.",
        icon: Truck,
    },
    {
        name: "Expert Lead Time",
        stat: "24h",
        description: "Direct engineering support and dispatch.",
        icon: Zap,
    },
];

export function FeaturesSection() {
    const scope = useSection<HTMLDivElement>({y: 22, blur: 0, stagger: 0.08, duration: 0.6, start: "top 85%", exitY: -50, exitFade: 1});

    return (
        <section className="py-24 lg:py-32 bg-surface text-foreground border-y border-line">
            <div ref={scope} className="mx-auto max-w-7xl px-6">

                <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-6">
                    <div data-reveal className="flex flex-col">
                        <Eyebrow className="mb-6">Technical Core</Eyebrow>
                        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.85] text-foreground">
                            Precision <span className="text-muted font-light italic ml-2">Refined.</span>
                        </h2>
                    </div>

                    <div data-reveal className="max-w-[320px] lg:text-right pb-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed text-muted">
                            Advanced molecular consistency delivering measurable industrial advantage.
                        </p>
                    </div>
                </div>

                <div data-reveal className="h-px w-full bg-line mb-16"/>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-line border border-line">
                    {features.map((feat) => (
                        <div
                            key={feat.name}
                            data-reveal
                            className="group bg-surface p-8 h-80 flex flex-col justify-between transition-colors hover:bg-background"
                        >
                            <div className="flex justify-between items-start">
                                <div
                                    className="p-2 rounded-sm bg-accent/10 border border-accent/20 group-hover:border-accent/60 transition-colors">
                                    <feat.icon strokeWidth={1}
                                               className="h-10 w-10 text-accent"/>
                                </div>
                                <div className="text-right">
                                    <span className="block text-4xl font-light tracking-tighter text-foreground">
                                        {feat.stat}
                                    </span>
                                    <span
                                        className="block text-[11px] font-black uppercase tracking-widest text-accent mt-1">
                                        {feat.name}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xl md:text-lg text-muted font-light leading-snug group-hover:text-foreground/85 transition-colors">
                                    {feat.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
