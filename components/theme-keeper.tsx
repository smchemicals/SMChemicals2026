"use client";

import { useEffect } from "react";

/*
 * Keeps the theme on the page. The theme is set before the first paint by a small script in the document head (app/layout.tsx).
 * If React ever has to throw the server's HTML away and draw the page again in the browser (it does when something such as a
 * browser extension changes the page before React has finished starting), it also resets the <html> element, and the theme
 * the script set goes with it, so the page falls back to light. This puts it straight back, and keeps watching.
 */
function wanted(): "light" | "dark" {
	try {
		const saved = localStorage.getItem("smc:theme");
		if (saved === "light" || saved === "dark") return saved;
	} catch {}
	return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeKeeper() {
	useEffect(() => {
		const root = document.documentElement;
		const restore = () => {
			if (root.dataset.theme !== "light" && root.dataset.theme !== "dark") {
				root.dataset.theme = wanted();
				window.dispatchEvent(new Event("smc:theme"));
			}
		};
		restore();
		const watch = new MutationObserver(restore);
		watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
		return () => watch.disconnect();
	}, []);
	return null;
}
