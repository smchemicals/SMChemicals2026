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
			className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-deep"
			role="status"
			aria-live="polite"
		>
			<style>{`
				@keyframes admin-sweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(400%); } }
				@keyframes admin-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
			`}</style>
			<div
				className="flex flex-col items-center gap-7"
				style={{ animation: "admin-rise 0.5s ease" }}
			>
				<div className="flex flex-col items-center gap-2">
					<span className="text-accent-500 text-4xl font-bold tracking-[0.2em] leading-none">
						SM
					</span>
					<span className="uppercase tracking-[0.4em] text-white/70 text-[0.62rem] font-bold">
						Chemicals CMS
					</span>
				</div>

				<div className="relative h-px w-44 overflow-hidden bg-white/10">
					<div
						className="absolute inset-y-0 w-1/3 bg-accent-500"
						style={{ animation: "admin-sweep 1.1s ease-in-out infinite" }}
					/>
				</div>

				<span className="uppercase tracking-[0.32em] text-accent-500 text-[0.66rem] font-bold">
					{label}…
				</span>
			</div>
		</div>,
		document.body,
	);
}
