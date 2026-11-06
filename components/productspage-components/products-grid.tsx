"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { testImageFor } from "@/lib/test-images";
import { ArrowUpRight, ArrowRight, ArrowLeft, Check, Link2, Search, X } from "lucide-react";
import type { Product, ProductSpec, ProductCategory } from "@/data/products";
import { Select } from "@/components/ui/select";
import { openInquiry } from "@/lib/inquiry";
import { takeScrollCategory } from "@/lib/handoff";
import { PopularTag } from "@/components/ui/popular-tag";
import { Button } from "@/components/ui/button";

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

const HEADER_OFFSET = 100;

/* The facts pulled out large at the top of a product page. */
const HIGHLIGHT_KEYS: (keyof ProductSpec)[] = ["cas", "purity", "appearance", "grade"];

type Entry = { product: Product; categoryId: string; categoryName: string };

/*
 * The whole catalogue as one list: every chemical, alphabetically, with its
 * industry, CAS number and purity on the row. Filter by industry or search;
 * open a row for the full specification and a quote request.
 */
/* Clipboard API where the browser allows it; the older select-and-copy where it doesn't (an unfocused frame, an older browser). */
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.cssText = "position:fixed;top:0;left:0;opacity:0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    if (!ok) throw new Error("copy failed");
  }
}

