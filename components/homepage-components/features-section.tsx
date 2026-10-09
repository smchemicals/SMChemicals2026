"use client";

import React from "react";
import {Shield, Microscope, Truck, Zap} from "lucide-react";
import {useSection} from "@/hooks/use-section";

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
        <section className="py-24 bg-background-950 text-white selection:bg-accent-500 selection:text-black">
            <div ref={scope} className="mx-auto max-w-7xl px-6">

                <div className="flex flex-col lg:flex-row items-end justify-between gap-8 mb-6">
                    <div data-reveal className="flex flex-col">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="h-px w-8 bg-accent-500"/>
                            <span className="text-[11px] font-bold text-accent-500 uppercase tracking-[0.5em]">
                                Technical Core
                            </span>
                        </div>
                        <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-[0.8] text-white">
                            Precision <span className="text-white/20 font-light italic ml-2">Refined.</span>
                        </h2>
                    </div>

                    <div data-reveal className="max-w-[320px] lg:text-right pb-2">
                        <p className="text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed text-white/40">
                            Advanced molecular consistency delivering measurable industrial advantage.
                        </p>
                    </div>
                </div>

                <div data-reveal className="h-px w-full bg-white/10 mb-16"/>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-white/10 border border-white/10">
                    {features.map((feat) => (
                        <div
                            key={feat.name}
                            data-reveal
                            className="group bg-background-950 p-8 h-80 flex flex-col justify-between transition-colors hover:bg-white/2"
                        >
                            <div className="flex justify-between items-start">
                                <div
                                    className="p-2 bg-white/5 border border-white/10 group-hover:border-accent-500/50 transition-colors">
                                    <feat.icon strokeWidth={1}
                                               className="h-10 w-10 text-white/40 group-hover:text-accent-500"/>
                                </div>
                                <div className="text-right">
                                    <span className="block text-4xl font-light tracking-tighter text-white">
                                        {feat.stat}
                                    </span>
                                    <span
                                        className="block text-[11px] font-black uppercase tracking-widest text-accent-500 mt-1">
                                        {feat.name}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <p className="text-xl md:text-lg text-white/40 font-light leading-snug group-hover:text-white/80 transition-colors">
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
