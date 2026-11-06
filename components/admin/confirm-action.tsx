"use client";

import { useState } from "react";
import { LINK_BTN, LINK_DANGER } from "@/components/admin/ui";

/*
 * A destructive action that asks once, in place, instead of a browser dialog: the button turns into
 * "Delete this? Yes, delete / Keep". Escape or Keep puts it back.
 */
export function ConfirmAction({
	children,
	prompt,
	confirmLabel = "Yes, delete",
	onConfirm,
	disabled,
	ariaLabel,
	className = LINK_DANGER,
}: {
	children: React.ReactNode;
	prompt: string;
	confirmLabel?: string;
	onConfirm: () => void;
	disabled?: boolean;
	ariaLabel?: string;
	className?: string;
}) {
	const [asking, setAsking] = useState(false);

	if (!asking) {
		return (
			<button type="button" disabled={disabled} onClick={() => setAsking(true)} aria-label={ariaLabel} title={ariaLabel} className={className}>
				{children}
			</button>
		);
	}
	return (
		<span
			role="group"
			aria-label={prompt}
			className="inline-flex items-center gap-3 text-sm text-muted"
			onKeyDown={(e) => e.key === "Escape" && (e.stopPropagation(), setAsking(false))}
		>
			{prompt}
			<button
				type="button"
				autoFocus
				disabled={disabled}
				onClick={() => {
					setAsking(false);
					onConfirm();
				}}
				className={`${LINK_DANGER} font-semibold text-danger-ink`}
			>
				{confirmLabel}
			</button>
			<button type="button" onClick={() => setAsking(false)} className={LINK_BTN}>
				Keep
			</button>
		</span>
	);
}
