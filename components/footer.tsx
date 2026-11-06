"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { SITE } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { ThemeToggle } from "@/components/theme-toggle";
import { useReveal } from "@/hooks/use-reveal";

const columns = [
  {
    title: "Catalogue",
    links: [
      { name: "Water treatment", href: "/products" },
      { name: "ETP / STP", href: "/products" },
      { name: "Cooling and boiler", href: "/products" },
      { name: "Textile", href: "/products" },
      { name: "All products", href: "/products" },
    ],
  },
  {
    title: "Company",
    links: [
      { name: "About", href: "/about" },
      { name: "Blog", href: "/blog" },
      { name: "Careers", href: "/careers" },
      { name: "Contact", href: "/contact" },
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
  // On the homepage the footer is the closing moment: the "Let's talk" call to action and the
  // contact details live here once, on the brand blue, instead of a separate band above the footer.
  const pathname = usePathname();
  const home = pathname === "/";
  // The footer outlives a page, so its reveal is re-armed on every route: its parts rise in one after another as it comes into view.
  const scope = useReveal<HTMLElement>({ scroll: true, y: 24, blur: 0, duration: 0.9, stagger: 0.07, start: "top 92%", dependencies: [pathname] });
  const muted = home ? "text-white/75" : "text-muted";
  const hover = home ? "hover:text-deep" : "hover:text-accent-ink";

  return (
    <footer
      ref={scope}
      {...(home ? { "data-header": "light" } : { "data-surface": "inverse" })}
      className={`overflow-hidden ${home ? "bg-cta text-white" : "bg-background text-foreground"}`}
    >
      <div className="mx-auto max-w-7xl px-6 pt-24 sm:px-10 lg:pt-36">
        {home && (
          <div data-reveal className="mb-20 flex flex-col gap-10 lg:mb-28 md:flex-row md:items-end md:justify-between">
            <h2 className="font-heading text-[clamp(3.25rem,12vw,12rem)] font-semibold leading-[0.92] tracking-tighter">
              Let&rsquo;s talk
              <br />
              chemistry.
            </h2>
            <Button variant="light" size="lg" arrow="up-right" onClick={() => openInquiry("general")} className="self-start md:mb-4 md:self-auto">
              Request a quote
            </Button>
          </div>
        )}

        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div data-reveal className="lg:col-span-7">
            {!home && <p className="text-lg text-muted">Questions about a product or an order?</p>}
            <a
              href={`mailto:${email}`}
              className={`${home ? "" : "mt-3"} block break-all font-heading text-[clamp(1.5rem,3.3vw,3.25rem)] font-semibold leading-[1.05] tracking-[-0.03em] underline-offset-[0.12em] decoration-2 ${home ? "decoration-white" : "decoration-accent"} hover:underline sm:break-normal`}
            >
              {email}
            </a>
            <a
              href={`tel:${phone.replace(/\s+/g, "")}`}
              className={`mt-4 inline-block text-xl underline-offset-8 hover:underline md:text-2xl ${home ? "text-white/90 hover:text-white" : "text-foreground/80 hover:text-foreground"}`}
            >
              {phone}
            </a>
            <address className={`mt-8 text-base not-italic leading-relaxed ${muted}`}>
              {SITE.location}, Telangana, India
            </address>
          </div>

          <nav data-reveal aria-label="Footer" className="grid grid-cols-2 gap-8 lg:col-span-5 lg:col-start-8">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className={`text-base font-medium ${muted}`}>{col.title}</h3>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.name}>
                      <Link
                        href={link.href}
                        className={`group inline-flex items-center gap-1 whitespace-nowrap text-lg transition-colors ${hover}`}
                      >
                        {link.name}
                        <ArrowUpRight aria-hidden className="h-4 w-4 -translate-x-1 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div data-reveal className={`mt-20 flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between lg:mt-28 ${muted}`}>
          <p className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <span>&copy; {year} {SITE.name}. All rights reserved.</span>
            <ThemeToggle className={hover} />
            <Link href="/privacy" className={`transition-colors ${hover}`}>
              Privacy
            </Link>
          </p>
          <a
            href="https://abhiramankuntimaddi.com"
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 transition-colors ${hover}`}
          >
            Website Brought to Life by Abhiraman Kuntimaddi
            <ArrowUpRight aria-hidden className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>

      {/* Oversized wordmark, left-aligned to the page grid and cropped by the bottom edge. */}
      <div aria-hidden className="mx-auto mt-8 max-w-7xl select-none px-6 sm:px-10">
        <div className={`mb-[-0.14em] ml-[-0.04em] whitespace-nowrap font-heading text-[min(13.2vw,11.4rem)] font-semibold leading-[0.8] tracking-[-0.06em] ${home ? "text-white/[0.14]" : "text-foreground/9"}`}>
          SM Chemicals
        </div>
      </div>
    </footer>
  );
}