export function ProductsGrid({ categories }: { categories: ProductCategory[] }) {
  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.name.localeCompare(b.name)),
    [categories],
  );

  const all: Entry[] = useMemo(
    () =>
      sortedCategories
        .flatMap((c) => c.products.map((p) => ({ product: p, categoryId: c.id, categoryName: c.name })))
        .sort((a, b) => a.product.name.localeCompare(b.product.name)),
    [sortedCategories],
  );

  // A chemical's link uses its name: /products?product=zeolite. Two chemicals can share a name in different industries, and
  // those get the industry added (biocides-pulp-paper-chemicals), so every link is unique and readable.
  const links = useMemo(() => {
    const slug = (t: string) =>
      t
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
    const count = new Map<string, number>();
    all.forEach((e) => count.set(slug(e.product.name), (count.get(slug(e.product.name)) ?? 0) + 1));
    const byId = new Map<string, string>();
    const bySlug = new Map<string, Product>();
    all.forEach((e) => {
      const base = slug(e.product.name) || e.product.id;
      let s = count.get(base)! > 1 ? `${base}-${slug(e.categoryName)}` : base;
      while (bySlug.has(s)) s += "-2";
      byId.set(e.product.id, s);
      bySlug.set(s, e.product);
    });
    // If a name that used to be unique gains a twin (someone adds a second "Zeolite" in the admin), the plain link that was
    // already shared keeps working: it opens the first of them instead of nothing.
    all.forEach((e) => {
      const base = slug(e.product.name);
      if (base && count.get(base)! > 1 && !bySlug.has(base)) bySlug.set(base, e.product);
    });
    return { byId, bySlug };
  }, [all]);

  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [openProduct, setOpenProduct] = useState<Product | null>(null);

  // Every chemical has its own link: /products?product=<name> opens it. The address follows the open chemical, so what is in the
  // address bar is always shareable, and a shared link lands straight on the chemical (an unknown id just shows the list).
  useEffect(() => {
    const fromUrl = () => {
      const key = new URLSearchParams(window.location.search).get("product");
      setOpenProduct((cur) => {
        if (!key) return null;
        // The name in the link; an older link that used the chemical's id still opens it.
        const found = links.bySlug.get(key.toLowerCase()) ?? all.find((e) => e.product.id === key)?.product;
        // A link to something that isn't there shows the list, so the page must not stay held back.
        if (!found) {
          document.documentElement.classList.remove("deep-link");
          return cur;
        }
        return cur?.id === found.id ? cur : found;
      });
    };
    fromUrl();
    window.addEventListener("popstate", fromUrl);
    return () => window.removeEventListener("popstate", fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const firstSync = useRef(true);
  useEffect(() => {
    // Don't strip a link's ?product= before the effect above has opened it.
    if (firstSync.current) {
      firstSync.current = false;
      if (!openProduct && new URLSearchParams(window.location.search).has("product")) return;
    }
    // Once the chemical has faded in over the held-back page, the page may show again (for when it is closed).
    if (openProduct && document.documentElement.classList.contains("deep-link")) {
      setTimeout(() => document.documentElement.classList.remove("deep-link"), 800);
    }
    const url = new URL(window.location.href);
    if (openProduct) url.searchParams.set("product", links.byId.get(openProduct.id) ?? openProduct.id);
    else url.searchParams.delete("product");
    if (url.href !== window.location.href) window.history.replaceState(window.history.state, "", url.href);
  }, [openProduct]);

  const [shared, setShared] = useState(false);
  const share = async () => {
    if (!openProduct) return;
    const url = new URL(window.location.href);
    url.searchParams.set("product", links.byId.get(openProduct.id) ?? openProduct.id);
    const data = { title: `${openProduct.name} | SM Chemicals`, text: `${openProduct.name} from SM Chemicals`, url: url.toString() };
    try {
      if (navigator.share && window.matchMedia("(pointer: coarse)").matches) {
        await navigator.share(data);
        return;
      }
      await copyText(data.url);
      setShared(true);
      setTimeout(() => setShared(false), 2200);
    } catch {
      // A cancelled share sheet is not an error; a blocked clipboard leaves the address bar, which already has the link.
    }
  };

  const rootRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  const category = sortedCategories.find((c) => c.id === selected) ?? null;
  const q = query.trim().toLowerCase();

  const visible = useMemo(() => {
    return all.filter((e) => {
      if (selected && e.categoryId !== selected) return false;
      if (!q) return true;
      const p = e.product;
      const hay = [p.name, p.description, p.spec.chemicalName, p.spec.cas, p.spec.synonyms, p.spec.formula]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [all, selected, q]);

  // Grouped by industry. A single selected industry is just a plain list, since the heading already names it.
  const groups = useMemo(() => {
    if (selected) return visible.length ? [{ key: "", label: "", items: visible }] : [];
    return sortedCategories
      .map((c) => ({ key: c.id, label: c.name, items: visible.filter((e) => e.categoryId === c.id) }))
      .filter((g) => g.items.length > 0);
  }, [visible, selected, sortedCategories]);

  // Suggestions while typing: names that start with what was typed first, then words that do, then anywhere in the name,
  // then the other fields (chemical name, synonyms, CAS, formula). Independent of the industry filter, so a suggestion is never missing.
  const [focused, setFocused] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [active, setActive] = useState(-1);
  const suggestions = useMemo(() => {
    if (!q) return [];
    const scored: { e: (typeof all)[number]; s: number }[] = [];
    for (const e of all) {
      const p = e.product;
      const name = p.name.toLowerCase();
      let s = -1;
      if (name.startsWith(q)) s = 0;
      else if (name.split(/[^a-z0-9]+/).some((w) => w.startsWith(q))) s = 1;
      else if (name.includes(q)) s = 2;
      else if ([p.spec.chemicalName, p.spec.synonyms, p.spec.cas, p.spec.formula].filter(Boolean).join(" ").toLowerCase().includes(q)) s = 3;
      if (s >= 0) scored.push({ e, s });
    }
    return scored.sort((a, b) => a.s - b.s || a.e.product.name.localeCompare(b.e.product.name)).slice(0, 6).map((x) => x.e);
  }, [all, q]);
  const listOpen = focused && !dismissed && suggestions.length > 0 && !(suggestions.length === 1 && suggestions[0].product.name.toLowerCase() === q);
  const pick = (name: string) => {
    setQuery(name);
    setDismissed(true);
    setActive(-1);
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      if (!suggestions.length) return;
      e.preventDefault();
      setDismissed(false);
      const n = suggestions.length;
      setActive((i) => (e.key === "ArrowDown" ? (i + 1) % n : (i - 1 + n) % n));
    } else if (e.key === "Enter" && listOpen && active >= 0) {
      e.preventDefault();
      pick(suggestions[active].product.name);
    } else if (e.key === "Escape" && listOpen) {
      e.preventDefault();
      setDismissed(true);
    }
  };
  const mark = (text: string) => {
    const i = text.toLowerCase().indexOf(q);
    if (i < 0) return text;
    return (
      <>
        {text.slice(0, i)}
        <span className="text-foreground">{text.slice(i, i + q.length)}</span>
        {text.slice(i + q.length)}
      </>
    );
  };

  const scrollToTop = () => {
    const el = rootRef.current;
    if (!el) return;
    const y = Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET);
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(y);
    else window.scrollTo({ top: y, behavior: "smooth" });
    // If nothing moved (the engine wasn't ready yet), scroll there directly.
    setTimeout(() => {
      if (Math.abs(window.scrollY - y) > 80) window.scrollTo({ top: y });
    }, 1400);
  };

  // Deep links from the homepage industries section.
  useEffect(() => {
    const open = () => {
      const target = takeScrollCategory();
      if (target && sortedCategories.some((c) => c.id === target)) {
        setSelected(target);
        setTimeout(scrollToTop, 600);
      }
    };
    open();
    window.addEventListener("scroll-to-category", open);
    return () => window.removeEventListener("scroll-to-category", open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rows rise in when the filter or search changes.
  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.from("[data-row]", {
          autoAlpha: 0,
          y: 16,
          duration: 0.6,
          stagger: 0.015,
          ease: "expoOut",
          clearProps: "all",
        });
      });
    },
    { scope: rootRef, dependencies: [selected, q] },
  );

  // Detail view: fade the screen in once, then rise the content in on every product.
  useGSAP(
    () => {
      if (!openProduct || !drawerRef.current) return;
      getLenis()?.stop();
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo("[data-d]", { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.06, ease: "expoOut" });
      });
    },
    { scope: drawerRef, dependencies: [openProduct?.id] },
  );

  useGSAP(
    () => {
      if (!openProduct || !drawerRef.current) return;
      gsap.fromTo(drawerRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
    },
    { dependencies: [!!openProduct] },
  );

  const closeDrawer = () => {
    getLenis()?.start();
    if (!drawerRef.current) {
      setOpenProduct(null);
      return;
    }
    gsap.to(drawerRef.current, {
      autoAlpha: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => setOpenProduct(null),
    });
  };

  // The list the detail view moves through: whatever is currently shown, else everything.
  const navList = visible.length ? visible : all;
  const navIndex = openProduct ? navList.findIndex((e) => e.product.id === openProduct.id) : -1;
  const prevEntry = navIndex > 0 ? navList[navIndex - 1] : null;
  const nextEntry = navIndex >= 0 && navIndex < navList.length - 1 ? navList[navIndex + 1] : null;
  const openEntry = openProduct ? all.find((e) => e.product.id === openProduct.id) : null;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDrawer();
      if (!openProduct) return;
      if (e.key === "ArrowRight" && nextEntry) setOpenProduct(nextEntry.product);
      if (e.key === "ArrowLeft" && prevEntry) setOpenProduct(prevEntry.product);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openProduct, nextEntry, prevEntry]);

  const drawerSpecs = openProduct ? SPEC_LABELS.filter(({ key }) => openProduct.spec[key]) : [];
  const highlights = openProduct
    ? HIGHLIGHT_KEYS.filter((k) => openProduct.spec[k]).slice(0, 3).map((k) => SPEC_LABELS.find((l) => l.key === k)!)
    : [];
  const restSpecs = drawerSpecs.filter(({ key }) => !highlights.some((h) => h.key === key));
  // A chemical with no photo, or one whose photo won't load, simply has no image column: the name takes the width and the
  // page reads as it should, with no empty frame beside it.
  const [brokenImage, setBrokenImage] = useState<string | null>(null);
  const rawImage = openProduct ? (openProduct.image ?? testImageFor(openProduct.id)) : undefined;
  const imageSrc = openProduct && brokenImage === openProduct.id ? undefined : rawImage;
  const count = `${visible.length} ${visible.length === 1 ? "chemical" : "chemicals"}`;

  const chip = (id: string | null, label: string) => (
    <li key={id ?? "all"} className="shrink-0">
      <button
        type="button"
        onClick={() => setSelected(id)}
        aria-pressed={selected === id}
        className={`h-11 cursor-pointer whitespace-nowrap rounded-md px-4 font-heading text-[0.9375rem] font-semibold tracking-[-0.02em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
          selected === id
            ? "bg-foreground text-background"
            : "bg-foreground/5 text-foreground/70 hover:bg-foreground/10 hover:text-foreground"
        }`}
      >
        {label}
      </button>
    </li>
  );

  return (
    <section
      data-motion="off"
      ref={rootRef}
      id="catalogue"
      className="bg-background pb-24 pt-16 font-sans text-foreground lg:pb-36 lg:pt-24"
    >
      <div className="mx-auto max-w-7xl px-6 sm:px-10">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <h2 className="font-heading text-[clamp(2.5rem,6vw,5.5rem)] font-semibold leading-none tracking-[-0.03em]">
              {category ? category.name : (
                <>
                  All <span className="text-accent-ink">chemicals.</span>
                </>
              )}
            </h2>
            {category?.popular && <PopularTag className="mt-4" />}
            <p className="mt-4 text-lg text-muted" aria-live="polite">
              {category ? `${category.blurb} ` : ""}
              {count}
              {q ? ` match “${query.trim()}”` : ""}.
            </p>
          </div>

          <div className="relative w-full lg:w-80 lg:shrink-0">
            <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setDismissed(false);
                setActive(-1);
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={onKey}
              role="combobox"
              aria-expanded={listOpen}
              aria-controls="chemical-suggestions"
              aria-autocomplete="list"
              aria-activedescendant={listOpen && active >= 0 ? `chemical-suggestion-${active}` : undefined}
              autoComplete="off"
              placeholder="Search chemicals"
              aria-label="Search chemicals"
              className="h-14 w-full rounded-lg bg-surface pl-12 pr-12 text-base text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/10 hover:text-foreground"
              >
                <X aria-hidden className="h-4 w-4" />
              </button>
            )}
            {listOpen && (
              <ul
                id="chemical-suggestions"
                role="listbox"
                aria-label="Suggestions"
                className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-lg bg-surface py-2 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]"
              >
                {suggestions.map((e, i) => (
                  <li
                    key={e.product.id}
                    id={`chemical-suggestion-${i}`}
                    role="option"
                    aria-selected={i === active}
                    // mousedown, so the pick lands before the input loses focus and closes the list
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      pick(e.product.name);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={`flex cursor-pointer items-baseline justify-between gap-4 px-4 py-2.5 text-base text-muted transition-colors ${i === active ? "bg-foreground/8" : ""}`}
                  >
                    <span className="truncate">{mark(e.product.name)}</span>
                    <span className="shrink-0 text-sm text-muted/70">{sortedCategories.find((c) => c.id === e.categoryId)?.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* On a phone a menu (a dozen chips would fill the screen); from tablet up, chips that wrap so every industry is
            visible at once. Nothing scrolls sideways, which hides the industries past the edge. */}
        <div className="mt-6 sm:hidden">
          <Select
            label="Industry"
            value={selected ?? ""}
            onChange={(v) => setSelected(v || null)}
            options={[
              { value: "", label: "All industries" },
              ...sortedCategories.map((c) => ({ value: c.id, label: c.name, hint: c.popular ? "Popular" : undefined })),
            ]}
          />
        </div>
        <div className="mt-10 hidden sm:block">
          <ul className="flex flex-wrap gap-2">
            {chip(null, "All industries")}
            {sortedCategories.map((c) => chip(c.id, c.name))}
          </ul>
        </div>

        <div className="mt-14 lg:mt-20">
          {groups.length === 0 ? (
            <p className="font-heading text-[clamp(1.5rem,3vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.035em] text-muted">
              No chemicals match that. Try a different name or CAS number.
            </p>
          ) : (
            <div className="grid gap-y-14 lg:gap-y-20">
              {groups.map((g) => (
                <div key={g.key || "all"} className={g.label ? "grid gap-5 lg:grid-cols-[17rem_1fr] lg:gap-12" : ""}>
                  {g.label && (
                    <div data-row className="lg:sticky lg:top-28 lg:self-start">
                      <h3 className="font-heading text-[clamp(1.75rem,2.6vw,2.5rem)] font-semibold leading-[1.05] tracking-[-0.03em] text-accent-ink">
                        {g.label}
                      </h3>
                      {sortedCategories.find((c) => c.id === g.key)?.popular && <PopularTag className="mt-3" />}
                      <p className="mt-2 text-base text-muted">
                        {g.items.length} {g.items.length === 1 ? "chemical" : "chemicals"}
                      </p>
                    </div>
                  )}
                  <ul className="grid gap-1">
                    {g.items.map((e) => (
                      <li key={e.product.id} data-row>
                        <ChemRow entry={e} onOpen={() => setOpenProduct(e.product)} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {openProduct && (
        <div
          ref={drawerRef}
          data-surface="inverse"
          data-lenis-prevent
          role="dialog"
          aria-modal="true"
          aria-label={openProduct.name}
          className="fixed inset-0 z-1100 overflow-y-auto bg-background text-foreground"
        >
          <div className="fixed right-6 top-4 z-20 flex items-center gap-3 sm:right-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))]">
            <Button variant="outline" size="md" onClick={share} aria-label={`Share ${openProduct.name}`}>
              <span aria-live="polite" className="inline-flex items-center gap-2">
                {shared ? <Check aria-hidden className="h-[1.1em] w-[1.1em]" strokeWidth={2.25} /> : <Link2 aria-hidden className="h-[1.1em] w-[1.1em]" strokeWidth={2.25} />}
                {shared ? "Link copied" : "Share"}
              </span>
            </Button>
            <Button variant="light" size="md" onClick={closeDrawer}>
              Close
            </Button>
          </div>

          <div className="mx-auto max-w-7xl px-6 pb-40 pt-28 sm:px-10 lg:pt-32">
            {/* Name, with the product photo opposite it */}
            <div className={imageSrc ? "grid items-start gap-10 md:grid-cols-12 md:gap-x-8" : ""}>
              <div className={imageSrc ? "min-w-0 md:col-span-8" : ""}>
                {openEntry && (
                  <p data-d className="text-lg text-accent">
                    {openEntry.categoryName}
                  </p>
                )}
                <h3
                  data-d
                  className={`mt-3 wrap-break-word font-heading font-semibold leading-[0.95] tracking-[-0.055em] ${
                    imageSrc
                      ? "text-[clamp(2.5rem,5.6vw,6.75rem)]"
                      : "text-[clamp(2.75rem,8.2vw,8.5rem)]"
                  }`}
                >
                  {openProduct.name}
                </h3>
                {openProduct.spec.chemicalName && openProduct.spec.chemicalName !== openProduct.name && (
                  <p data-d className="mt-5 text-xl text-muted lg:text-2xl">
                    {openProduct.spec.chemicalName}
                  </p>
                )}
              </div>

              {imageSrc && (
                <div className="max-w-sm md:col-span-4 md:max-w-none">
                  <ProductImage key={openProduct.id} src={imageSrc} alt={openProduct.name} onFail={() => setBrokenImage(openProduct.id)} />
                </div>
              )}
            </div>

            {/* Key facts */}
            {highlights.length > 0 && (
              <dl className="mt-14 grid grid-cols-2 gap-x-8 gap-y-8 lg:mt-20 lg:grid-cols-12">
                {highlights.map(({ key, label }) => (
                  <div key={key} data-d className={`lg:col-span-4 ${highlights.length === 3 && key === highlights[2].key ? "col-span-2" : ""}`}>
                    <dt className="text-base text-muted">{label}</dt>
                    <dd className="mt-2 wrap-break-word font-heading text-[clamp(1.5rem,3vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
                      {openProduct.spec[key]}
                    </dd>
                  </div>
                ))}
              </dl>
            )}

            {/* Description beside the rest of the specification */}
            <div className="mt-14 grid gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-x-8">
              <p data-d className="text-lg leading-[1.65] text-foreground/80 lg:col-span-4">
                {openProduct.description}
              </p>

              <div className="lg:col-span-8">
                {(
                  <>
                    {restSpecs.length > 0 && (
                      <dl className="grid items-start gap-x-8 gap-y-9 sm:grid-cols-2">
                        {restSpecs.map(({ key, label }) => (
                          <div
                            key={key}
                            data-d
                            className={key === "endUse" || key === "synonyms" || key === "packaging" ? "sm:col-span-2" : undefined}
                          >
                            <dt className="text-base leading-6 text-muted">{label}</dt>
                            <dd className="mt-3 wrap-break-word font-heading text-[clamp(1.25rem,1.9vw,1.75rem)] font-semibold leading-[1.2] tracking-[-0.03em]">
                              {openProduct.spec[key]}
                            </dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Previous / next */}
            {(prevEntry || nextEntry) && (
              <nav aria-label="More chemicals" data-d className="mt-20 grid gap-3 sm:grid-cols-2 lg:mt-28">
                {prevEntry ? (
                  <button
                    type="button"
                    onClick={() => setOpenProduct(prevEntry.product)}
                    className="group/n flex cursor-pointer items-center gap-4 rounded-3xl bg-foreground/6 p-6 text-left outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky"
                  >
                    <ArrowLeft aria-hidden className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover/n:-translate-x-1" />
                    <span className="min-w-0">
                      <span className="block text-sm text-muted">Previous</span>
                      <span className="mt-1 block truncate font-heading text-xl font-semibold tracking-[-0.03em]">{prevEntry.product.name}</span>
                    </span>
                  </button>
                ) : (
                  <span />
                )}
                {nextEntry && (
                  <button
                    type="button"
                    onClick={() => setOpenProduct(nextEntry.product)}
                    className="group/n flex cursor-pointer items-center justify-between gap-4 rounded-3xl bg-foreground/6 p-6 text-right outline-none transition-colors hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-sky sm:col-start-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm text-muted">Next</span>
                      <span className="mt-1 block truncate font-heading text-xl font-semibold tracking-[-0.03em]">{nextEntry.product.name}</span>
                    </span>
                    <ArrowRight aria-hidden className="h-6 w-6 shrink-0 transition-transform duration-300 group-hover/n:translate-x-1" />
                  </button>
                )}
              </nav>
            )}
          </div>

          {/* Quote bar: stays at the bottom while you read. */}
          {(
            <div className="fixed inset-x-0 bottom-0 z-10 bg-background pb-4 pt-4 shadow-[0_-24px_32px_-8px_var(--color-background)]">
              <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 sm:px-10">
                <Button variant="primary" size="lg" arrow="right" onClick={() => openInquiry("quote", { productId: openProduct.id })} className="w-full min-w-0 sm:ml-auto sm:w-auto sm:max-w-xl">
                  <span className="min-w-0 truncate">Quote for {openProduct.name}</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

/*
 * The product photo, at the top of the specification column. It sits on a white
 * tile and is contained (never cropped), since product shots are usually on white.
 * If the image fails to load, the whole tile is dropped, so there is never an
 * empty box with alt text.
 */
function ProductImage({ src, alt, onFail }: { src: string; alt: string; onFail: () => void }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div data-d className="flex aspect-4/3 items-center justify-center overflow-hidden rounded-3xl bg-white p-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={onFail}
        className={`max-h-full max-w-full object-contain transition-opacity duration-500 ${loaded ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

function ChemRow({ entry, onOpen }: { entry: Entry; onOpen: () => void }) {
  const { product } = entry;
  const arrow = "absolute h-5 w-5 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]";

  return (
    <button
      onClick={onOpen}
      className="group/p grid w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-6 gap-y-1 rounded-2xl px-4 py-4 text-left outline-none transition-colors duration-300 hover:bg-surface focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-accent sm:px-6 lg:grid-cols-[minmax(0,2.6fr)_minmax(0,1.4fr)_minmax(0,1.6fr)_auto] lg:gap-y-0"
    >
      <span className="min-w-0 font-heading text-[clamp(1.25rem,1.9vw,1.625rem)] font-semibold leading-snug tracking-[-0.03em]">
        {product.name}
      </span>
      <span className="order-3 min-w-0 truncate text-base tabular-nums text-muted lg:hidden">
        {[product.spec.cas ? `CAS ${product.spec.cas}` : "", product.spec.purity ? `Purity ${product.spec.purity}` : ""]
          .filter(Boolean)
          .join(" · ")}
      </span>
      <span className="hidden min-w-0 truncate text-base tabular-nums text-muted lg:block">
        {product.spec.cas ? `CAS ${product.spec.cas}` : ""}
      </span>
      <span className="hidden min-w-0 truncate text-base text-muted lg:block">
        {product.spec.purity ? `Purity ${product.spec.purity}` : ""}
      </span>

      <span
        aria-hidden
        className="relative order-2 row-span-2 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-cta text-white lg:order-0 lg:row-span-1"
      >
        <ArrowUpRight strokeWidth={2} className={`${arrow} group-hover/p:translate-x-8 group-hover/p:-translate-y-8 group-focus-visible/p:translate-x-8 group-focus-visible/p:-translate-y-8`} />
        <ArrowUpRight strokeWidth={2} className={`${arrow} -translate-x-8 translate-y-8 group-hover/p:translate-x-0 group-hover/p:translate-y-0 group-focus-visible/p:translate-x-0 group-focus-visible/p:translate-y-0`} />
      </span>
    </button>
  );
}
