"use client";

import React, {useState} from "react";
import {Send, CheckCircle2, RefreshCw} from "lucide-react";
import {CtaSubmit} from "@/components/ui/cta-button";
import {FieldError, ValidTick, fieldState} from "@/components/ui/form-field";
import {useFormValidation} from "@/hooks/use-form-validation";
import {rules} from "@/lib/validators";
import {cn} from "@/lib/utils";

const industries = [
    "Water Treatment", "ETP/STP", "Construction", "Textile",
    "Pharmaceutical", "Paints & Coatings", "Food & Beverage",
    "Power Plants", "Oil & Gas", "Other"
];

const formRules = {
    fullName: rules.name,
    company: rules.company({required: true}),
    email: rules.email,
    phone: rules.phone({required: true}),
    industry: rules.choice("a sector"),
    chemicals: rules.optionalText(300),
    message: rules.message({required: true, min: 10}),
};

export function ContactForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const v = useFormValidation(formRules, {idPrefix: "contact"});

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        if (!v.validateAll()) return;
        setIsLoading(true);

        const fd = new FormData(e.currentTarget);
        const payload = {
            name: String(fd.get("fullName") || "").trim(),
            email: String(fd.get("email") || "").trim(),
            message: String(fd.get("message") || "").trim(),
            label: "Product Inquiry",
            fields: {
                Company: String(fd.get("company") || "").trim(),
                Phone: String(fd.get("phone") || "").trim(),
                "Industry Sector": String(fd.get("industry") || ""),
                "Primary Chemicals": String(fd.get("chemicals") || "").trim(),
            },
        };

        try {
            const res = await fetch("/api/contact", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify(payload),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || data.ok === false) {
                throw new Error(data.error || "Something went wrong. Please try again.");
            }
            v.reset();
            setIsSubmitted(true);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not send. Please try again.",
            );
        } finally {
            setIsLoading(false);
        }
    };

    const inputClasses = `
        w-full bg-transparent border-b border-line py-4 pr-7
        text-foreground placeholder:text-muted/80
        hover:border-foreground/30
        focus:outline-none focus:border-accent
        transition-colors font-light text-lg appearance-none rounded-none
    `;
    const input = (name: keyof typeof formRules) =>
        cn(inputClasses, fieldState(Boolean(v.error(name))));

    const labelClasses = "type-label text-muted block mb-1";

    if (isSubmitted) {
        return (
            <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="h-16 w-16 text-accent-ink mx-auto mb-6"/>
                <h3 className="font-heading text-3xl font-semibold text-foreground tracking-tight">Request Sent Successfully</h3>
                <p className="mt-4 text-muted text-base font-light">We&apos;ll be in touch within two working days.</p>
                <div className="flex justify-center">
                    <CtaSubmit
                        variant="outline"
                        type="button"
                        onClick={() => setIsSubmitted(false)}
                        className="mt-8"
                    >
                        Send another enquiry
                    </CtaSubmit>
                </div>
            </div>
        );
    }

    const text = (
        name: keyof typeof formRules,
        label: string,
        props: React.InputHTMLAttributes<HTMLInputElement>,
    ) => (
        <div>
            <label htmlFor={`contact-${name}`} className={labelClasses}>{label}</label>
            <div className="relative">
                <input {...props} {...v.register(name)} className={input(name)}/>
                <ValidTick show={v.isValid(name)}/>
            </div>
            <FieldError id={v.errorId(name)} message={v.error(name)}/>
        </div>
    );

    return (
        <form onSubmit={handleSubmit} noValidate className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6 text-left">
                {text("fullName", "Full Name", {type: "text", placeholder: "Your name", autoComplete: "name"})}
                {text("company", "Company", {type: "text", placeholder: "Company name", autoComplete: "organization"})}
                {text("email", "Email Address", {type: "email", placeholder: "you@company.com", autoComplete: "email"})}
                {text("phone", "Contact Number", {type: "tel", placeholder: "+91 00000 00000", autoComplete: "tel"})}
                <div>
                    <label htmlFor="contact-industry" className={labelClasses}>Industry Sector</label>
                    <div className="relative">
                        <select
                            {...v.register("industry")}
                            defaultValue=""
                            className={cn(input("industry"), "cursor-pointer")}
                        >
                            <option value="" disabled className="text-muted">
                                Select sector...
                            </option>
                            {industries.map((ind) => (
                                <option
                                    key={ind}
                                    value={ind}
                                    className="bg-background text-foreground"
                                >
                                    {ind}
                                </option>
                            ))}
                        </select>
                        <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
                            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                        </div>
                    </div>
                    <FieldError id={v.errorId("industry")} message={v.error("industry")}/>
                </div>
                {text("chemicals", "Primary Chemicals (optional)", {type: "text", placeholder: "e.g. PAC, Ferric Chloride..."})}
            </div>

            <div className="text-left">
                <label htmlFor="contact-message" className={labelClasses}>Requirements</label>
                <div className="relative">
                    <textarea
                        {...v.register("message")}
                        rows={4}
                        placeholder="Quantities, grade, delivery location, timelines…"
                        className={cn(input("message"), "resize-none")}
                    />
                </div>
                <FieldError id={v.errorId("message")} message={v.error("message")}/>
            </div>

            {error && (
                <p role="alert" className="text-center text-base font-medium text-danger">{error}</p>
            )}

            <div className="flex justify-center pt-2">
                <CtaSubmit
                    type="submit"
                    disabled={isLoading}
                    className="w-full md:w-auto min-w-65"
                >
                    {isLoading ? (
                        <RefreshCw className="h-4 w-4 animate-spin"/>
                    ) : (
                        <>
                            Submit Inquiry
                            <Send className="h-4 w-4"/>
                        </>
                    )}
                </CtaSubmit>
            </div>
        </form>
    );
}
