"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { X, Upload, Send, CheckCircle2, RefreshCw, Check } from "lucide-react";
import { CtaSubmit } from "@/components/ui/cta-button";
import { FieldError, ValidTick, fieldState } from "@/components/ui/form-field";
import { useFormValidation } from "@/hooks/use-form-validation";
import { rules, resumeError } from "@/lib/validators";
import { cn } from "@/lib/utils";

const inputCls =
	"w-full bg-transparent border-b border-line py-3 text-foreground placeholder:text-muted/80 focus:outline-none focus:border-accent transition-colors font-light";
const labelCls =
	"type-label text-muted block mb-1";

const formRules = {
	name: rules.name,
	email: rules.email,
	phone: rules.phone({ required: false }),
	message: rules.message({}),
};
type FieldName = keyof typeof formRules;

function toBase64(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () =>
			resolve(String(reader.result).split(",")[1] ?? "");
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export function CareerApplyModal({
	roleTitle,
	onClose,
}: {
	roleTitle: string | null;
	onClose: () => void;
}) {
	const [isLoading, setIsLoading] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [fileName, setFileName] = useState<string | null>(null);
	const [resumeErr, setResumeErr] = useState<string | null>(null);
	const v = useFormValidation(formRules, { idPrefix: "apply" });

	const fileRef = useRef<HTMLInputElement>(null);
	const backdropRef = useRef<HTMLDivElement>(null);
	const panelRef = useRef<HTMLDivElement>(null);

	useGSAP(() => {
		getLenis()?.stop();
		gsap.fromTo(
			backdropRef.current,
			{ autoAlpha: 0 },
			{ autoAlpha: 1, duration: 0.3, ease: "power2.out" },
		);
		gsap.fromTo(
			panelRef.current,
			{ y: 28, autoAlpha: 0 },
			{ y: 0, autoAlpha: 1, duration: 0.45, ease: "expo" },
		);
	}, []);

	const close = () => {
		getLenis()?.start();
		gsap.to(panelRef.current, {
			y: 18,
			autoAlpha: 0,
			duration: 0.25,
			ease: "power2.in",
		});
		gsap.to(backdropRef.current, {
			autoAlpha: 0,
			duration: 0.25,
			ease: "power2.in",
			onComplete: onClose,
		});
	};

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	// Checked the moment a file is picked, before anything is uploaded.
	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		const f = e.target.files?.[0];
		const problem = resumeError(f);
		setResumeErr(problem);
		if (problem) {
			setFileName(null);
			e.target.value = "";
			return;
		}
		setFileName(f!.name);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const file = fileRef.current?.files?.[0];
		const fieldsOk = v.validateAll();
		const fileProblem = resumeError(file);
		setResumeErr(fileProblem);
		if (!fieldsOk) return;
		if (fileProblem || !file) {
			document.getElementById("resume-trigger")?.focus();
			return;
		}
		const fd = new FormData(e.currentTarget);
		setIsLoading(true);
		try {
			const content = await toBase64(file);
			const payload = {
				name: String(fd.get("name") || "").trim(),
				email: String(fd.get("email") || "").trim(),
				message:
					String(fd.get("message") || "").trim() ||
					`Application for ${roleTitle ?? "a general role"}.`,
				label: roleTitle
					? `Career Application — ${roleTitle}`
					: "Career Application — General",
				fields: {
					Phone: String(fd.get("phone") || "").trim(),
					Role: roleTitle ?? "General application",
				},
				attachment: { filename: file.name, content },
			};
			const res = await fetch("/api/contact", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json().catch(() => ({}));
			if (!res.ok || data.ok === false)
				throw new Error(data.error || "Something went wrong. Please try again.");
			v.reset();
			setDone(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not send. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	const text = (
		name: FieldName,
		label: string,
		props: React.InputHTMLAttributes<HTMLInputElement>,
	) => (
		<div>
			<label htmlFor={`apply-${name}`} className={labelCls}>
				{label}
			</label>
			<div className="relative">
				<input
					{...props}
					{...v.register(name)}
					className={cn(inputCls, "pr-6", fieldState(Boolean(v.error(name))))}
				/>
				<ValidTick show={v.isValid(name)} />
			</div>
			<FieldError id={v.errorId(name)} message={v.error(name)} />
		</div>
	);

	return (
		<div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
			<div
				ref={backdropRef}
				onClick={close}
				className="absolute inset-0 bg-deep/50 backdrop-blur-sm"
			/>
			<div
				ref={panelRef}
				data-lenis-prevent
				className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain bg-surface border border-line shadow-2xl"
			>
				<div className="flex items-start justify-between gap-6 p-8 border-b border-line">
					<div>
						<span className="type-label text-accent-ink block mb-2">
							Apply
						</span>
						<h3 className="font-heading text-2xl font-semibold tracking-tight text-foreground leading-tight">
							{roleTitle ?? "General Application"}
						</h3>
					</div>
					<button
						onClick={close}
						className="shrink-0 p-2 -mr-2 text-muted hover:text-foreground transition-colors cursor-pointer"
						aria-label="Close"
					>
						<X size={22} />
					</button>
				</div>

				{done ? (
					<div className="p-12 text-center">
						<CheckCircle2 className="h-14 w-14 text-accent-ink mx-auto mb-5" />
						<h4 className="text-2xl font-bold text-foreground tracking-tight">
							Application sent
						</h4>
						<p className="mt-3 text-muted text-base font-light">
							Thanks — we&apos;ll review it and be in touch.
						</p>
						<CtaSubmit variant="outline" onClick={close} className="mt-8">
							Close
						</CtaSubmit>
					</div>
				) : (
					<form onSubmit={handleSubmit} noValidate className="p-8 space-y-4">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-2">
							{text("name", "Full Name", { placeholder: "Your name", autoComplete: "name" })}
							{text("email", "Email", { type: "email", placeholder: "you@email.com", autoComplete: "email" })}
							{text("phone", "Phone (optional)", { type: "tel", placeholder: "+91 00000 00000", autoComplete: "tel" })}
							<div>
								<span className={labelCls}>Resume (PDF, max 5 MB)</span>
								<input
									ref={fileRef}
									type="file"
									accept="application/pdf,.pdf"
									onChange={onFile}
									className="sr-only"
									id="resume-input"
									aria-describedby="resume-error"
									aria-invalid={resumeErr ? true : undefined}
								/>
								<label
									id="resume-trigger"
									htmlFor="resume-input"
									tabIndex={0}
									onKeyDown={(e) => {
										if (e.key === "Enter" || e.key === " ") {
											e.preventDefault();
											fileRef.current?.click();
										}
									}}
									className={cn(
										"relative flex items-center gap-2 py-3 pr-6 border-b border-line text-muted cursor-pointer hover:border-accent transition-colors outline-none focus-visible:border-accent",
										fieldState(Boolean(resumeErr)),
									)}
								>
									<Upload size={15} className="shrink-0 text-muted" />
									<span className={cn("truncate text-base font-light", fileName && "text-foreground")}>
										{fileName ?? "Choose PDF…"}
									</span>
									{fileName && (
										<Check aria-hidden className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-ink" />
									)}
								</label>
								<FieldError id="resume-error" message={resumeErr} />
							</div>
						</div>

						<div>
							<label htmlFor="apply-message" className={labelCls}>Cover Note (optional)</label>
							<textarea
								{...v.register("message")}
								rows={3}
								placeholder="Tell us why you'd be a great fit…"
								className={cn(inputCls, fieldState(Boolean(v.error("message"))), "resize-none")}
							/>
							<FieldError id={v.errorId("message")} message={v.error("message")} />
						</div>

						{error && <p role="alert" className="text-base text-danger font-medium">{error}</p>}

						<CtaSubmit type="submit" disabled={isLoading} className="w-full">
							{isLoading ? (
								<RefreshCw className="h-4 w-4 animate-spin" />
							) : (
								<>
									Submit Application
									<Send className="h-4 w-4" />
								</>
							)}
						</CtaSubmit>
					</form>
				)}
			</div>
		</div>
	);
}
