/*
 * Light or dark, and who decided. By default the site follows the device (iOS, Android, macOS, Windows, Linux: all of them
 * tell the browser through `prefers-color-scheme`), and keeps following it while the page is open, so when the device
 * switches at sunset the site switches with it. Pressing the switch in the footer is a choice of the visitor's own: from then
 * on that choice wins (and is remembered across visits only if they have said yes to storage, see lib/storage.ts).
 *
 * `data-theme-source` on <html> records who decided: "system" (follows the device), "saved" (a remembered choice) or "user"
 * (chosen on this page).
 */
export type Theme = "light" | "dark";
export type ThemeSource = "system" | "saved" | "user";

// The browser's own bar (the address bar on a phone, the title bar on a desktop) takes this colour.
const CHROME: Record<Theme, string> = { light: "#eef6fb", dark: "#0b1c28" };

export const systemTheme = (): Theme => (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

export function savedTheme(): Theme | null {
	try {
		const t = localStorage.getItem("smc:theme");
		return t === "light" || t === "dark" ? t : null;
	} catch {
		return null;
	}
}

/* Puts a theme on the page: the colours, the browser's own controls (scrollbars, form fields) and the browser bar. */
export function paintTheme(theme: Theme, source: ThemeSource) {
	const root = document.documentElement;
	root.dataset.theme = theme;
	root.dataset.themeSource = source;
	root.style.colorScheme = theme;
	document.querySelectorAll('meta[name="theme-color"]').forEach((m) => {
		// The page sets one bar colour per scheme by media query; once the theme is known, every one says the same thing.
		m.removeAttribute("media");
		m.setAttribute("content", CHROME[theme]);
	});
}
