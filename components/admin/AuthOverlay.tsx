"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

export default function AuthOverlay({
	show,
	label,
}: {
	show: boolean;
	label: string;
}) {
	const [mounted, setMounted] = useState(false);
	useEffect(() => setMounted(true), []);

	if (!show || !mounted) return null;

	return createPortal(
		<div
			className="fixed inset-0 z-200 flex flex-col items-center justify-center bg-deep"
			role="status"
			aria-live="polite"
		>
			<style>{`
				@keyframes admin-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
				@keyframes admin-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
			`}</style>
			<div className="flex flex-col items-center gap-6" style={{ animation: "admin-rise 0.5s ease" }}>
				<span className="font-heading text-3xl font-semibold tracking-[-0.04em] text-white">SM Chemicals</span>
				<div className="relative h-0.5 w-44 overflow-hidden rounded-full bg-white/15">
					<div className="absolute inset-y-0 w-1/3 rounded-full bg-sky" style={{ animation: "admin-sweep 1.1s ease-in-out infinite" }} />
				</div>
				<span className="text-sm font-medium text-white/70">{label}…</span>
			</div>
		</div>,
		document.body,
	);
}
