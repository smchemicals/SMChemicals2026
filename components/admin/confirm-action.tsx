"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BTN_DANGER, BTN_QUIET, LINK_DANGER } from "@/components/admin/ui";

/*
 * A destructive action that stops and says what it will do. The red button opens a centred dialog: a plain heading that
 * names the thing, one sentence on what is lost, a solid red "Yes, delete" and a quiet "Keep". It is the same on a phone,
 * a tablet and a desktop, never squeezed into a row, and large enough to read and to tap. Focus starts on "Keep" so a
 * stray Enter never deletes; Escape, Keep and a tap outside all close it. Nothing is touched until the red button.
 */
export function ConfirmAction({
	children,
	prompt,
	warning = "This can't be undone.",
	confirmLabel = "Yes, delete",
	onConfirm,
	disabled,
	ariaLabel,
	className = LINK_DANGER,
}: {
	children: React.ReactNode;
	prompt: string;
	warning?: string;
	confirmLabel?: string;
	onConfirm: () => void;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
}) {
	const [open, setOpen] = useState(false);
	const [mounted, setMounted] = useState(false);
	const keep = useRef<HTMLButtonElement>(null);
	const opener = useRef<HTMLButtonElement>(null);
	const titleId = useId();
	const textId = useId();

	useEffect(() => setMounted(true), []);

	useEffect(() => {
		if (!open) return;
		keep.current?.focus();
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				e.stopPropagation();
				setOpen(false);
			}
		};
		window.addEventListener("keydown", onKey, true);
		const prevOverflow = document.body.style.overflow;
		document.body.style.overflow = "hidden";
		return () => {
			window.removeEventListener("keydown", onKey, true);
			document.body.style.overflow = prevOverflow;
			opener.current?.focus();
		};
	}, [open]);

	return (
		<>
			<button ref={opener} type="button" disabled={disabled} onClick={() => setOpen(true)} aria-label={ariaLabel} title={ariaLabel} className={className}>
				{children}
			</button>
			{open &&
				mounted &&
				createPortal(
					<div data-surface="inverse" data-lenis-prevent className="fixed inset-0 z-1400 flex items-end justify-center p-4 sm:items-center">
						<div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
						<div
							role="alertdialog"
							aria-modal="true"
							aria-labelledby={titleId}
							aria-describedby={textId}
							className="relative w-full max-w-md rounded-2xl bg-background p-6 text-foreground shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)] sm:p-8"
						>
							<p id={titleId} className="font-heading text-2xl font-semibold leading-tight tracking-[-0.03em] text-danger [overflow-wrap:anywhere]">
								{prompt}
							</p>
							<p id={textId} className="mt-3 text-lg leading-[1.5] text-foreground">
								{warning}
							</p>
							<div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
								<button ref={keep} type="button" onClick={() => setOpen(false)} className={`${BTN_QUIET} sm:w-auto`}>
									Keep
								</button>
								<button
									type="button"
									onClick={() => {
										setOpen(false);
										onConfirm();
									}}
									className={`${BTN_DANGER} !h-11 sm:!px-6`}
								>
									{confirmLabel}
								</button>
							</div>
						</div>
					</div>,
					document.body,
				)}
		</>
	);
}
