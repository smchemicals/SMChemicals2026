"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Phone, Mail } from "lucide-react";
import { useSection } from "@/hooks/use-section";
import { CtaButton } from "@/components/ui/cta-button";
import { BrandGlow, Eyebrow } from "@/components/ui/page-hero";

export function CtaSection({
  phone,
  email,
}: {
  phone: string;
  email: string;
}) {
  const scope = useSection<HTMLDivElement>({
    y: 20,
    blur: 0,
    stagger: 0.1,
    duration: 0.8,
    start: "top 90%",
    exitY: -50,
    exitFade: 1,
  });

  return (
    <section className="relative overflow-hidden py-24 lg:py-32 bg-background text-foreground">
      <BrandGlow />
      <div ref={scope} className="relative z-10 mx-auto max-w-7xl px-6 lg:px-8">
        <div className="max-w-4xl mb-16 lg:mb-24">
          <Eyebrow data-reveal className="mb-6">
            Direct Contact
          </Eyebrow>
          <h2
            data-reveal
            className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tighter text-foreground leading-[0.95]"
          >
            Ready to transform <br />
            <span className="text-muted font-light italic">
              your supply chain?
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-20">
          <div className="lg:col-span-7">
            <p
              data-reveal
              className="text-base sm:text-lg md:text-xl text-foreground/75 font-light leading-relaxed max-w-2xl"
            >
              Partner with{" "}
              <span className="text-foreground font-medium">SM Chemicals</span>{" "}
              for reliable, high-purity industrial compounds tailored
              specifically to your infrastructure requirements.
            </p>
          </div>

          <div
            data-reveal
            className="lg:col-span-5 flex flex-col sm:flex-row gap-6 w-full justify-start lg:justify-end items-center"
          >
            <CtaButton href="/contact" className="h-16">
              Request a Quote
            </CtaButton>

            <Link
              href="/products"
              className="flex items-center gap-3 whitespace-nowrap text-[12px] font-bold uppercase tracking-[0.25em] text-foreground/75 hover:text-accent transition-colors duration-500"
            >
              Explore Catalogue
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-line border border-line overflow-hidden">
          {[
            {
              href: `tel:${phone.replace(/\s+/g, "")}`,
              label: "Direct Line",
              value: phone,
              icon: Phone,
            },
            {
              href: `mailto:${email}`,
              label: "Official Inquiry",
              value: email,
              icon: Mail,
            },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              data-reveal
              className="group bg-background/80 backdrop-blur-sm p-8 sm:p-12 flex items-center justify-between transition-colors duration-500 hover:bg-surface"
            >
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-muted uppercase tracking-[0.25em] block">
                  {item.label}
                </span>
                <span className="text-base sm:text-lg text-foreground font-medium tracking-tight block">
                  {item.value}
                </span>
              </div>
              <div className="w-10 h-10 flex items-center justify-center bg-accent/10 rounded-md border border-accent/20 text-accent group-hover:bg-accent-strong group-hover:text-white group-hover:border-accent transition-all duration-500">
                <item.icon className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
