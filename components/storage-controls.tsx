"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { STORAGE_EVENT, setStorageChoice, storageChoice } from "@/lib/storage";

/* On the privacy page: what the site is doing right now, and the way to change it. */
export function StorageControls() {
	const [choice, setChoice] = useState<"yes" | "no" | undefined>(undefined);
	useEffect(() => {
		const read = () => setChoice(storageChoice());
		read();
		window.addEventListener(STORAGE_EVENT, read);
		return () => window.removeEventListener(STORAGE_EVENT, read);
	}, []);

	return (
		<div className="mt-2 flex flex-col gap-5">
			<p className="text-lg font-medium" aria-live="polite">
				{choice === "yes" ? "Right now: this site is remembering your light or dark choice." : "Right now: this site is storing nothing on your device."}
			</p>
			<div className="flex flex-wrap gap-3">
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
