"use client";

import React from "react";
import {Shield, Clock, Award, CheckCircle2} from "lucide-react";
import {useSection} from "@/hooks/use-section";
import type {AboutCertsSection} from "@/data/about";
import {Eyebrow} from "@/components/ui/page-hero";

const specIcons = [Shield, Clock, Award, CheckCircle2];

export function AboutCertifications({content}: {content: AboutCertsSection}) {
    const scope = useSection<HTMLDivElement>({duration: 0.8, stagger: 0.1, start: "top 85%", exitY: -50});

    return (
        <section
            data-header-theme="dark"
            className="bg-background py-24 lg:py-32 overflow-hidden"
        >
            <div className="max-w-7xl mx-auto px-6 sm:px-10">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-stretch">

                    <div className="lg:sticky lg:top-32 h-fit flex flex-col justify-start">
                        <Eyebrow className="mb-6">{content.eyebrow}</Eyebrow>

                        <h2 className="text-6xl font-semibold tracking-tight text-foreground mb-8 leading-none">
                            {content.heading} <br/>
                            <span className="font-light text-muted">{content.headingAccent}</span>
                        </h2>

                        <p className="text-lg text-foreground/75 max-w-sm leading-relaxed mb-8 font-light">
                            {content.body}
                        </p>
                    </div>

                    <div
                        ref={scope}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line border border-line h-full">
                        {content.specs.map((item, i) => {
                            const Icon = specIcons[i] ?? Shield;
                            return (
                            <div
                                key={i}
                                data-cell
                                className="p-12 bg-background hover:bg-surface transition-colors duration-300 group relative overflow-hidden flex flex-col justify-between"
                            >
                                <Icon
                                    className="w-6 h-6 text-accent-ink mb-12 group-hover:scale-110 transition-all duration-500"
                                />
                                <div className="space-y-1 relative z-10">
                                    <div className="font-bold text-foreground text-xl tracking-tight">
                                        {item.title}
                                    </div>
                                    <div className="type-label text-muted">
                                        {item.detail}
                                    </div>
                                </div>

                                <div
                                    className="absolute top-0 right-0 w-4 h-4 border-t border-r border-line opacity-0 group-hover:opacity-100 transition-opacity"/>
                            </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </section>
    );
}
