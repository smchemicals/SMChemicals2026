"use client";

import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { useReveal } from "@/hooks/use-reveal";

const columns = [
  {
    title: "Catalogue",
    links: [
      { name: "Water Treatment", href: "/products" },
      { name: "ETP / STP", href: "/products" },
      { name: "Cooling & Boiler", href: "/products" },
      { name: "Textile", href: "/products" },
      { name: "All Products", href: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Products", href: "/products" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
      { name: "Inquiry", href: "/contact" },
    ],
  },
];

export function Footer({
  phone = "+91 98765 43210",
  email = "info@smchemicals.co.in",
}: {
  phone?: string;
  email?: string;
}) {
  const year = new Date().getFullYear();
  const scope = useReveal<HTMLDivElement>({
    scroll: true,
    y: 24,
    blur: 0,
    stagger: 0.1,
    start: "top 95%",
  });

  return (
    <footer className="relative overflow-hidden bg-[#0a0d09] text-background-50 selection:bg-accent-500 selection:text-black">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle at center, var(--color-accent-500) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
        }}
      />

      <div ref={scope} className="relative mx-auto max-w-7xl px-6 sm:px-10 py-20 lg:py-24">
        <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-8">
          {/* Brand + contact */}
          <div data-reveal className="lg:col-span-5">
            <Link href="/" className="inline-flex items-center">
              <Image
                src="/Logo-BW.png"
                alt="SM Chemicals"
                width={767}
                height={485}
                className="h-16 w-auto brightness-0 invert"
              />
            </Link>
            <p className="mt-6 max-w-sm text-base font-light leading-relaxed text-white/45">
              High-precision industrial chemical formulations, engineered for
              India&apos;s infrastructure since 2008.
            </p>

            <div className="mt-8 space-y-3">
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                className="group flex items-center gap-3 text-base font-light text-white/60 transition-colors hover:text-accent-500"
              >
                <Phone className="h-4 w-4 text-accent-500" />
                {phone}
              </a>
              <a
                href={`mailto:${email}`}
                className="group flex items-center gap-3 text-base font-light text-white/60 transition-colors hover:text-accent-500"
              >
                <Mail className="h-4 w-4 text-accent-500" />
                {email}
              </a>
              <div className="flex items-start gap-3 text-base font-light text-white/60">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent-500" />
                {SITE.location} · Telangana, India
              </div>
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-5 lg:col-start-8">
            {columns.map((col) => (
              <div key={col.title} data-reveal>
                <h3 className="mb-6 text-[11px] font-black uppercase tracking-[0.3em] text-accent-500">
                  {col.title}
                </h3>
                <ul className="space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className="group inline-flex items-center text-base font-light text-white/55 transition-colors hover:text-white"
                      >
                        {link.name}
                        <ArrowUpRight className="ml-1 h-3 w-3 -translate-y-0.5 translate-x-0.5 opacity-0 transition-all group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="relative border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 sm:px-10 py-6 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-[11px] font-light tracking-wide text-white/35">
            &copy; {year} {SITE.name}. All rights reserved.
          </p>
          <a
            href="https://abhiramankuntimaddi.com"
            target="_blank"
            rel="noopener noreferrer"
            className="group text-[11px] font-light tracking-wide text-white/35 transition-colors hover:text-accent-500"
          >
            Website brought to life by{" "}
            <span className="font-medium text-white/70 group-hover:text-accent-500">
              Abhiraman Kuntimaddi
            </span>
            <ArrowUpRight className="ml-0.5 inline h-3 w-3 -translate-y-0.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
