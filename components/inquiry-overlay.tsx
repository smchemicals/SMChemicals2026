"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { gsap } from "@/lib/gsap";
import { getLenis } from "@/lib/smooth-scroll";
import { INQUIRY_EVENT, INQUIRY_TOPICS, type InquiryRequest, type InquiryTopic } from "@/lib/inquiry";
import { Button } from "@/components/ui/button";
import { ContactForm, type InquiryCatalog } from "@/components/contactpage-components/contact-form";

/*
 * The quote form lives here, not on a page. Anything on the site can open it with
 * openInquiry(); it takes the whole screen on navy, one question at a time, and
 * closes with the button, Escape, or once the person is done.
 */
export function InquiryOverlay({ catalog }: { catalog: InquiryCatalog }) {
	const [open, setOpen] = useState(false);
	const [topic, setTopic] = useState<InquiryTopic>("general");
	const [productId, setProductId] = useState<string | null>(null);
	// Each opening is a fresh form.
	const [session, setSession] = useState(0);
	const root = useRef<HTMLDivElement>(null);
	const opener = useRef<HTMLElement | null>(null);
	const pathname = usePathname();

	useEffect(() => {
		const onOpen = (e: Event) => {
			const d = (e as CustomEvent<InquiryRequest>).detail;
			setTopic(d?.topic && d.topic in INQUIRY_TOPICS ? d.topic : "general");
			setProductId(d?.productId ?? null);
			setSession((n) => n + 1);
			opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
			setOpen(true);
		};
		window.addEventListener(INQUIRY_EVENT, onOpen);
		return () => window.removeEventListener(INQUIRY_EVENT, onOpen);
	}, []);

	// Changing page closes it.
	useEffect(() => setOpen(false), [pathname]);

	// Enter: stop the page scrolling beneath, fade and lift in.
	useEffect(() => {
		if (!open) return;
		getLenis()?.stop();
		const prev = document.documentElement.style.overflow;
		document.documentElement.style.overflow = "hidden";
		const el = root.current;
		if (el) gsap.fromTo(el, { autoAlpha: 0, y: 24 }, { autoAlpha: 1, y: 0, duration: 0.6, ease: "expoOut" });
		return () => {
			getLenis()?.start();
			document.documentElement.style.overflow = prev;
			opener.current?.focus?.({ preventScroll: true });
		};
	}, [open]);

	const close = useCallback(() => {
		const el = root.current;
		if (!el) return setOpen(false);
		gsap.to(el, { autoAlpha: 0, y: 16, duration: 0.3, ease: "power2.in", onComplete: () => setOpen(false) });
	}, []);

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open, close]);

	if (!open) return null;

	const product = productId ? catalog.flatMap((c) => c.products).find((p) => p.id === productId) : undefined;
	const title = product ? `Quote for ${product.name}` : INQUIRY_TOPICS[topic].title;

	return (
		<div
			ref={root}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			data-surface="inverse"
			data-overlay
			data-lenis-prevent
			className="fixed inset-0 z-1600 overflow-y-auto bg-background text-foreground"
			style={{ visibility: "hidden" }}
		>
			<div className="mx-auto flex min-h-full max-w-7xl flex-col px-6 py-6 sm:px-10">
				<div className="flex items-center justify-between">
					<span className="font-heading text-[clamp(1.25rem,2vw,1.75rem)] font-semibold tracking-[-0.03em]">
						{title}
					</span>
					<Button variant="light" size="md" onClick={close}>
						Close
					</Button>
				</div>
				<div className="flex flex-1 items-center py-16">
					<div className="w-full">
						<ContactForm key={session} label={INQUIRY_TOPICS[topic].label} catalog={catalog} preset={product ? { productId: product.id } : null} />
					</div>
				</div>
			</div>
		</div>
	);
}
