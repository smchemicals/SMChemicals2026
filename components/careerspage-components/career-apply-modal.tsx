"use client";

import React, { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ArrowLeft, Check, RefreshCw, Upload } from "lucide-react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { rules, resumeError } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { FieldMessage, stepFieldState } from "@/components/ui/form-field";
import { TURNSTILE_KEY, TurnstileBox } from "@/components/turnstile-box";
import { cn } from "@/lib/utils";

type Field = "name" | "email" | "phone" | "message";
type Step =
	| { id: "intro" }
	| { id: Field; kind: "text" | "long"; question: string; hint?: string; placeholder: string; type?: string; autoComplete?: string; inputMode?: "email" | "tel" | "text"; optional?: boolean; rule: (v: string) => string | null }
	| { id: "resume" };

const steps: Step[] = [
	{ id: "intro" },
	{ id: "name", kind: "text", question: "What is your full name?", placeholder: "Full name", autoComplete: "name", rule: rules.name },
	{ id: "email", kind: "text", question: "What is your email address?", placeholder: "name@email.com", type: "email", autoComplete: "email", inputMode: "email", rule: rules.email },
	{ id: "phone", kind: "text", question: "What is the best number to reach you on?", hint: "Optional. You may leave this blank.", placeholder: "+91 00000 00000", type: "tel", autoComplete: "tel", inputMode: "tel", optional: true, rule: rules.phone({ required: false }) },
	{ id: "resume" },
	{ id: "message", kind: "long", question: "Would you like to add a cover note?", hint: "Optional. A few lines on why you would be a good fit.", placeholder: "Your cover note", optional: true, rule: rules.message({}) },
];

function toBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

/*
 * The application, one question at a time on full-screen navy, the same flow
 * as the contact page. Enter continues; Escape closes.
 */
