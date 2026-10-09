"use client";

import React, { useState } from "react";
import { ArrowLeft, Send, RefreshCw, CheckCircle2 } from "lucide-react";
import type { Product } from "@/data/products";
import { CtaSubmit } from "@/components/ui/cta-button";

const inputCls =
	"w-full bg-transparent border-b border-line py-3 text-foreground placeholder:text-muted/70 focus:outline-none focus:border-accent transition-colors font-light text-base";
const labelCls =
	"text-[11px] font-black text-muted uppercase tracking-[0.3em] block mb-1.5";

const UNITS = ["Kg", "Litre", "Tonne", "Bag", "Drum", "Other"];

export function ProductQuoteForm({
	product,
	onBack,
}: {
	product: Product;
	onBack: () => void;
}) {
	const [loading, setLoading] = useState(false);
	const [done, setDone] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		const fd = new FormData(e.currentTarget);
		const quantity = String(fd.get("quantity") || "").trim();
		const unit = String(fd.get("unit") || "").trim();
		const message = String(fd.get("message") || "").trim();

		const fields: Record<string, string> = { Product: product.name };
		if (product.spec.grade) fields.Grade = product.spec.grade;
		if (quantity) fields.Quantity = unit ? `${quantity} ${unit}` : quantity;
		const company = String(fd.get("company") || "").trim();
		const phone = String(fd.get("phone") || "").trim();
		if (company) fields.Company = company;
		if (phone) fields.Phone = phone;

		const payload = {
			name: String(fd.get("name") || ""),
			email: String(fd.get("email") || ""),
			message: message || `Quote request for ${product.name}.`,
			label: "Quote Request",
			fields,
		};

		setLoading(true);
		try {
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
			setLoading(false);
		}
	};

	if (done) {
		return (
			<div className="py-16 text-center">
				<CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-accent" />
				<h4 className="text-2xl font-bold tracking-tight text-foreground">
					Quote request sent
				</h4>
				<p className="mx-auto mt-3 max-w-sm text-foreground/75 text-base font-light leading-relaxed">
					Thanks — our team will get back to you with pricing for{" "}
					<span className="font-medium text-foreground">{product.name}</span>{" "}
					shortly.
				</p>
				<button
					type="button"
					onClick={onBack}
					className="mt-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-foreground hover:text-accent transition-colors cursor-pointer"
				>
					<ArrowLeft className="h-4 w-4" /> Back to product
				</button>
			</div>
		);
	}

	return (
		<div>
			<button
				type="button"
				onClick={onBack}
				className="mb-8 inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.3em] text-muted hover:text-foreground transition-colors cursor-pointer"
			>
				<ArrowLeft className="h-4 w-4" /> Back to details
			</button>

			<span className="text-[11px] font-black uppercase tracking-[0.3em] text-accent block mb-2">
				Request a Quote
			</span>
			<p className="text-foreground/75 text-base font-light leading-relaxed mb-8">
				Tell us your requirement for{" "}
				<span className="font-medium text-foreground">{product.name}</span> and we
				will respond with pricing and availability.
			</p>

			<form onSubmit={handleSubmit} className="space-y-6">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6">
					<div>
						<label htmlFor="q-name" className={labelCls}>
							Full Name
						</label>
						<input
							id="q-name"
							name="name"
							required
							placeholder="Your name"
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="q-email" className={labelCls}>
							Email
						</label>
						<input
							id="q-email"
							name="email"
							type="email"
							required
							placeholder="you@company.com"
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="q-company" className={labelCls}>
							Company
						</label>
						<input
							id="q-company"
							name="company"
							placeholder="Organisation"
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="q-phone" className={labelCls}>
							Phone
						</label>
						<input
							id="q-phone"
							name="phone"
							type="tel"
							placeholder="+91 00000 00000"
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="q-qty" className={labelCls}>
							Quantity
						</label>
						<input
							id="q-qty"
							name="quantity"
							inputMode="decimal"
							placeholder="e.g. 500"
							className={inputCls}
						/>
					</div>
					<div>
						<label htmlFor="q-unit" className={labelCls}>
							Unit
						</label>
						<select
							id="q-unit"
							name="unit"
							defaultValue="Kg"
							className={`${inputCls} cursor-pointer`}
						>
							{UNITS.map((u) => (
								<option key={u} value={u}>
									{u}
								</option>
							))}
						</select>
					</div>
				</div>

				<div>
					<label htmlFor="q-message" className={labelCls}>
						Additional details
					</label>
					<textarea
						id="q-message"
						name="message"
						rows={3}
						placeholder="Grade, packaging, delivery location, timeline…"
						className={`${inputCls} resize-none`}
					/>
				</div>

				{error && (
					<p className="text-base font-medium text-red-400">{error}</p>
				)}

				<CtaSubmit type="submit" disabled={loading} className="w-full">
					{loading ? (
						<RefreshCw className="h-4 w-4 animate-spin" />
					) : (
						<>
							Send Quote Request
							<Send className="h-4 w-4" />
						</>
					)}
				</CtaSubmit>
			</form>
		</div>
	);
}
