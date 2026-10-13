"use client";

import { useEffect, useRef } from "react";
import { ContactForm } from "./contact-form";
import { useSection } from "@/hooks/use-section";
import { getLenis } from "@/lib/smooth-scroll";

export function ContactInquiry() {
    const scope = useSection<HTMLDivElement>({
        stagger: 0.12,
        start: "top 85%",
        exitY: -40,
    });
    const sectionRef = useRef<HTMLElement>(null);

    useEffect(() => {
        const scrollToSelf = () => {
            const el = sectionRef.current;
            if (!el) return;
            const lenis = getLenis();
            if (lenis) lenis.scrollTo(el, { offset: -80 });
            else el.scrollIntoView({ behavior: "smooth" });
        };
        if (sessionStorage.getItem("smc:scrollInquiry")) {
            sessionStorage.removeItem("smc:scrollInquiry");
            setTimeout(scrollToSelf, 420);
        }
        const onEvent = () => setTimeout(scrollToSelf, 50);
        window.addEventListener("scroll-to-inquiry", onEvent);
        return () => window.removeEventListener("scroll-to-inquiry", onEvent);
    }, []);

    return (
        <section
            id="inquiry"
            ref={sectionRef}
            className="py-24 lg:py-32 bg-surface border-t border-line"
        >
            <div ref={scope} className="mx-auto max-w-7xl px-6 sm:px-10">
                <div data-reveal className="mb-20 flex flex-col items-center text-center">
                    <h2 className="text-5xl md:text-7xl font-semibold tracking-tight text-foreground mb-8 leading-none max-w-4xl">
                        Request a <span className="font-light text-muted">technical quote.</span>
                    </h2>

                    <p className="text-lg text-foreground/75 max-w-2xl font-light leading-relaxed">
                        Specify molecular purity requirements, industrial scale, and logistical
                        deadlines for accurate chemical assessment.
                    </p>
                </div>

                <div data-reveal className="max-w-5xl mx-auto rounded-sm border border-line bg-background shadow-[0_40px_120px_-40px] shadow-foreground/25">
                    <div className="p-8 md:p-16">
                        <ContactForm />
                    </div>
                </div>
            </div>
        </section>
    );
}