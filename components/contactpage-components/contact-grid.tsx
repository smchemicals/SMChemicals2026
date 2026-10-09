"use client";

import React from "react";
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import type { ContactContent } from "@/data/content";
import { useSection } from "@/hooks/use-section";
import { Eyebrow } from "@/components/ui/page-hero";

export function ContactGrid({ contact }: { contact: ContactContent }) {
  const mapsUrl = contact.mapsUrl;

  const info = [
    {
      icon: MapPin,
      title: "Location",
      details: contact.addressLines,
      action: () => window.open(mapsUrl, "_blank"),
    },
    {
      icon: Phone,
      title: "Direct Line",
      details: [contact.phone],
      action: () =>
        (window.location.href = `tel:${contact.phone.replace(/\s+/g, "")}`),
    },
    {
      icon: Mail,
      title: "Official Mail",
      details: [contact.email],
      action: () => (window.location.href = `mailto:${contact.email}`),
    },
    {
      icon: Clock,
      title: "Operations",
      details: [contact.hours],
      action: null,
    },
  ];

  const scope = useSection<HTMLDivElement>({
    stagger: 0.08,
    start: "top 85%",
    exitY: -50,
  });

  return (
    <section className="py-24 bg-background">
      <div ref={scope} className="mx-auto max-w-7xl px-6 lg:px-8">
        <div data-reveal className="mb-16">
          <Eyebrow className="mb-5">Get In Touch</Eyebrow>
          <h2 className="text-4xl md:text-6xl font-bold tracking-tighter text-foreground">
            Corporate Presence.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 border border-line bg-line gap-px">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-line">
            {info.map((item, i) => (
              <button
                key={i}
                data-reveal
                onClick={item.action || undefined}
                disabled={!item.action}
                className={`bg-background p-10 flex flex-col justify-between text-left transition-colors duration-500 ${item.action ? "hover:bg-surface cursor-pointer group" : "cursor-default"}`}
              >
                <div className="flex justify-between items-start mb-12 w-full">
                  <item.icon
                    className="h-5 w-5 text-accent"
                  />
                  {item.action && (
                    <ArrowRight className="h-4 w-4 text-muted group-hover:text-accent group-hover:translate-x-0.5 transition-all duration-500" />
                  )}
                </div>

                <div>
                  <h3 className="text-[11px] font-black text-foreground uppercase tracking-[0.3em] mb-3">
                    {item.title}
                  </h3>
                  {item.details.map((d, idx) => (
                    <p
                      key={idx}
                      className="text-base text-foreground/80 font-light"
                    >
                      {d}
                    </p>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <div data-reveal className="relative bg-surface h-full min-h-100">
            <iframe
              src={`https://maps.google.com/maps?cid=${contact.mapCid}&z=16&hl=en&output=embed`}
              className="absolute inset-0 w-full h-full grayscale invert-[0.92] hue-rotate-180 contrast-[0.9] opacity-80"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              title="SM Chemicals Location"
            />

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-4 right-4 bg-background px-3 py-1.5 border border-line shadow-sm flex items-center gap-2 hover:bg-surface transition-colors"
            >
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-foreground">
                Open in Maps
              </span>
              <ExternalLink className="w-3 h-3 text-foreground" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
