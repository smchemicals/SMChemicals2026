"use client";

import React, { useMemo } from "react";
import {
  Fish,
  Building2,
  Wind,
  Recycle,
  WashingMachine,
  Atom,
  Newspaper,
  Zap,
  Filter,
  Shirt,
  Flame,
  Car,
  FlaskConical,
  ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useSection } from "@/hooks/use-section";
import { productCategories } from "@/data/products";

const POPULAR_CATEGORIES = new Set(["water-boiler", "ro", "etp", "cooling"]);

const META: Record<string, { icon: LucideIcon; tagline: string }> = {
  aquaculture: { icon: Fish, tagline: "Shrimp & Fish Farming" },
  construction: { icon: Building2, tagline: "Concrete Admixtures" },
  cooling: { icon: Wind, tagline: "Cooling Water Circuits" },
  etp: { icon: Recycle, tagline: "Effluent & Sewage" },
  laundry: { icon: WashingMachine, tagline: "Industrial Laundry" },
  polymer: { icon: Atom, tagline: "Coagulants & Dispersants" },
  "pulp-paper": { icon: Newspaper, tagline: "Paper Manufacturing" },
  "power-plant": { icon: Zap, tagline: "Power Generation" },
  ro: { icon: Filter, tagline: "Reverse Osmosis" },
  textile: { icon: Shirt, tagline: "Textile Processing" },
  "water-boiler": { icon: Flame, tagline: "Boiler Water Treatment" },
  automobile: { icon: Car, tagline: "Automotive Care" },
  other: { icon: FlaskConical, tagline: "Specialty Chemicals" },
};

export function IndustriesSection() {
  const scope = useSection<HTMLDivElement>({
    y: 20,
    blur: 4,
    stagger: 0.05,
    duration: 0.8,
    start: "top 88%",
    exitY: -50,
    exitFade: 1,
  });

  const sortedCategories = useMemo(() => {
    return [...productCategories].sort((a, b) => a.name.localeCompare(b.name));
  }, []);

  return (
    <section id="industries" className="py-24 bg-background-50 text-text-950">
      <div ref={scope} className="mx-auto max-w-7xl px-6 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
          <div data-reveal className="flex flex-col">
            <span className="text-[11px] font-black text-text-400 uppercase tracking-[0.4em] mb-4">
              Sector Expertise
            </span>
            <h2 className="text-5xl md:text-7xl font-bold tracking-tighter text-text-950 leading-[0.9]">
              Industrial{" "}
              <span className="text-text-400 font-light italic">Scopes.</span>
            </h2>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 border-l border-t border-background-200">
          {sortedCategories.map((cat) => {
            const meta = META[cat.id] ?? {
              icon: FlaskConical,
              tagline: "Specialty Chemicals",
            };
            const Icon = meta.icon;
            const isPopular = POPULAR_CATEGORIES.has(cat.id);

            return (
              <div
                key={cat.id}
                data-reveal
                className="bg-background-50 group border-r border-b border-background-200"
              >
                <Link
                  href="/products"
                  onClick={() => {
                    sessionStorage.setItem("smc:scrollCategory", cat.id);
                    if (window.location.pathname === "/products") {
                      window.dispatchEvent(new Event("scroll-to-category"));
                    }
                  }}
                  className="relative flex flex-col h-64 p-6 md:p-8 transition-all duration-500 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-background-500 translate-y-[101%] group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1] z-0" />

                  <div className="flex flex-col h-full relative z-10 justify-between">
                    <div className="relative flex justify-center items-center">
                      {isPopular && (
                        <span className="absolute left-0 top-0 text-[11px] font-black uppercase tracking-[0.2em] bg-text-950 text-background-50 px-2 py-0.5 rounded-sm group-hover:bg-black transition-colors">
                          Popular
                        </span>
                      )}
                      <Icon
                        strokeWidth={1.5}
                        className="h-17 w-17 text-text-400 mt-10 group-hover:text-black transition-all duration-500"
                      />
                    </div>

                    <div className="text-center">
                      <span className="text-[11px] font-black uppercase tracking-[0.2em] text-text-300 group-hover:text-black/60 block mb-2">
                        {String(cat.products.length).padStart(2, "0")} Products
                      </span>
                      <h3 className="text-[13px] font-black uppercase tracking-[0.2em] text-text-950 group-hover:text-black leading-tight transition-colors duration-500">
                        {cat.name}
                      </h3>
                    </div>

                    <ArrowUpRight className="hidden md:block absolute top-0 right-0 h-4 w-4 text-text-200 group-hover:text-black transition-all duration-500" />
                  </div>
                </Link>
              </div>
            );
          })}
        </div>

        <div data-reveal className="mt-16 flex flex-col items-center gap-8">
          <Link
            href="/products"
            className="group relative h-14 px-12 flex items-center justify-center bg-text-950 text-background-50 rounded-sm overflow-hidden transition-all duration-500 hover:scale-[1.02]"
          >
            <div className="absolute inset-0 bg-background-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-[0.19,1,0.22,1]" />
            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.3em] group-hover:text-black transition-colors duration-500">
              Explore Full Catalogue
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
