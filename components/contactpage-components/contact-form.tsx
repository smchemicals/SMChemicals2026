"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, Check, Pencil, RefreshCw, Search } from "lucide-react";
import Link from "next/link";
import { gsap } from "@/lib/gsap";
import { rules } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { TURNSTILE_KEY, TurnstileBox } from "@/components/turnstile-box";
import { FieldMessage, stepFieldState } from "@/components/ui/form-field";
import { cn } from "@/lib/utils";

/* The part of the catalogue the form needs: industries, and the chemicals under each. */
export type InquiryCatalog = { id: string; name: string; products: { id: string; name: string }[] }[];

/* Opened from a chemical's page: that chemical is already chosen, so the form skips straight past choosing one. */
export type InquiryPreset = { productId: string } | null;

const UNITS = ["Kg", "Litre", "Tonne", "Bag", "Drum", "Other"];

type TextName = "fullName" | "company" | "email" | "phone" | "notes";
type StepId = TextName | "industries" | "chemicals" | "quantities" | "review";

type TextStep = {
    id: TextName;
    kind: "text" | "long";
    question: string;
    hint?: string;
    placeholder: string;
    type?: string;
    autoComplete?: string;
    inputMode?: "email" | "tel" | "text";
    optional?: boolean;
    rule: (v: string) => string | null;
};

const textSteps: Record<TextName, TextStep> = {
    fullName: { id: "fullName", kind: "text", question: "What is your full name?", placeholder: "Full name", autoComplete: "name", rule: rules.name },
    company: { id: "company", kind: "text", question: "Which company do you represent?", placeholder: "Company name", autoComplete: "organization", rule: rules.company({ required: true }) },
    email: { id: "email", kind: "text", question: "What is your work email address?", placeholder: "name@company.com", type: "email", autoComplete: "email", inputMode: "email", rule: rules.email },
    phone: { id: "phone", kind: "text", question: "What is the best number to reach you on?", placeholder: "+91 00000 00000", type: "tel", autoComplete: "tel", inputMode: "tel", rule: rules.phone({ required: true }) },
    notes: { id: "notes", kind: "long", question: "Anything else we should know?", hint: "Optional. Delivery location, grade, timelines or anything that helps us quote well.", placeholder: "Your notes", optional: true, rule: rules.message({}) },
};

type Qty = { qty: string; unit: string };

/*
 * One question at a time, built around what the person actually wants: which chemicals. They say who they are, pick
 * the industries they need chemicals for, then pick chemicals from those industries (one, several or all), say how much
 * of each, and see everything once more before it is sent. Enter moves on (Shift+Enter for a new line in the notes).
 */
