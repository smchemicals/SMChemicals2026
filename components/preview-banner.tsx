"use client";

import { usePathname } from "next/navigation";

export function PreviewBanner() {
	const path = usePathname();
	return (
		<div className="fixed bottom-4 left-1/2 z-[1000] flex -translate-x-1/2 items-center gap-4 rounded-full bg-accent-strong px-5 py-2.5 shadow-lg">
			<span className="type-label text-white">
				Draft preview
			</span>
			<a
				href={`/preview/exit?path=${encodeURIComponent(path)}`}
				className="type-label text-white underline underline-offset-2 hover:no-underline"
			>
				Exit
			</a>
		</div>
	);
}
