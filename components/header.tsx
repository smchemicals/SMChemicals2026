"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";

const navigation = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/products" },
  { name: "About", href: "/about" },
  { name: "Blog", href: "/blog" },
  { name: "Careers", href: "/careers" },
  { name: "Contact", href: "/contact" },
];

const CLIP = (r: number) => `circle(${r}% at calc(100% - 32px) 40px)`;

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const goInquiry = () => {
    sessionStorage.setItem("smc:scrollInquiry", "1");
    setMobileMenuOpen(false);
    if (pathname === "/contact")
      window.dispatchEvent(new Event("scroll-to-inquiry"));
    else router.push("/contact");
  };

  const lastScrollY = useRef(0);
  const menuRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);
  const radiusRef = useRef({ value: 0 });

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 20);
      setVisible(
        currentScrollY < 100 ||
          currentScrollY < lastScrollY.current ||
          mobileMenuOpen,
      );
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [mobileMenuOpen]);

  useGSAP(
    () => {
      gsap.to(headerRef.current, {
        y: visible ? 0 : -100,
        duration: 0.4,
        ease: "power2.out",
      });
    },
    { dependencies: [visible] },
  );

  useGSAP(() => {
    const menu = menuRef.current;
    if (!menu) return;
    tl.current = gsap
      .timeline({ paused: true })
      .to(radiusRef.current, {
        value: 150,
        duration: 0.6,
        ease: "power3.inOut",
        onUpdate: () => {
          menu.style.clipPath = CLIP(radiusRef.current.value);
        },
      })
      .fromTo(
        ".menu-item",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.05 },
        "-=0.3",
      );
  }, []);

  useEffect(() => {
    if (mobileMenuOpen) tl.current?.play();
    else tl.current?.reverse();
  }, [mobileMenuOpen]);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      <header ref={headerRef} className="fixed top-0 w-full z-[999]">
        <div
          className={`absolute inset-0 border-b transition-all duration-300 ${scrolled ? "border-line bg-background/75 backdrop-blur-md" : "border-transparent bg-transparent"}`}
        />

        <div className="relative mx-auto max-w-7xl px-6 sm:px-10 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center">
            <Image
              src="/smc_logo.png"
              alt="SM Chemicals"
              width={1534}
              height={970}
              className="h-10 sm:h-11 w-auto"
              priority
            />
          </Link>

          <nav className="hidden lg:flex absolute left-1/2 -translate-x-1/2 gap-9 items-center">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="relative group py-2"
              >
                <span
                  className={`text-[11px] font-bold uppercase tracking-[0.25em] transition-colors ${isActive(item.href) ? "text-foreground" : "text-foreground/60 group-hover:text-foreground"}`}
                >
                  {item.name}
                </span>
                <span
                  className={`absolute -bottom-0.5 left-0 h-px bg-accent transition-all duration-300 ${isActive(item.href) ? "w-full" : "w-0 group-hover:w-full"}`}
                />
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={goInquiry}
              className="hidden lg:inline-flex items-center rounded-sm bg-cta px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.25em] text-cta-foreground hover:bg-cta-hover transition-colors cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              Inquiry
            </button>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
              className="lg:hidden relative z-[999] -mr-2 flex flex-col justify-center items-center w-10 h-10 cursor-pointer"
            >
              <span
                className={`block h-px w-6 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "rotate-45 translate-y-[0.5px]" : "-translate-y-1.25"}`}
              />
              <span
                className={`block h-px w-6 bg-foreground transition-all duration-300 ${mobileMenuOpen ? "-rotate-45 translate-y-[-0.5px]" : "translate-y-1.25"}`}
              />
            </button>
          </div>
        </div>
      </header>

      <div
        ref={menuRef}
        className="fixed inset-0 bg-deep z-[900] flex flex-col justify-center px-8"
        style={{
          clipPath: "circle(0% at calc(100% - 32px) 40px)",
          pointerEvents: mobileMenuOpen ? "auto" : "none",
        }}
      >
        <nav className="flex flex-col gap-6">
          {navigation.map((item) => (
            <div
              key={item.name}
              className="menu-item opacity-0 flex items-center gap-4"
            >
              <div
                className={`w-2 h-2 rounded-full bg-accent transition-opacity ${isActive(item.href) ? "opacity-100" : "opacity-0"}`}
              />
              <Link
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-4xl font-bold uppercase text-foreground"
              >
                {item.name}
              </Link>
            </div>
          ))}
        </nav>
        <button
          type="button"
          onClick={goInquiry}
          className="menu-item opacity-0 mt-12 self-start rounded-sm bg-cta px-6 py-4 text-[12px] font-bold uppercase tracking-[0.25em] text-cta-foreground cursor-pointer"
        >
          Send an inquiry
        </button>
      </div>
    </>
  );
}