export function CareerApplyModal({
	roleTitle,
	roleDescription,
	onClose,
}: {
	roleTitle: string | null;
	roleDescription: string | null;
	onClose: () => void;
}) {
	const [i, setI] = useState(0);
	const [values, setValues] = useState<Record<Field, string>>({ name: "", email: "", phone: "", message: "" });
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	// Once an answer has been left (or sent) with a problem, it is checked as it is edited, so the message clears the moment it is fixed.
	const [live, setLive] = useState(false);
	const [token, setToken] = useState("");
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const overlay = useRef<HTMLDivElement>(null);
	const stage = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement & HTMLTextAreaElement>(null);
	const fileRef = useRef<HTMLInputElement>(null);
	const dir = useRef(1);

	const step = steps[i];
	const last = i === steps.length - 1;
	const progress = done ? 1 : i / steps.length;

	useGSAP(() => {
		getLenis()?.stop();
		gsap.fromTo(overlay.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "power2.out" });
		return () => getLenis()?.start();
	}, []);

	const close = () => {
		getLenis()?.start();
		gsap.to(overlay.current, { autoAlpha: 0, duration: 0.25, ease: "power2.in", onComplete: onClose });
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useGSAP(
		() => {
			const mm = gsap.matchMedia();
			mm.add("(prefers-reduced-motion: no-preference)", () => {
				gsap.fromTo(
					"[data-q]",
					{ autoAlpha: 0, x: 48 * dir.current },
					{ autoAlpha: 1, x: 0, duration: 0.7, stagger: 0.07, ease: "expoOut" },
				);
			});
		},
		{ scope: stage, dependencies: [i, done] },
	);

	useEffect(() => {
		if (step.id !== "intro" && step.id !== "resume") {
			const t = setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
			return () => clearTimeout(t);
		}
	}, [i, step.id]);

	const submit = async (final: Record<Field, string>) => {
		if (!file) return;
		if (TURNSTILE_KEY && !token) {
			setError("Please complete the check first.");
			return;
		}
		setLoading(true);
		setError(null);
		try {
			const content = await toBase64(file);
			const payload = {
				name: final.name.trim(),
				email: final.email.trim(),
				message: final.message.trim() || `Application for ${roleTitle ?? "a general role"}.`,
				label: roleTitle ? `Career Application: ${roleTitle}` : "Career Application: General",
				fields: { Phone: final.phone.trim(), Role: roleTitle ?? "General application" },
				attachment: { filename: file.name, content },
				token,
				website: "",
			};
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.ok === false) throw new Error(data.error || "Something went wrong. Please try again.");
			setDone(true);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Could not send. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => setLive(false), [i]);

	const check = (v: string) => (step.id !== "intro" && step.id !== "resume" && step.optional && !v.trim() ? null : step.id !== "intro" && step.id !== "resume" ? step.rule(v) : null);
	const onField = (id: Field, v: string) => {
		setValues((cur) => ({ ...cur, [id]: v }));
		setError(live || error ? check(v) : null);
	};
	const onBlur = () => {
		if (step.id === "intro" || step.id === "resume") return;
		const v = values[step.id];
		if (!v.trim()) return;
		setLive(true);
		setError(check(v));
	};

	const next = () => {
		let msg: string | null = null;
		if (step.id === "resume") msg = resumeError(file) ?? (file ? null : "Please attach your resume as a PDF.");
		else if (step.id !== "intro") {
			const v = values[step.id];
			msg = step.optional && !v.trim() ? null : step.rule(v);
		}
		if (msg) {
			setLive(true);
			setError(msg);
			inputRef.current?.focus();
			return;
		}
		setError(null);
		if (last) {
			void submit(values);
			return;
		}
		dir.current = 1;
		setI((n) => n + 1);
	};

	const back = () => {
		if (i === 0) return;
		dir.current = -1;
		setError(null);
		setI((n) => n - 1);
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !(step.id === "message" && e.shiftKey)) {
			e.preventDefault();
			next();
		}
	};

	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		const f = e.target.files?.[0] ?? null;
		const problem = resumeError(f);
		if (problem) {
			setFile(null);
			setError(problem);
			e.target.value = "";
			return;
		}
		setFile(f);
		setError(null);
	};

	const current = step.id !== "intro" && step.id !== "resume" ? values[step.id] : "";
	const state: "error" | "ok" | null = error ? "error" : step.id !== "intro" && step.id !== "resume" && !!current.trim() && !check(current) ? "ok" : null;
	const title = roleTitle ?? "General application";
	const inputClass =
		"w-full border-0 border-b-2 border-foreground/25 bg-transparent pb-3 pt-2 font-heading text-[clamp(1.25rem,2.4vw,1.875rem)] font-medium tracking-[-0.02em] text-foreground outline-none transition-colors placeholder:text-foreground/30 focus:border-accent";
	return (
		<div
			ref={overlay}
			role="dialog"
			aria-modal="true"
			aria-label={`Apply: ${title}`}
			data-surface="inverse"
			data-lenis-prevent
			className="fixed inset-0 z-1100 overflow-y-auto bg-background text-foreground"
		>
			<Button
				variant="light"
				size="md"
				onClick={close}
				className="fixed right-6 top-4 z-10 sm:right-[max(2.5rem,calc((100vw-48rem)/2+2.5rem))]"
			>
				Close
			</Button>

			<div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center px-6 py-28 sm:px-10">
				<div ref={stage}>
					<div
						role="progressbar"
						aria-label="Application progress"
						aria-valuemin={0}
						aria-valuemax={steps.length}
						aria-valuenow={i}
						className="mb-14 h-1 w-full overflow-hidden rounded-full bg-foreground/15 md:mb-20"
					>
						<div
							className="h-full rounded-full bg-accent transition-[width] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
							style={{ width: `${Math.max(progress, 0.04) * 100}%` }}
						/>
					</div>

					{done ? (
						<div>
							<span data-q className="flex h-16 w-16 items-center justify-center rounded-full bg-cta text-cta-foreground">
								<Check aria-hidden className="h-8 w-8" strokeWidth={2.5} />
							</span>
							<h3 data-q className="mt-10 font-heading text-[clamp(1.875rem,4vw,3.25rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
								Thank you. Your application has been received.
							</h3>
							<p data-q className="mt-6 max-w-lg text-xl leading-[1.55] text-muted">
								Our team will review it and be in touch.
							</p>
							<Button data-q variant="outline" size="md" className="mt-10" onClick={close}>
								Close
							</Button>
						</div>
					) : (
						<div key={i} className="min-h-80">
							{step.id === "intro" ? (
								<>
									<h3 data-q className="font-heading text-[clamp(2rem,5vw,4rem)] font-semibold leading-[1.05] tracking-[-0.03em]">
										{title}
									</h3>
									<p data-q className="mt-6 max-w-xl text-xl leading-[1.55] text-muted">
										{roleDescription ??
											"Tell us a little about yourself and attach your resume. We will keep your details on file."}
									</p>
									<div data-q className="mt-10">
										<Button variant="primary" size="lg" arrow="right" onClick={next}>
											Begin application
										</Button>
									</div>
								</>
							) : step.id === "resume" ? (
								<>
									<h3 data-q className="font-heading text-[clamp(1.75rem,3.8vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em]">
										Please attach your resume.
									</h3>
									<p data-q className="mt-4 text-lg text-muted">PDF only, up to 5 MB.</p>
									<div data-q className="mt-10">
										<input ref={fileRef} type="file" accept="application/pdf,.pdf" onChange={onFile} className="sr-only" id="resume-input" />
										<button
											type="button"
											onClick={() => fileRef.current?.click()}
											className={cn(
												"flex w-full cursor-pointer items-center gap-4 rounded-md bg-foreground/5 px-6 py-6 text-left font-heading text-xl font-medium tracking-[-0.02em] outline-none ring-1 ring-foreground/20 transition-colors hover:bg-foreground/10 hover:ring-accent focus-visible:ring-2 focus-visible:ring-accent",
												file && "ring-accent",
											)}
										>
											{file ? <Check aria-hidden className="h-6 w-6 shrink-0 text-accent" /> : <Upload aria-hidden className="h-6 w-6 shrink-0 text-muted" />}
											<span className="truncate">{file ? file.name : "Choose a PDF"}</span>
										</button>
										<FieldMessage kind={error ? "error" : file ? "ok" : null}>{error ?? (file ? "Resume attached." : "")}</FieldMessage>
									</div>
									<div data-q className="mt-6">
										<Button variant="primary" size="lg" arrow="right" onClick={next}>
											Continue
										</Button>
									</div>
								</>
							) : (
								<>
									<h3 data-q className="font-heading text-[clamp(1.75rem,3.8vw,3rem)] font-semibold leading-[1.1] tracking-[-0.03em]" aria-live="polite">
										{step.question}
									</h3>
									{step.hint && (
										<p data-q className="mt-4 text-lg text-muted">{step.hint}</p>
									)}
									<div data-q className="mt-10 md:mt-12">
										{step.kind === "long" ? (
											<textarea
												ref={inputRef}
												value={values[step.id]}
												onChange={(e) => onField(step.id as Field, e.target.value)}
												onBlur={onBlur}
												onKeyDown={onKeyDown}
												rows={3}
												aria-label={step.question}
												placeholder={step.placeholder}
												className={cn(inputClass, stepFieldState(state), "resize-none")}
											/>
										) : (
											<input
												ref={inputRef}
												type={step.type ?? "text"}
												inputMode={step.inputMode}
												autoComplete={step.autoComplete}
												value={values[step.id]}
												onChange={(e) => onField(step.id as Field, e.target.value)}
												onBlur={onBlur}
												onKeyDown={onKeyDown}
												aria-label={step.question}
												placeholder={step.placeholder}
												className={cn(inputClass, stepFieldState(state))}
											/>
										)}
										<FieldMessage kind={state === "ok" ? "ok" : error ? "error" : null}>{error ?? (state === "ok" ? "Looks good." : "")}</FieldMessage>
										{last && <TurnstileBox onToken={setToken} className="mt-4" />}
									</div>
									<div data-q className="mt-6 flex flex-wrap items-center gap-4">
										<Button variant="primary" size="lg" arrow={loading ? undefined : "right"} onClick={next} disabled={loading}>
											{loading ? (
												<RefreshCw aria-hidden className="h-5 w-5 animate-spin" />
											) : last ? (
												"Submit application"
											) : step.optional && !values[step.id].trim() ? (
												"Skip"
											) : (
												"Continue"
											)}
										</Button>
										<span className="hidden text-sm text-muted sm:inline">
											Press <kbd className="rounded bg-foreground/10 px-1.5 py-0.5 font-sans text-xs font-semibold">Enter</kbd> to continue
										</span>
									</div>
								</>
							)}
						</div>
					)}

					{i > 0 && !done && (
						<button type="button" onClick={back} className="mt-12 inline-flex h-11 cursor-pointer items-center gap-2 text-base font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:text-foreground">
							<ArrowLeft aria-hidden className="h-4 w-4" />
							Back
						</button>
					)}
				</div>
			</div>
		</div>
	);
}
