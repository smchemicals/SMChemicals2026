"use client";

import React, { useState, useRef, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { X, Upload, Send, CheckCircle2, RefreshCw } from "lucide-react";
import { CtaSubmit } from "@/components/ui/cta-button";

const inputCls =
	"w-full bg-transparent border-b border-line py-3 text-foreground placeholder:text-muted/70 focus:outline-none focus:border-accent transition-colors font-light";
const labelCls =
	"text-[11px] font-black text-muted uppercase tracking-[0.3em] block mb-1";

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

	const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
		setError(null);
		const f = e.target.files?.[0];
		if (!f) {
			setFileName(null);
			return;
		}
		if (f.type !== "application/pdf") {
			setError("Resume must be a PDF.");
			setFileName(null);
			e.target.value = "";
			return;
		}
		if (f.size > 5 * 1024 * 1024) {
			setError("Resume must be under 5 MB.");
			setFileName(null);
			e.target.value = "";
			return;
		}
		setFileName(f.name);
	};

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const file = fileRef.current?.files?.[0];
		if (!file) {
			setError("Please attach your resume (PDF).");
			return;
		}
		const fd = new FormData(e.currentTarget);
		setIsLoading(true);
		try {
			const content = await toBase64(file);
			const payload = {
				name: String(fd.get("name") || ""),
				email: String(fd.get("email") || ""),
				message:
					String(fd.get("message") || "").trim() ||
					`Application for ${roleTitle ?? "a general role"}.`,
				label: roleTitle
					? `Career Application — ${roleTitle}`
					: "Career Application — General",
				fields: {
					Phone: String(fd.get("phone") || ""),
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
			setDone(true);
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "Could not send. Please try again.",
			);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="fixed inset-0 z-[1100] flex items-center justify-center p-4">
			<div
				ref={backdropRef}
				onClick={close}
				className="absolute inset-0 bg-deep/80 backdrop-blur-sm"
			/>
			<div
				ref={panelRef}
				data-lenis-prevent
				className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto overscroll-contain bg-surface border border-line shadow-2xl"
			>
				<div className="flex items-start justify-between gap-6 p-8 border-b border-line">
					<div>
						<span className="text-[11px] font-black uppercase tracking-[0.3em] text-accent block mb-2">
							Apply
						</span>
						<h3 className="text-2xl font-bold tracking-tight text-foreground leading-tight">
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
						<CheckCircle2 className="h-14 w-14 text-accent mx-auto mb-5" />
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
					<form onSubmit={handleSubmit} className="p-8 space-y-7">
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-7">
							<div>
								<label className={labelCls}>Full Name</label>
								<input name="name" required placeholder="Your name" className={inputCls} />
							</div>
							<div>
								<label className={labelCls}>Email</label>
								<input name="email" type="email" required placeholder="you@email.com" className={inputCls} />
							</div>
							<div>
								<label className={labelCls}>Phone</label>
								<input name="phone" type="tel" placeholder="+91 00000 00000" className={inputCls} />
							</div>
							<div>
								<label className={labelCls}>Resume (PDF)</label>
								<input
									ref={fileRef}
									type="file"
									accept="application/pdf"
									onChange={onFile}
									className="hidden"
									id="resume-input"
								/>
								<label
									htmlFor="resume-input"
									className="flex items-center gap-2 py-3 border-b border-line text-muted cursor-pointer hover:border-accent transition-colors"
								>
									<Upload size={15} className="shrink-0 text-muted" />
									<span className="truncate text-base font-light">
										{fileName ?? "Choose PDF…"}
									</span>
								</label>
							</div>
						</div>

						<div>
							<label className={labelCls}>Cover Note</label>
							<textarea
								name="message"
								rows={3}
								placeholder="Tell us why you'd be a great fit…"
								className={`${inputCls} resize-none`}
							/>
						</div>

						{error && <p className="text-base text-red-400 font-medium">{error}</p>}

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
