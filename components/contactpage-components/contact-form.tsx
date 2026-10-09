"use client";

import React, {useState} from "react";
import {Send, CheckCircle2, RefreshCw} from "lucide-react";
import {CtaSubmit} from "@/components/ui/cta-button";

const industries = [
    "Water Treatment", "ETP/STP", "Construction", "Textile",
    "Pharmaceutical", "Paints & Coatings", "Food & Beverage",
    "Power Plants", "Oil & Gas", "Other"
];

export function ContactForm() {
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const fd = new FormData(e.currentTarget);
        const payload = {
            name: String(fd.get("fullName") || ""),
            email: String(fd.get("email") || ""),
            message: String(fd.get("message") || ""),
            label: "Product Inquiry",
            fields: {
                Company: String(fd.get("company") || ""),
                Phone: String(fd.get("phone") || ""),
                "Industry Sector": String(fd.get("industry") || ""),
                "Primary Chemicals": String(fd.get("chemicals") || ""),
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
        w-full bg-transparent border-b border-line py-4
        text-foreground placeholder:text-muted/60
        hover:border-foreground/30
        focus:outline-none focus:border-accent
        transition-colors font-light text-lg appearance-none rounded-none
    `;

    const labelClasses = "text-[11px] font-black text-muted uppercase tracking-[0.3em] block mb-1";

    if (isSubmitted) {
        return (
            <div className="py-20 text-center animate-in fade-in zoom-in duration-500">
                <CheckCircle2 className="h-16 w-16 text-accent mx-auto mb-6"/>
                <h3 className="text-3xl font-bold text-foreground tracking-tighter">Request Sent Successfully</h3>
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

    return (
        <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-12 text-left">
                <div className="group">
                    <label className={labelClasses}>Full Name</label>
                    <input name="fullName" type="text" placeholder="Your name" required className={inputClasses}/>
                </div>
                <div className="group">
                    <label className={labelClasses}>Company</label>
                    <input name="company" type="text" placeholder="Company name" required className={inputClasses}/>
                </div>
                <div className="group">
                    <label className={labelClasses}>Email Address</label>
                    <input name="email" type="email" placeholder="you@company.com" required className={inputClasses}/>
                </div>
                <div className="group">
                    <label className={labelClasses}>Contact Number</label>
                    <input name="phone" type="tel" placeholder="+91 00000 00000" required className={inputClasses}/>
                </div>
                <div className="group relative">
                    <label className={labelClasses}>Industry Sector</label>
                    <select
                        name="industry"
                        required
                        defaultValue=""
                        className={inputClasses}
                    >
                        <option value="" disabled className="text-muted/70">
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
                    <div className="absolute right-0 bottom-6 pointer-events-none text-muted/70">
                        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                            <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                    </div>
                </div>
                <div className="group">
                    <label className={labelClasses}>Primary Chemicals</label>
                    <input name="chemicals" type="text" placeholder="e.g. PAC, Ferric Chloride..." className={inputClasses}/>
                </div>
            </div>

            <div className="group text-left">
                <label className={labelClasses}>Requirements</label>
                <textarea name="message" rows={4} placeholder="Quantities, grade, delivery location, timelines…" required
                          className={`${inputClasses} resize-none`}/>
            </div>

            {error && (
                <p className="text-center text-base font-medium text-red-400">{error}</p>
            )}

            <div className="flex justify-center pt-6">
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
