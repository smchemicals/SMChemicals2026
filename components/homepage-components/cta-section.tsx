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
      {/* Glow fades in and out vertically so it never meets the section edge. */}
      <BrandGlow className="mask-[linear-gradient(to_bottom,transparent,black_30%,black_70%,transparent)]" />
      <div
        ref={scope}
        className="relative z-10 mx-auto max-w-7xl px-6 sm:px-10 grid grid-cols-1 lg:grid-cols-12 gap-14 lg:gap-16 lg:items-end"
      >
        <div className="lg:col-span-7">
          <Eyebrow data-reveal className="mb-6">
            Direct Contact
          </Eyebrow>
          <h2
            data-reveal
            className="text-4xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-foreground leading-none"
          >
            Ready to transform <br />
            <span className="text-muted font-light">
              your supply chain?
            </span>
          </h2>
          <p
            data-reveal
            className="mt-8 text-base sm:text-lg md:text-xl text-foreground/75 font-light leading-relaxed max-w-xl"
          >
            Partner with{" "}
            <span className="text-foreground font-medium">SM Chemicals</span>{" "}
            for reliable, high-purity industrial compounds tailored
            specifically to your infrastructure requirements.
          </p>

          <div
            data-reveal
            className="mt-10 flex flex-col sm:flex-row gap-x-10 gap-y-6 items-center sm:items-center"
          >
            <CtaButton href="/contact" className="w-full sm:w-auto shrink-0">
              Request a Quote
            </CtaButton>
            <Link
              href="/products"
              className="type-label group flex items-center gap-3 whitespace-nowrap text-foreground/75 hover:text-accent-ink transition-colors duration-500"
            >
              Explore Catalogue
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </div>

        <div
          data-reveal
          className="lg:col-span-5 flex flex-col border border-line divide-y divide-line bg-surface"
        >
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
              className="group p-7 sm:p-9 flex items-center justify-between gap-6 transition-colors duration-500 hover:bg-background"
            >
              <div className="min-w-0 space-y-1.5">
                <span className="type-label text-muted block">
                  {item.label}
                </span>
                <span className="text-base sm:text-lg text-foreground font-medium tracking-tight block break-all sm:break-normal">
                  {item.value}
                </span>
              </div>
              <div className="shrink-0 w-11 h-11 flex items-center justify-center bg-accent/10 rounded-md border border-accent/20 text-accent-ink group-hover:bg-accent-strong group-hover:text-white group-hover:border-accent transition-all duration-500">
                <item.icon className="w-4 h-4" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
