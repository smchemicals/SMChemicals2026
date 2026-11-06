"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { ArrowUpRight } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { createInk, type Ink } from "@/lib/ink-gl";
import { Button } from "@/components/ui/button";
import { openInquiry } from "@/lib/inquiry";
import { SITE } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { useOpenStatus } from "@/hooks/use-open-status";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

/*
 * The hover for the text controls, taken from the hero: the word ripples for a moment as if the
 * ink under it moved, then settles, and turns sky. No box, no line, no mark. The ripple is one
 * shared SVG displacement filter that is only applied while it plays.
 */
const LIQUID = "smc-liquid";

function LiquidFilter({
  disp,
  turb,
}: {
  disp: React.RefObject<SVGFEDisplacementMapElement | null>;
  turb: React.RefObject<SVGFETurbulenceElement | null>;
}) {
  return (
    <svg aria-hidden width="0" height="0" className="pointer-events-none absolute">
      <filter id={LIQUID} x="-12%" y="-60%" width="124%" height="220%" colorInterpolationFilters="sRGB">
        <feTurbulence ref={turb} type="fractalNoise" baseFrequency="0.008 0.03" numOctaves="2" seed="4" result="noise" />
        <feDisplacementMap ref={disp} in="SourceGraphic" in2="noise" scale="0" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </svg>
  );
}

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

/*
 * No bar. A logo top-left and two plain text controls top-right, set in the
 * same type as the page. Their colour follows the section underneath:
 * sections marked data-surface="inverse" (or data-header="light") get light
 * text, everything else dark. "Menu" opens a full-screen overlay.
 */