export function ContactForm({
    label = "General Inquiry",
    catalog,
    preset = null,
}: {
    label?: string;
    catalog: InquiryCatalog;
    preset?: InquiryPreset;
}) {
    const presetProduct = useMemo(() => {
        if (!preset) return null;
        for (const c of catalog) {
            const p = c.products.find((x) => x.id === preset.productId);
            if (p) return { cat: c, product: p };
        }
        return null;
    }, [preset, catalog]);

    const [text, setText] = useState<Record<TextName, string>>({ fullName: "", company: "", email: "", phone: "", notes: "" });
    const [industries, setIndustries] = useState<string[]>(presetProduct ? [presetProduct.cat.id] : []);
    const [chemicals, setChemicals] = useState<string[]>(presetProduct ? [presetProduct.product.id] : []);
    const [qtys, setQtys] = useState<Record<string, Qty>>({});
    // With a chemical already chosen the choosing steps are left out, until the person asks to add more.
    const [skipChoosing, setSkipChoosing] = useState(Boolean(presetProduct));
    const [find, setFind] = useState("");
    const [token, setToken] = useState("");

    const order = useMemo<StepId[]>(
        () => [
            "fullName",
            "company",
            "email",
            "phone",
            ...(skipChoosing ? [] : (["industries", "chemicals"] as StepId[])),
            "quantities",
            "notes",
            "review",
        ],
        [skipChoosing],
    );
    const [i, setI] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);
    // Once an answer has been left (or sent) with a problem, it is checked as it is edited, so the message clears the moment it is fixed.
    const [live, setLive] = useState(false);
    const stage = useRef<HTMLDivElement>(null);
    const dir = useRef(1);
    const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);

    const stepId = order[Math.min(i, order.length - 1)];
    const isReview = stepId === "review";
    const progress = done ? 1 : i / (order.length - 1);

    const byId = useMemo(() => {
        const m = new Map<string, { name: string; cat: string }>();
        catalog.forEach((c) => c.products.forEach((p) => m.set(p.id, { name: p.name, cat: c.name })));
        return m;
    }, [catalog]);
    const chosenCats = catalog.filter((c) => industries.includes(c.id));

    // Animate each question in, then put the cursor in the field.
    useGSAP(
        () => {
            const mm = gsap.matchMedia();
            mm.add("(prefers-reduced-motion: no-preference)", () => {
                gsap.fromTo("[data-q]", { autoAlpha: 0, x: 48 * dir.current }, { autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.07, ease: "expoOut" });
            });
        },
        { scope: stage, dependencies: [stepId, done] },
    );
    useEffect(() => {
        setLive(false);
        setError(null);
        setFind("");
        if (stepId in textSteps || stepId === "chemicals") {
            const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
            return () => clearTimeout(t);
        }
    }, [stepId]);

    // ---- checking an answer ----
    const textRule = (id: TextName, v: string) => (textSteps[id].optional && !v.trim() ? null : textSteps[id].rule(v));
    const check = (id: StepId): string | null => {
        if (id in textSteps) return textRule(id as TextName, text[id as TextName]);
        if (id === "industries") return industries.length ? null : "Pick at least one industry.";
        if (id === "chemicals") return chemicals.length ? null : "Pick at least one chemical.";
        if (id === "quantities") {
            for (const c of chemicals) {
                const q = qtys[c]?.qty ?? "";
                const msg = q.trim() ? rules.quantity(q) : null;
                if (msg) return `${byId.get(c)?.name ?? "A chemical"}: ${msg.toLowerCase()}`;
            }
        }
        return null;
    };

    const setField = (v: string) => {
        const id = stepId as TextName;
        setText((a) => ({ ...a, [id]: v }));
        setSubmitError(null);
        if (live || error) setError(textRule(id, v));
    };
    const onBlur = () => {
        const id = stepId as TextName;
        if (!(id in textSteps) || !text[id].trim()) return;
        setLive(true);
        setError(textRule(id, text[id]));
    };

    // ---- choosing ----
    const toggleIndustry = (id: string) => {
        setError(null);
        setIndustries((cur) => {
            const next = cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id];
            // Dropping an industry drops the chemicals chosen under it.
            const keep = new Set(catalog.filter((c) => next.includes(c.id)).flatMap((c) => c.products.map((p) => p.id)));
            setChemicals((ch) => ch.filter((x) => keep.has(x)));
            return next;
        });
    };
    const toggleChemical = (id: string) => {
        setError(null);
        setChemicals((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
    };
    const setGroup = (ids: string[], on: boolean) => {
        setError(null);
        setChemicals((cur) => (on ? Array.from(new Set([...cur, ...ids])) : cur.filter((x) => !ids.includes(x))));
    };
    const setQty = (id: string, patch: Partial<Qty>) => {
        setError(null);
        setQtys((cur) => ({ ...cur, [id]: { qty: cur[id]?.qty ?? "", unit: cur[id]?.unit ?? "Kg", ...patch } }));
    };

    // ---- moving about ----
    const go = (n: number, d: number) => {
        dir.current = d;
        setI(n);
    };
    const next = () => {
        const msg = check(stepId);
        if (msg) {
            setLive(true);
            setError(msg);
            inputRef.current?.focus();
            return;
        }
        setError(null);
        go(i + 1, 1);
    };
    const back = () => {
        if (i > 0) go(i - 1, -1);
    };
    const edit = (id: StepId) => {
        // "Add more chemicals" from the review brings the choosing steps back.
        if ((id === "industries" || id === "chemicals") && skipChoosing) {
            setSkipChoosing(false);
            const n = ["fullName", "company", "email", "phone", "industries", "chemicals", "quantities", "notes", "review"].indexOf(id);
            go(n, -1);
            return;
        }
        go(order.indexOf(id), -1);
    };

    const onKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !(textSteps[stepId as TextName]?.kind === "long" && e.shiftKey)) {
            e.preventDefault();
            next();
        }
    };

    // ---- sending ----
    const describe = (id: string) => {
        const name = byId.get(id)?.name ?? id;
        const q = qtys[id];
        return q?.qty.trim() ? `${name} (${q.qty.trim()} ${q.unit})` : name;
    };
    const submit = async () => {
        if (TURNSTILE_KEY && !token) {
            setSubmitError("Please complete the check below first.");
            return;
        }
        setLoading(true);
        setSubmitError(null);
        const payload = {
            name: text.fullName.trim(),
            email: text.email.trim(),
            token,
            website: "",
            message: text.notes.trim() || `Quote request for ${chemicals.length} ${chemicals.length === 1 ? "chemical" : "chemicals"}.`,
            label,
            fields: {
                Company: text.company.trim(),
                Phone: text.phone.trim(),
                Industries: chosenCats.map((c) => c.name).join(", "),
                Chemicals: chemicals.map(describe).join("; "),
                "Sent from": window.location.pathname,
            },
        };
        try {
            const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) throw new Error(data.error || "Something went wrong. Please try again.");
            setDone(true);
        } catch (err) {
            setSubmitError(err instanceof Error ? err.message : "Could not send. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div ref={stage} className="mx-auto max-w-3xl">
                <span data-q className="flex h-16 w-16 items-center justify-center rounded-full bg-cta text-cta-foreground">
                    <Check aria-hidden className="h-8 w-8" strokeWidth={2.5} />
                </span>
                <h3 data-q className="mt-10 font-heading text-[clamp(1.875rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
                    Thank you. Your inquiry has been received.
                </h3>
                <p data-q className="mt-6 max-w-lg text-xl leading-[1.55] text-muted">
                    A member of our team will respond within two working days.
                </p>
            </div>
        );
    }

    const text_ = textSteps[stepId as TextName] as TextStep | undefined;
    const value = text_ ? text[text_.id] : "";
    const problem = error ?? submitError;
    const valid = !!text_ && !!value.trim() && !textRule(text_.id, value);
    const state: "error" | "ok" | null = problem ? "error" : valid ? "ok" : null;
    const fieldId = `inquiry-${stepId}`;
    const questionId = `${fieldId}-q`;
    const inputClass =
        "w-full border-0 border-b-2 border-foreground/25 bg-transparent pb-3 pt-2 font-heading text-[clamp(1.25rem,2.4vw,1.875rem)] font-medium tracking-[-0.02em] text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-accent";

    const titles: Record<string, string> = {
        industries: "Which industries do you need chemicals for?",
        chemicals: "Which chemicals do you need?",
        quantities: chemicals.length === 1 ? `How much ${byId.get(chemicals[0])?.name ?? "of it"} do you need?` : "How much of each do you need?",
        review: "Check your details, then send.",
    };
    const hints: Record<string, string> = {
        industries: "Pick one, several or all of them.",
        chemicals: "Choose from the industries you picked: one, several or all.",
        quantities: "Optional. An estimate is fine, and you can leave any blank.",
        review: "You can change anything before it goes.",
    };

    const toggleRow = (on: boolean, label_: string, onClick: () => void, key?: string) => (
        <button
            key={key ?? label_}
            type="button"
            role="checkbox"
            aria-checked={on}
            onClick={onClick}
            className={cn(
                "flex min-h-14 w-full cursor-pointer items-center gap-4 rounded-md px-4 py-3 text-left text-lg font-medium outline-none ring-1 transition-colors focus-visible:ring-2 focus-visible:ring-accent",
                on ? "bg-accent text-white ring-accent" : "bg-foreground/5 ring-foreground/20 hover:bg-foreground/10 hover:ring-accent",
            )}
        >
            <span aria-hidden className={cn("flex h-6 w-6 shrink-0 items-center justify-center rounded ring-1", on ? "bg-white/20 ring-white/60" : "ring-foreground/30")}>
                {on && <Check className="h-4 w-4" strokeWidth={3} />}
            </span>
            <span className="min-w-0">{label_}</span>
        </button>
    );

    const q = find.trim().toLowerCase();

    return (
        <div ref={stage} className="mx-auto max-w-3xl">
            <div
                role="progressbar"
                aria-label="Form progress"
                aria-valuemin={0}
                aria-valuemax={order.length - 1}
                aria-valuenow={i}
                className="mb-14 h-1 w-full overflow-hidden rounded-full bg-foreground/15 md:mb-20"
            >
                <div
                    className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{ width: `${Math.max(progress, 0.04) * 100}%` }}
                />
            </div>

            <div key={stepId} className="min-h-88">
                <h3
                    id={questionId}
                    data-q
                    className="font-heading text-[clamp(1.75rem,3.8vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em]"
                    aria-live="polite"
                >
                    {text_ ? text_.question : titles[stepId]}
                </h3>
                {(text_?.hint || hints[stepId]) && (
                    <p data-q className="mt-4 text-lg text-muted">
                        {text_?.hint ?? hints[stepId]}
                    </p>
                )}

                <div data-q className="relative z-20 mt-10 md:mt-12">
                    {text_ ? (
                        text_.kind === "long" ? (
                            <textarea
                                ref={inputRef}
                                id={fieldId}
                                aria-labelledby={questionId}
                                aria-invalid={error ? true : undefined}
                                value={value}
                                onChange={(e) => setField(e.target.value)}
                                onKeyDown={onKeyDown}
                                onBlur={onBlur}
                                rows={3}
                                placeholder={text_.placeholder}
                                className={cn(inputClass, stepFieldState(state), "resize-none")}
                            />
                        ) : (
                            <input
                                ref={inputRef}
                                id={fieldId}
                                aria-labelledby={questionId}
                                aria-invalid={error ? true : undefined}
                                type={text_.type ?? "text"}
                                inputMode={text_.inputMode}
                                autoComplete={text_.autoComplete}
                                value={value}
                                onChange={(e) => setField(e.target.value)}
                                onKeyDown={onKeyDown}
                                onBlur={onBlur}
                                placeholder={text_.placeholder}
                                className={cn(inputClass, stepFieldState(state))}
                            />
                        )
                    ) : stepId === "industries" ? (
                        <>
                            <div className="mb-4 flex items-center justify-between gap-4 text-base">
                                <span className="text-muted">{industries.length ? `${industries.length} selected` : "None selected"}</span>
                                <span className="flex items-center gap-5">
                                    <button type="button" onClick={() => { setIndustries(catalog.map((c) => c.id)); setError(null); }} className="cursor-pointer font-medium text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
                                        Select all
                                    </button>
                                    <button type="button" onClick={() => { setIndustries([]); setChemicals([]); }} className="cursor-pointer font-medium text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
                                        Clear
                                    </button>
                                </span>
                            </div>
                            <div role="group" aria-labelledby={questionId} className="grid gap-3 sm:grid-cols-2">
                                {catalog.map((c) => toggleRow(industries.includes(c.id), c.name, () => toggleIndustry(c.id), c.id))}
                            </div>
                        </>
                    ) : stepId === "chemicals" ? (
                        <>
                            <div className="relative mb-6">
                                <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
                                <input
                                    ref={inputRef}
                                    type="search"
                                    value={find}
                                    onChange={(e) => setFind(e.target.value)}
                                    placeholder="Search these chemicals"
                                    aria-label="Search these chemicals"
                                    className="h-14 w-full rounded-lg bg-surface pl-12 pr-4 text-base text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent [&::-webkit-search-cancel-button]:hidden"
                                />
                            </div>
                            <div className="grid gap-10">
                                {chosenCats.map((c) => {
                                    const items = c.products.filter((p) => !q || p.name.toLowerCase().includes(q));
                                    if (!items.length) return null;
                                    const ids = c.products.map((p) => p.id);
                                    const all = ids.every((x) => chemicals.includes(x));
                                    return (
                                        <div key={c.id} role="group" aria-label={c.name}>
                                            <div className="mb-4 flex items-baseline justify-between gap-4">
                                                <h4 className="font-heading text-xl font-semibold tracking-[-0.02em] text-accent">{c.name}</h4>
                                                <button type="button" onClick={() => setGroup(ids, !all)} className="shrink-0 cursor-pointer text-base font-medium text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
                                                    {all ? "Clear all" : "Select all"}
                                                </button>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-2">{items.map((p) => toggleRow(chemicals.includes(p.id), p.name, () => toggleChemical(p.id), p.id))}</div>
                                        </div>
                                    );
                                })}
                                {q && chosenCats.every((c) => !c.products.some((p) => p.name.toLowerCase().includes(q))) && (
                                    <p className="text-lg text-muted">No chemical in these industries matches that.</p>
                                )}
                            </div>
                        </>
                    ) : stepId === "quantities" ? (
                        <ul className="grid gap-4">
                            {chemicals.map((id) => (
                                <li key={id} className="grid items-center gap-3 sm:grid-cols-[1fr_9rem_9rem] sm:gap-4">
                                    <span className="min-w-0 font-heading text-lg font-semibold tracking-[-0.02em]">{byId.get(id)?.name}</span>
                                    <input
                                        type="text"
                                        inputMode="decimal"
                                        value={qtys[id]?.qty ?? ""}
                                        onChange={(e) => setQty(id, { qty: e.target.value })}
                                        placeholder="Quantity"
                                        aria-label={`Quantity of ${byId.get(id)?.name}`}
                                        className="h-12 w-full rounded-lg bg-surface px-4 text-base text-foreground outline-none ring-2 ring-transparent transition-shadow placeholder:text-muted/70 hover:ring-foreground/15 focus:ring-accent"
                                    />
                                    <Select
                                        size="md"
                                        label={`Unit for ${byId.get(id)?.name}`}
                                        value={qtys[id]?.unit ?? "Kg"}
                                        onChange={(u) => setQty(id, { unit: u })}
                                        options={UNITS.map((u) => ({ value: u, label: u }))}
                                    />
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <dl className="grid gap-9">
                            {(
                                [
                                    ["Your details", "fullName", [text.fullName, text.company, text.email, text.phone]],
                                    ["Industries", "industries", chosenCats.map((c) => c.name)],
                                    ["Chemicals", "chemicals", chemicals.map(describe)],
                                    ["Notes", "notes", text.notes.trim() ? [text.notes.trim()] : []],
                                ] as [string, StepId, string[]][]
                            ).map(([title, target, rows]) => (
                                <div key={title} className="grid gap-2 sm:grid-cols-[10rem_1fr_auto] sm:gap-x-8">
                                    <dt className="text-base text-muted">{title}</dt>
                                    <dd className="min-w-0">
                                        {rows.length ? (
                                            <ul className="grid gap-1.5 text-lg font-medium">
                                                {rows.map((r, n) => (
                                                    <li key={n} className="wrap-break-word">{r}</li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="text-lg text-muted">Nothing added</span>
                                        )}
                                    </dd>
                                    <dd>
                                        <button
                                            type="button"
                                            onClick={() => edit(target === "chemicals" && skipChoosing ? "chemicals" : target)}
                                            className="inline-flex h-10 cursor-pointer items-center gap-2 text-base font-medium text-foreground/80 outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                                        >
                                            <Pencil aria-hidden className="h-4 w-4" />
                                            {target === "chemicals" && skipChoosing ? "Add more" : "Edit"}
                                        </button>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    )}

                    <FieldMessage kind={state === "ok" ? "ok" : problem ? "error" : null}>
                        {problem ?? (state === "ok" ? "Looks good." : "")}
                    </FieldMessage>

                    {isReview && <TurnstileBox onToken={setToken} className="mt-6" />}

                    {(stepId === "fullName" || isReview) && (
                        <p className="mt-6 max-w-xl text-base leading-[1.55] text-muted">
                            {isReview ? "When you send this, it is emailed to our team." : "Your details go to our team by email."} We use them only to reply to
                            you, never for anything else.{" "}
                            <Link href="/privacy" className="font-medium text-foreground/85 underline underline-offset-4 outline-none hover:text-foreground focus-visible:text-foreground">
                                How we handle them
                            </Link>
                            .
                        </p>
                    )}
                </div>

                <div data-q className="sticky bottom-0 z-10 -mx-1 mt-6 flex flex-wrap items-center gap-4 bg-background px-1 py-4">
                    <Button
                        variant="primary"
                        size="lg"
                        arrow={loading ? undefined : "right"}
                        onClick={isReview ? () => void submit() : next}
                        disabled={loading}
                    >
                        {loading ? (
                            <RefreshCw aria-hidden className="h-5 w-5 animate-spin" />
                        ) : isReview ? (
                            "Send inquiry"
                        ) : (stepId === "notes" && !text.notes.trim()) || (stepId === "quantities" && !chemicals.some((c) => qtys[c]?.qty.trim())) ? (
                            "Skip"
                        ) : (
                            "Continue"
                        )}
                    </Button>
                    {text_ && (
                        <span className="hidden text-sm text-muted sm:inline">
                            Press <kbd className="rounded bg-foreground/10 px-1.5 py-0.5 font-sans text-xs font-semibold">Enter</kbd> to continue
                            {text_.kind === "long" && <span className="ml-2">Shift + Enter for a new line.</span>}
                        </span>
                    )}
                    {stepId === "chemicals" && chemicals.length > 0 && <span className="text-base text-muted">{chemicals.length} selected</span>}
                </div>
            </div>

            {i > 0 && (
                <button
                    type="button"
                    onClick={back}
                    className="mt-8 inline-flex h-11 cursor-pointer items-center gap-2 text-base font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:text-foreground"
                >
                    <ArrowLeft aria-hidden className="h-4 w-4" />
                    Back
                </button>
            )}
        </div>
    );
}
