"use client";

import React, { useState } from "react";
import { ArrowLeft, Send, RefreshCw, CheckCircle2 } from "lucide-react";
import type { Product } from "@/data/products";
import { CtaSubmit } from "@/components/ui/cta-button";
import { FieldError, ValidTick, fieldState } from "@/components/ui/form-field";
import { useFormValidation } from "@/hooks/use-form-validation";
import { rules } from "@/lib/validators";
import { cn } from "@/lib/utils";

const inputCls =
	"w-full bg-transparent border-b border-line py-3 text-foreground placeholder:text-muted/80 focus:outline-none focus:border-accent transition-colors font-light text-base";
const labelCls =
	"type-label text-muted block mb-1.5";

const UNITS = ["Kg", "Litre", "Tonne", "Bag", "Drum", "Other"];

const formRules = {
	name: rules.name,
	email: rules.email,
	company: rules.company({ required: false }),
	phone: rules.phone({ required: false }),
	quantity: rules.quantity,
	message: rules.message({}),
};
type FieldName = keyof typeof formRules;

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
	const v = useFormValidation(formRules, { idPrefix: "q" });

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();
		setError(null);
		if (!v.validateAll()) return;
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
			name: String(fd.get("name") || "").trim(),
			email: String(fd.get("email") || "").trim(),
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
			v.reset();
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
				<CheckCircle2 className="mx-auto mb-5 h-14 w-14 text-accent-ink" />
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
					className="type-label mt-8 inline-flex items-center gap-2 text-foreground hover:text-accent-ink transition-colors cursor-pointer"
				>
					<ArrowLeft className="h-4 w-4" /> Back to product
				</button>
			</div>
		);
	}

	const text = (
		name: FieldName,
		label: string,
		props: React.InputHTMLAttributes<HTMLInputElement>,
	) => (
		<div>
			<label htmlFor={`q-${name}`} className={labelCls}>
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
		<div>
			<button
				type="button"
				onClick={onBack}
				className="type-label mb-8 inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors cursor-pointer"
			>
				<ArrowLeft className="h-4 w-4" /> Back to details
			</button>

			<span className="type-label text-accent-ink block mb-2">
				Request a Quote
			</span>
			<p className="text-foreground/75 text-base font-light leading-relaxed mb-8">
				Tell us your requirement for{" "}
				<span className="font-medium text-foreground">{product.name}</span> and we
				will respond with pricing and availability.
			</p>

			<form onSubmit={handleSubmit} noValidate className="space-y-4">
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
					{text("name", "Full Name", { placeholder: "Your name", autoComplete: "name" })}
					{text("email", "Email", { type: "email", placeholder: "you@company.com", autoComplete: "email" })}
					{text("company", "Company (optional)", { placeholder: "Organisation", autoComplete: "organization" })}
					{text("phone", "Phone (optional)", { type: "tel", placeholder: "+91 00000 00000", autoComplete: "tel" })}
					{text("quantity", "Quantity (optional)", { inputMode: "decimal", placeholder: "e.g. 500" })}
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
						Additional details (optional)
					</label>
					<textarea
						{...v.register("message")}
						rows={3}
						placeholder="Grade, packaging, delivery location, timeline…"
						className={cn(inputCls, fieldState(Boolean(v.error("message"))), "resize-none")}
					/>
					<FieldError id={v.errorId("message")} message={v.error("message")} />
				</div>

				{error && (
					<p role="alert" className="text-base font-medium text-danger">{error}</p>
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
