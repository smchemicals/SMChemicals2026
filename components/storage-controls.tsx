"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { STORAGE_EVENT, setStorageChoice, storageChoice } from "@/lib/storage";
import { paintTheme, savedTheme, systemTheme } from "@/lib/theme";

/* On the privacy page: what the site is doing right now, and the way to change it. */
export function StorageControls() {
	const [choice, setChoice] = useState<"yes" | "no" | undefined>(undefined);
	const [pinned, setPinned] = useState(false);
	useEffect(() => {
		const read = () => {
			setChoice(storageChoice());
			setPinned(savedTheme() !== null);
		};
		read();
		window.addEventListener(STORAGE_EVENT, read);
		window.addEventListener("smc:theme", read);
		return () => {
			window.removeEventListener(STORAGE_EVENT, read);
			window.removeEventListener("smc:theme", read);
		};
	}, []);

	// Forget the remembered choice and go back to following the device's own setting.
	const followDevice = () => {
		try {
			localStorage.removeItem("smc:theme");
		} catch {}
		paintTheme(systemTheme(), "system");
		window.dispatchEvent(new Event("smc:theme"));
		setPinned(false);
	};

	return (
		<div className="mt-2 flex flex-col gap-5">
			<p className="text-lg font-medium" aria-live="polite">
				{choice === "yes" ? "Right now: this site is remembering your light or dark choice." : "Right now: this site is storing nothing on your device."}
			</p>
			<p className="text-base text-foreground/75">
				Unless you pick a theme with the switch in the footer, the site follows your device&rsquo;s own light or dark setting and changes with it.
			</p>
			<div className="flex flex-wrap gap-3">
				{pinned && (
					<Button variant="primary" size="md" onClick={followDevice}>
						Follow my device&rsquo;s setting
					</Button>
				)}
				{choice === "yes" ? (
					<Button variant="outline" size="md" onClick={() => setStorageChoice("no")}>
						Stop and clear what is stored
					</Button>
				) : (
					<Button variant="primary" size="md" onClick={() => setStorageChoice("yes")}>
						Remember my choice
					</Button>
				)}
			</div>
		</div>
	);
}
