"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { STORAGE_EVENT, clearStored, setStorageChoice, storageChoice } from "@/lib/storage";

/*
 * Asks once whether the site may remember anything at all, and keeps to the answer: "Store nothing" stores nothing (it
 * also clears anything stored before), and the site works exactly the same, it just doesn't remember. It is a real
 * choice, not a wall, so both buttons are equals. Until they answer, nothing is stored either.
 */
export function StorageNotice() {
	const [show, setShow] = useState(false);

	useEffect(() => {
		const sync = () => setShow(false);
		window.addEventListener(STORAGE_EVENT, sync);
		if (storageChoice()) return () => window.removeEventListener(STORAGE_EVENT, sync);
		// No answer yet means nothing may be kept, including anything an earlier version of the site stored.
		clearStored();
		// After the opening animation, so it never competes with it.
		const t = setTimeout(() => !storageChoice() && setShow(true), 4200);
		return () => {
			clearTimeout(t);
			window.removeEventListener(STORAGE_EVENT, sync);
		};
	}, []);

	if (!show) return null;

	return (
		<div
			role="region"
			aria-label="Privacy choice"
			data-surface="inverse"
			className="fixed bottom-4 left-4 right-4 z-1050 rounded-lg bg-background p-5 text-foreground shadow-[0_24px_48px_-24px_rgb(0_0_0/0.5)] sm:right-auto sm:max-w-md"
		>
			<p className="text-base leading-[1.55] text-foreground/85">
				May this site remember your light or dark choice in your browser? That is all it would keep: no tracking, no advertising. If you say no, nothing is stored.{" "}
				<Link href="/privacy" className="font-medium text-foreground underline underline-offset-4 outline-none hover:text-accent focus-visible:text-accent">
					How it works
				</Link>
				.
			</p>
			<div className="mt-4 flex flex-wrap gap-3">
				<Button variant="light" size="sm" onClick={() => setStorageChoice("yes")}>
					Remember my choice
				</Button>
				<Button variant="outline" size="sm" onClick={() => setStorageChoice("no")}>
					Store nothing
				</Button>
			</div>
		</div>
	);
}
