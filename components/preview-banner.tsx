"use client";

import { usePathname } from "next/navigation";

export function PreviewBanner() {
	const path = usePathname();
	return (
		<div className="fixed bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-4 rounded-full bg-accent px-5 py-2.5 shadow-lg">
			<span className="text-black text-[11px] font-black uppercase tracking-[0.2em]">
				Draft preview
			</span>
			<a
				href={`/preview/exit?path=${encodeURIComponent(path)}`}
				className="text-black text-[11px] font-black uppercase tracking-[0.2em] underline underline-offset-2 hover:no-underline"
			>
				Exit
			</a>
		</div>
	);
}
