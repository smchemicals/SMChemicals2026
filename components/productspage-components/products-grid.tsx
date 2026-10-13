"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Link from "next/link";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { revealCells } from "@/lib/reveal-cells";
import { getLenis } from "@/lib/smooth-scroll";
import { X, ArrowUpRight, ArrowRight, ChevronDown } from "lucide-react";
import type { Product, ProductSpec, ProductCategory } from "@/data/products";
import { CtaSubmit } from "@/components/ui/cta-button";
import { ProductQuoteForm } from "./product-quote-form";

const SPEC_LABELS: { key: keyof ProductSpec; label: string }[] = [
  { key: "chemicalName", label: "Chemical Name" },
  { key: "formula", label: "Formula" },
  { key: "cas", label: "CAS No." },
  { key: "appearance", label: "Appearance" },
  { key: "purity", label: "Purity" },
  { key: "grade", label: "Grade" },
  { key: "solidContent", label: "Solid Content" },
  { key: "packaging", label: "Packaging" },
  { key: "endUse", label: "End Use" },
  { key: "synonyms", label: "Synonyms" },
];

const CARD_PRIORITY: { key: keyof ProductSpec; label: string }[] = [
  { key: "cas", label: "CAS" },
  { key: "purity", label: "Purity" },
  { key: "appearance", label: "Appearance" },
  { key: "grade", label: "Grade" },
  { key: "endUse", label: "Use" },
];

const HEADER_OFFSET = 110;