export function Header({
  phone = "+91 98765 43210",
  email = "info@smchemicals.co.in",
  hours = "",
}: {
  phone?: string;
  email?: string;
  hours?: string;
}) {
  const status = useOpenStatus(hours);
  const [menuOpen, setMenuOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  // The homepage opens on the dark hero; every other page opens on the light ground.
  const [light, setLight] = useState(pathname === "/");
  const [darkTheme, setDarkTheme] = useState(false);

  const lastY = useRef(0);
  const logoRef = useRef<HTMLAnchorElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const inkGl = useRef<Ink | null>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const disp = useRef<SVGFEDisplacementMapElement>(null);
  const turb = useRef<SVGFETurbulenceElement>(null);
  // While a control is hovered or focused its word keeps moving like liquid; on leave it settles.
  const liquid = (on: boolean) => (e: React.SyntheticEvent<HTMLElement>) => {
    const d = disp.current;
    const t = turb.current;
    const label = e.currentTarget.querySelector<HTMLElement>("[data-liquid]");
    if (!d || !t || !label || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.killTweensOf([d, t]);
    if (on) {
      label.style.filter = `url(#${LIQUID})`;
      gsap.to(d, { attr: { scale: 9 }, duration: 0.45, ease: "power3.out" });
      gsap.fromTo(t, { attr: { baseFrequency: "0.008 0.03" } }, { attr: { baseFrequency: "0.016 0.055" }, duration: 2.2, ease: "sine.inOut", yoyo: true, repeat: -1 });
    } else {
      gsap.to(d, { attr: { scale: 0 }, duration: 0.7, ease: "elastic.out(1, 0.5)", onComplete: () => void (label.style.filter = "") });
    }
  };

  const goInquiry = () => {
    setMenuOpen(false);
    openInquiry("quote");
  };

  useEffect(() => {
    const read = () => setDarkTheme(document.documentElement.dataset.theme === "dark");
    read();
    window.addEventListener("smc:theme", read);
    return () => window.removeEventListener("smc:theme", read);
  }, []);

  // Pick light or dark ink from whatever section sits under the controls.
  useEffect(() => {
    let raf = 0;
    const measure = () => {
      raf = 0;
      const x = window.innerWidth - 120;
      const stack = document.elementsFromPoint(x, 40);
      const under = stack.find((el) => !el.closest("[data-site-header],[data-overlay],#site-menu"));
      const host = under?.closest<HTMLElement>("[data-header],[data-surface]");
      // Navy surfaces exist only in the dark theme; light sections keep dark ink in both.
      const dark = document.documentElement.dataset.theme === "dark";
      // "hero" surfaces (page heroes, the menu) are navy in the dark theme and light in the light theme.
      const surface = host?.dataset.surface;
      const navy = dark && (surface === "inverse" || surface === "hero");
      const tone = host?.dataset.header ?? (surface === "accent" || surface === "photo" || navy ? "light" : "dark");
      setLight(tone === "light");
    };
    const schedule = () => {
      // A short timer rather than a frame callback, so it still runs when the tab is throttled or the page is mid view-transition.
      if (!raf) raf = window.setTimeout(measure, 30);
    };
    const onScroll = () => {
      const y = window.scrollY;
      setVisible(y < 100 || y < lastY.current);
      lastY.current = y;
      schedule();
    };
    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", schedule);
    // Measure at once, not on a timer: the theme switch fires this inside its view transition's setup, before the page is
    // frozen for the reveal, so the header's ink is already right in the new snapshot and nothing changes when it ends.
    window.addEventListener("smc:theme", measure);
    // The page can arrive after the header mounts (the loading screen is replaced by the real hero): measure again then.
    const mo = new MutationObserver(schedule);
    const main = document.querySelector("main");
    if (main) mo.observe(main, { childList: true, subtree: true });
    const t = setTimeout(measure, 400);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", schedule);
      window.removeEventListener("smc:theme", measure);
      mo.disconnect();
      clearTimeout(t);
      if (raf) clearTimeout(raf);
    };
  }, [pathname]);

  useGSAP(
    () => {
      gsap.to([logoRef.current, controlsRef.current], {
        y: visible || menuOpen ? 0 : -90,
        duration: 0.45,
        ease: "expoOut",
      });
    },
    { dependencies: [visible, menuOpen] },
  );

  // One small WebGL context for the ink; it only renders while the menu is moving or open.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ink = createInk(canvas);
    if (!ink) return;
    inkGl.current = ink;
    return () => {
      ink.destroy();
      inkGl.current = null;
    };
  }, []);

  /*
   * Opening spreads the ink out from the Menu button, then the links rise
   * through masks. Closing plays the same timeline backwards.
   */
  useEffect(() => {
    const menu = menuRef.current;
    const trigger = triggerRef.current;
    if (!menu || !trigger) return;

    if (menuOpen) {
      getLenis()?.stop();
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const r = trigger.getBoundingClientRect();
      const ox = (r.left + r.width / 2) / window.innerWidth;
      const oy = 1 - (r.top + r.height / 2) / window.innerHeight;
      const prog = { v: 0 };
      tl.current?.kill();
      menu.style.visibility = "visible";
      inkGl.current?.draw(0, ox, oy);
      inkGl.current?.start();
      const t = gsap.timeline({
        onReverseComplete: () => {
          menu.style.visibility = "hidden";
          inkGl.current?.stop();
        },
      });
      t.to(prog, { v: 1, duration: 1.25, ease: "power2.inOut", onUpdate: () => inkGl.current?.draw(prog.v, ox, oy) })
        // The header's own quote link is part of the same timeline: it steps up and away as the ink leaves the Menu button,
        // and, because closing plays this backwards, returns as the ink withdraws. The menu has its own quote button.
        .to("[data-header-quote]", { autoAlpha: 0, y: -14, duration: 0.55, ease: "power2.in" }, 0)
        .fromTo(
          "[data-menu-line]",
          { yPercent: 115 },
          { yPercent: 0, duration: 1, stagger: 0.06, ease: "expoOut" },
          0.6,
        )
        .fromTo(
          "[data-menu-fade]",
          { autoAlpha: 0, y: 16 },
          { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "expoOut" },
          0.85,
        );
      if (reduce) t.timeScale(20);
      tl.current = t;
    } else if (tl.current) {
      tl.current.timeScale(1.5).reverse();
      getLenis()?.start();
    }
    return () => getLenis()?.start();
  }, [menuOpen]);

  // Close the menu at once, with no animation, while the page is covered by ink: a new page is in, or the theme changed.
  const closeNow = () => {
    const menu = menuRef.current;
    if (tl.current && menu) {
      tl.current.pause().progress(0);
      menu.style.visibility = "hidden";
      inkGl.current?.stop();
    }
    setMenuOpen(false);
    getLenis()?.start();
  };

  useEffect(() => {
    closeNow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    window.addEventListener("smc:close-menu", closeNow);
    return () => window.removeEventListener("smc:close-menu", closeNow);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Ink for the plain text controls: light over navy and the open menu, dark over light sections.
  // Over the open menu the controls follow the theme (the menu is navy in dark, light in light); otherwise the section under them.
  const onDark = menuOpen ? darkTheme : light;
  const ink = onDark ? "text-white" : "text-deep";
  // Hover and focus change the word by motion (scale and the liquid ripple), never by colour: a coloured word over the liquid loses contrast.
  const over = "";

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <LiquidFilter disp={disp} turb={turb} />
      <Link
        ref={logoRef}
        data-site-header
        href="/"
        aria-label="SM Chemicals home"
        className="fixed left-6 top-4 z-999 sm:left-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]"
      >
        <Image
          src="/smc_logo.png"
          alt="SM Chemicals"
          width={1534}
          height={970}
          className="h-12 w-auto"
          priority
        />
      </Link>

      <div
        ref={controlsRef}
        data-site-header
        className="fixed right-6 top-4 z-999 flex items-center gap-3 sm:right-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]"
      >
        {/* Quote: plain text. While the menu is open it steps aside, so the menu's own button is the only one. */}
        <button
          type="button"
          onClick={goInquiry}
          onPointerEnter={liquid(true)}
          onPointerLeave={liquid(false)}
          onFocus={liquid(true)}
          onBlur={liquid(false)}
          data-header-quote
          tabIndex={menuOpen ? -1 : 0}
          aria-hidden={menuOpen || undefined}
          className={`group/x relative hidden h-11 cursor-pointer items-center px-3 font-heading text-[1.0625rem] font-semibold tracking-[-0.02em] outline-none transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.07] focus-visible:scale-[1.07] sm:inline-flex ${ink} ${over}`}
        >
          <span data-liquid className="inline-flex items-center gap-1.5">
            Request a quote
            <ArrowUpRight
              aria-hidden
              strokeWidth={2.25}
              className="h-[1.1em] w-[1.1em] transition-transform duration-300 group-hover/x:-translate-y-0.5 group-hover/x:translate-x-0.5 group-focus-visible/x:-translate-y-0.5 group-focus-visible/x:translate-x-0.5"
            />
          </span>
        </button>

        {/* Menu: plain text too. The word swaps to "Close" while open, and the same line draws under it. */}
        <span ref={triggerRef} className="inline-flex">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            onPointerEnter={liquid(true)}
            onPointerLeave={liquid(false)}
            onFocus={liquid(true)}
            onBlur={liquid(false)}
            aria-expanded={menuOpen}
            aria-controls="site-menu"
            className={`group/x relative grid h-11 min-w-20 cursor-pointer items-center justify-items-center px-3 font-heading text-[1.0625rem] font-semibold tracking-[-0.02em] outline-none transition-[color,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:scale-[1.07] focus-visible:scale-[1.07] ${ink} ${over}`}
          >
            <span data-liquid className="col-start-1 row-start-1 grid">
              {/* The word changes by dissolving, not rolling. */}
              <span className={`col-start-1 row-start-1 transition-opacity duration-300 ${menuOpen ? "opacity-0" : "opacity-100"}`}>Menu</span>
              <span aria-hidden={!menuOpen} className={`col-start-1 row-start-1 transition-opacity duration-300 ${menuOpen ? "opacity-100" : "opacity-0"}`}>Close</span>
            </span>
          </button>
        </span>
      </div>

      <div
        id="site-menu"
        ref={menuRef}
        data-surface="hero"
        aria-hidden={!menuOpen}
        className="fixed inset-0 z-900 overflow-y-auto text-foreground"
        style={{ visibility: "hidden", pointerEvents: menuOpen ? "auto" : "none" }}
      >
        <canvas ref={canvasRef} aria-hidden className="pointer-events-none fixed inset-0 h-full w-full" />
        <div className="relative mx-auto flex min-h-full max-w-7xl flex-col justify-between gap-12 px-6 pb-10 pt-28 sm:px-10 lg:grid lg:grid-cols-12 lg:items-end lg:gap-8 lg:pb-14">
          <nav aria-label="Primary" className="group/nav lg:col-span-8">
            {navigation.map((item) => (
              <div key={item.name} className="overflow-hidden">
                <Link
                  data-menu-line
                  href={item.href}
                  tabIndex={menuOpen ? 0 : -1}
                  onClick={() => {
                    // A page transition takes over from here and closes the menu once covered; only a same-page click closes it now.
                    if (item.href === pathname) setMenuOpen(false);
                  }}
                  className="group/link flex items-center gap-[0.25em] py-[0.04em] outline-none transition-opacity duration-300 group-hover/nav:opacity-35 hover:opacity-100! focus-visible:opacity-100!"
                >
                  <span
                    className={`font-heading text-[clamp(2.75rem,min(11vw,11svh),8rem)] font-semibold leading-[1.14] tracking-tighter transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/link:translate-x-3 group-focus-visible/link:translate-x-3 ${
                      isActive(item.href) ? "text-accent" : "text-foreground"
                    }`}
                  >
                    {item.name}
                  </span>
                  <span
                    aria-hidden
                    className={`block h-[clamp(2.25rem,min(7.5vw,9svh),6.5rem)] w-0 shrink-0 overflow-hidden transition-[width] duration-500 ${EASE} group-hover/link:w-[clamp(2.25rem,min(7.5vw,9svh),6.5rem)] group-focus-visible/link:w-[clamp(2.25rem,min(7.5vw,9svh),6.5rem)]`}
                  >
                    <ArrowUpRight
                      strokeWidth={1.75}
                      className={`h-[clamp(2.25rem,min(7.5vw,9svh),6.5rem)] w-[clamp(2.25rem,min(7.5vw,9svh),6.5rem)] -translate-x-full translate-y-full text-accent-ink transition-transform duration-500 ${EASE} group-hover/link:translate-x-0 group-hover/link:translate-y-0 group-focus-visible/link:translate-x-0 group-focus-visible/link:translate-y-0`}
                    />
                  </span>
                </Link>
              </div>
            ))}
          </nav>

          <div className="flex flex-col gap-10 lg:col-span-4 lg:pb-3">
            {/* Reach us: email at headline weight, then phone, then where. */}
            <div data-menu-fade>
              <a
                href={`mailto:${email}`}
                tabIndex={menuOpen ? 0 : -1}
                className="group/mail flex items-center gap-2 break-all font-heading text-[clamp(1.5rem,2.4vw,2.25rem)] font-semibold leading-[1.1] tracking-[-0.03em] transition-colors hover:text-accent-ink sm:break-normal"
              >
                {email}
                <span className="relative block h-6 w-6 shrink-0 overflow-hidden">
                  <ArrowUpRight aria-hidden className={`absolute inset-0 h-full w-full transition-transform duration-500 ${EASE} group-hover/mail:translate-x-full group-hover/mail:-translate-y-full`} />
                  <ArrowUpRight aria-hidden className={`absolute inset-0 h-full w-full -translate-x-full translate-y-full transition-transform duration-500 ${EASE} group-hover/mail:translate-x-0 group-hover/mail:translate-y-0`} />
                </span>
              </a>
              <a
                href={`tel:${phone.replace(/\s+/g, "")}`}
                tabIndex={menuOpen ? 0 : -1}
                className="mt-3 block text-xl text-foreground/80 transition-colors hover:text-foreground"
              >
                {phone}
              </a>
              <address className="mt-3 text-base not-italic leading-[1.5] text-muted">
                {SITE.location}, Telangana
              </address>
            </div>

            {/* When: the hours, and whether the office is open right now (India time). */}
            {hours && (
              <div data-menu-fade className="text-base leading-[1.5]">
                <p className="text-foreground/80">{hours}</p>
                {status && <p className={status.open ? "font-medium text-foreground" : "text-muted"}>{status.label}</p>}
              </div>
            )}

            <div data-menu-fade className="flex flex-wrap items-center gap-x-8 gap-y-4">
              <Button variant="primary" size="lg" arrow="up-right" onClick={goInquiry} tabIndex={menuOpen ? 0 : -1}>
                Request a quote
              </Button>
              <ThemeToggle className="text-lg text-muted hover:text-foreground" />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
