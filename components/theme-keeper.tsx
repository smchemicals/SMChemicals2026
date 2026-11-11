"use client";

import { useEffect } from "react";
import { paintTheme, savedTheme, systemTheme, type Theme } from "@/lib/theme";

/*
 * Two jobs. First, it keeps the page on its theme. The theme is set before the first paint by a small script in the head
 * (app/layout.tsx); if React ever has to throw the server's HTML away and draw the page again in the browser (it does when
 * something such as a browser extension changes the page before React has finished starting), it also resets <html> and the
 * theme goes with it, so the page falls back to light. This puts it straight back, and keeps watching.
 *
 * Second, it follows the device. While nobody has chosen a theme on this page, a change of the device's own light or dark
 * setting (an iPhone at sunset, macOS "Auto", a Windows or Linux theme switch, Android's schedule) is applied at once.
 */
function wanted(): { theme: Theme; source: "saved" | "system" } {
	const saved = savedTheme();
	return saved ? { theme: saved, source: "saved" } : { theme: systemTheme(), source: "system" };
}

export function ThemeKeeper() {
	useEffect(() => {
		const root = document.documentElement;
		const ok = () => root.dataset.theme === "light" || root.dataset.theme === "dark";

		const restore = () => {
			if (ok()) return;
			const w = wanted();
			paintTheme(w.theme, w.source);
			window.dispatchEvent(new Event("smc:theme"));
		};
		restore();
		// The script in the head has already set the theme; this makes the browser's own controls and bar agree with it.
		if (ok()) paintTheme(root.dataset.theme as Theme, (root.dataset.themeSource as "system" | "saved" | "user") || "system");

		const watch = new MutationObserver(restore);
		watch.observe(root, { attributes: true, attributeFilter: ["data-theme"] });

		const device = matchMedia("(prefers-color-scheme: dark)");
		const onDevice = () => {
			// A theme chosen on this page, or remembered from before, is the visitor's own and stays.
			if (root.dataset.themeSource !== "system") return;
			const next = device.matches ? "dark" : "light";
			if (root.dataset.theme === next) return;
			// Colours change in one step, with no fading of every link and label (see globals.css).
			root.classList.add("theme-switching");
			paintTheme(next, "system");
			window.dispatchEvent(new Event("smc:theme"));
			requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove("theme-switching")));
		};
		device.addEventListener("change", onDevice);

		return () => {
			watch.disconnect();
			device.removeEventListener("change", onDevice);
		};
	}, []);
	return null;
}