export function ProductsGrid({ categories }: { categories: ProductCategory[] }) {
  const sortedCategories = useMemo(
    () =>
      [...categories]
        .sort((a, b) => a.name.localeCompare(b.name))
        .map((cat) => ({
          ...cat,
          products: [...cat.products].sort((a, b) =>
            a.name.localeCompare(b.name),
          ),
        })),
    [categories],
  );

  const [activeId, setActiveId] = useState(sortedCategories[0]?.id ?? "");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);
  const [quoteMode, setQuoteMode] = useState(false);

  useEffect(() => {
    setQuoteMode(false);
  }, [openProduct]);
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const rootRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const scrollToCategory = (id: string) => {
    const mobile = document.getElementById(`m-cat-${id}`);
    const desktop = document.getElementById(`cat-${id}`);
    const el =
      mobile && mobile.offsetParent !== null
        ? mobile
        : desktop && desktop.offsetParent !== null
          ? desktop
          : mobile || desktop;
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -HEADER_OFFSET });
    else
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET,
        behavior: "smooth",
      });
  };

  useEffect(() => {
    const handleScrollToCategory = () => {
      const target = sessionStorage.getItem("smc:scrollCategory");
      if (target && sortedCategories.some((c) => c.id === target)) {
        sessionStorage.removeItem("smc:scrollCategory");
        setOpenCategory(target);
        setTimeout(() => scrollToCategory(target), 420);
      }
    };

    handleScrollToCategory();
    window.addEventListener("scroll-to-category", handleScrollToCategory);
    return () =>
      window.removeEventListener("scroll-to-category", handleScrollToCategory);
  }, []);

  useEffect(() => {
    const sections = sortedCategories
      .map((c) => document.getElementById(`cat-${c.id}`))
      .filter((el): el is HTMLElement => Boolean(el));

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting)
            setActiveId(entry.target.id.replace("cat-", ""));
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );

    sections.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  // Desktop reveal: each category's count, name and blurb rise in and its
  // rule draws across as the category arrives (one ScrollTrigger each, since
  // batch mis-fires under Lenis). The cards use the shared card-grid reveal.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.utils
          .toArray<HTMLElement>("[data-cat]", rootRef.current)
          .forEach((cat) => {
            const head = cat.querySelectorAll("[data-cat-head]");
            const rule = cat.querySelector("[data-cat-rule]");

            gsap.set(head, { autoAlpha: 0, y: 20, filter: "blur(4px)" });
            gsap.set(rule, { scaleX: 0, transformOrigin: "left center" });

            gsap
              .timeline({
                defaults: { ease: "expo" },
                scrollTrigger: { trigger: cat, start: "top 85%", once: true },
              })
              .to(head, {
                autoAlpha: 1,
                y: 0,
                filter: "blur(0px)",
                duration: 0.9,
                stagger: 0.08,
              })
              .to(rule, { scaleX: 1, duration: 1.2 }, "<0.1");
          });
      });

      revealCells(rootRef.current);
    },
    { scope: rootRef },
  );

  useGSAP(
    () => {
      if (!openProduct || !drawerRef.current || !panelRef.current) return;
      getLenis()?.stop();
      gsap.fromTo(
        drawerRef.current,
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.3, ease: "power2.out" },
      );
      gsap.fromTo(
        panelRef.current,
        { xPercent: 100 },
        { xPercent: 0, duration: 0.5, ease: "expo" },
      );
    },
    { dependencies: [openProduct] },
  );

  const closeDrawer = () => {
    getLenis()?.start();
    if (!drawerRef.current || !panelRef.current) {
      setOpenProduct(null);
      return;
    }
    gsap.to(panelRef.current, {
      xPercent: 100,
      duration: 0.4,
      ease: "power2.in",
    });
    gsap.to(drawerRef.current, {
      autoAlpha: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => setOpenProduct(null),
    });
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeDrawer();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const drawerSpecs = openProduct
    ? SPEC_LABELS.filter(({ key }) => openProduct.spec[key])
    : [];

  return (
    <section
      ref={rootRef}
      className="pb-20 lg:pt-16 lg:pb-24 bg-background font-sans text-foreground"
    >
      {/* Mobile: accordion (no sticky / fixed) */}
      <div className="lg:hidden">
        {sortedCategories.map((cat) => {
          const open = openCategory === cat.id;
          return (
            <div
              key={cat.id}
              id={`m-cat-${cat.id}`}
              className="border-b border-line scroll-mt-24"
            >
              <button
                onClick={() => setOpenCategory(open ? null : cat.id)}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left active:bg-surface transition-colors cursor-pointer"
              >
                <span className="flex flex-col min-w-0">
                  <span className="type-label text-muted mb-1.5">
                    {String(cat.products.length).padStart(2, "0")} Products
                  </span>
                  <span className="font-heading text-lg font-semibold tracking-tight text-foreground leading-tight">
                    {cat.name}
                  </span>
                </span>
                <ChevronDown
                  size={20}
                  className={`shrink-0 transition-transform duration-300 ${
                    open ? "rotate-180 text-foreground" : "text-muted"
                  }`}
                />
              </button>

              <div
                className={`grid transition-[grid-template-rows] duration-300 ease-out ${
                  open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-6 pb-6 text-foreground/75 text-base font-light leading-relaxed">
                    {cat.blurb}
                  </p>
                  <div className="grid grid-cols-1 border-t border-line">
                    {cat.products.map((product) => (
                      <ProductCard
                        key={product.id}
                        product={product}
                        reveal={false}
                        onOpen={() => setOpenProduct(product)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden lg:block mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-row gap-16">
          <aside className="w-60 shrink-0">
            <div className="sticky top-32">
              <span className="type-label text-muted block mb-5">
                Portfolio
              </span>
              <ul className="space-y-1">
                {sortedCategories.map((cat) => (
                  <li key={cat.id}>
                    <button
                      onClick={() => scrollToCategory(cat.id)}
                      className="group flex items-center gap-3 w-full text-left py-2 cursor-pointer"
                    >
                      <span
                        className={`h-px transition-all duration-500 ${
                          activeId === cat.id
                            ? "w-6 bg-accent"
                            : "w-2 bg-line group-hover:w-4 group-hover:bg-muted"
                        }`}
                      />
                      <span
                        className={`text-[15px] font-medium transition-colors duration-500 ${
                          activeId === cat.id
                            ? "text-foreground"
                            : "text-muted group-hover:text-foreground"
                        }`}
                      >
                        {cat.name}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="flex-1 min-w-0 space-y-24">
            {sortedCategories.map((cat) => (
              <section
                key={cat.id}
                id={`cat-${cat.id}`}
                data-cat
                className="scroll-mt-32"
              >
                <div className="pb-6">
                  <span
                    data-cat-head
                    className="type-label text-muted block mb-3"
                  >
                    {String(cat.products.length).padStart(2, "0")} Products
                  </span>
                  <h2
                    data-cat-head
                    className="text-3xl lg:text-4xl font-semibold tracking-tight text-foreground"
                  >
                    {cat.name}
                  </h2>
                </div>
                <div data-cat-rule className="h-px bg-line mb-8" />
                <p
                  data-cat-head
                  className="text-foreground/75 text-base font-light leading-relaxed max-w-2xl mb-10"
                >
                  {cat.blurb}
                </p>

                <div
                  className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 border-t border-l border-line overflow-hidden bg-background"
                >
                  {cat.products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      reveal
                      onOpen={() => setOpenProduct(product)}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>

      {openProduct && (
        <div ref={drawerRef} className="fixed inset-0 z-[1100] flex justify-end">
          <div
            className="absolute inset-0 bg-deep/50 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <div
            ref={panelRef}
            className="relative h-full w-full max-w-xl bg-background flex flex-col shadow-2xl border-l border-line"
          >
            <div className="flex items-start justify-between gap-6 p-8 lg:p-12 border-b border-line bg-background">
              <div>
                {openProduct.spec.chemicalName &&
                  openProduct.spec.chemicalName !== openProduct.name && (
                    <span className="type-label text-muted block mb-3">
                      {openProduct.spec.chemicalName}
                    </span>
                  )}
                <h3 className="font-heading text-2xl lg:text-3xl font-semibold tracking-tight text-foreground leading-tight">
                  {openProduct.name}
                </h3>
              </div>
              <button
                onClick={closeDrawer}
                className="shrink-0 p-2 -mr-2 text-muted hover:text-foreground transition-colors duration-300 cursor-pointer"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div
              data-lenis-prevent
              className="flex-1 overflow-y-auto overscroll-contain p-8 lg:p-12 space-y-12 bg-background"
            >
              {quoteMode ? (
                <ProductQuoteForm
                  product={openProduct}
                  onBack={() => setQuoteMode(false)}
                />
              ) : (
                <>
              {openProduct.image && (
                <div className="overflow-hidden rounded-sm border border-line">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={openProduct.image}
                    alt={openProduct.name}
                    className="h-56 w-full object-cover lg:h-64"
                  />
                </div>
              )}
              <div className="space-y-4">
                <span className="type-label text-foreground block">
                  Overview
                </span>
                <p className="text-foreground/75 text-base font-light leading-relaxed">
                  {openProduct.description}
                </p>
              </div>

              {drawerSpecs.length > 0 && (
                <div>
                  <span className="type-label text-foreground block mb-6">
                    Specifications
                  </span>
                  <dl className="divide-y divide-line border-y border-line">
                    {drawerSpecs.map(({ key, label }) => (
                      <div key={key} className="flex gap-6 py-4">
                        <dt className="type-label w-32 shrink-0 text-muted pt-0.5">
                          {label}
                        </dt>
                        <dd className="text-base font-light text-foreground break-words leading-relaxed">
                          {openProduct.spec[key]}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
                </>
              )}
            </div>

            {!quoteMode && (
              <div className="p-8 lg:p-12 border-t border-line bg-background">
                <CtaSubmit
                  type="button"
                  onClick={() => setQuoteMode(true)}
                  className="w-full"
                >
                  Request a Quote
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </CtaSubmit>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}

function ProductCard({
  product,
  onOpen,
  reveal = false,
}: {
  product: Product;
  onOpen: () => void;
  reveal?: boolean;
}) {
  const keySpecs = CARD_PRIORITY.filter(({ key }) => product.spec[key]).slice(
    0,
    2,
  );

  return (
    <button
      onClick={onOpen}
      data-cell={reveal || undefined}
      className={`group text-left flex flex-col h-full bg-surface p-8 lg:p-10 border-b border-r border-line transition-colors duration-500 hover:bg-background relative overflow-hidden cursor-pointer`}
    >
      <div
        data-cell-part={reveal || undefined}
        className="flex items-start justify-between gap-4 mb-4 relative z-10"
      >
        <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground leading-snug transition-colors group-hover:text-accent-ink">
          {product.name}
        </h3>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-muted group-hover:text-accent-ink group-hover:scale-110 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-500"
        />
      </div>

      <p
        data-cell-part={reveal || undefined}
        className="text-base font-light leading-relaxed text-foreground/75 line-clamp-3 mb-8 relative z-10"
      >
        {product.description}
      </p>

      {keySpecs.length > 0 && (
        <dl
          data-cell-part={reveal || undefined}
          className="mt-auto flex flex-wrap gap-x-6 gap-y-3 pt-5 border-t border-line relative z-10 w-full">
          {keySpecs.map(({ key, label }) => (
            <div key={key} className="min-w-0">
              <dt className="type-label text-muted mb-0.5">
                {label}
              </dt>
              <dd className="text-sm text-foreground/80 truncate">
                {product.spec[key]}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-line opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
}
