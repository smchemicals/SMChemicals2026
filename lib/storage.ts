/*
 * What this site may keep on a visitor's device, and the one rule for it: nothing is stored unless they have said yes.
 * Until then (and if they say no) everything works the same and simply isn't remembered: the theme follows the system,
 * the opening animation plays each visit. Saying yes stores one small flag (below) plus the choices it allows; saying
 * no stores nothing at all, so the question comes back next visit, because remembering "no" would itself be storing.
 */
export const CONSENT_KEY = "smc:storage";
export const STORAGE_EVENT = "smc:storage-change";
const OURS = ["smc:theme", "smc:intro", "smc:notice", CONSENT_KEY];

export type StorageChoice = "yes" | "no" | undefined;

let choice: StorageChoice;

export function storageChoice(): StorageChoice {
	if (choice) return choice;
	try {
		return localStorage.getItem(CONSENT_KEY) === "yes" ? "yes" : undefined;
	} catch {
		return undefined;
	}
}

const allowed = () => storageChoice() === "yes";

/* Remember something across visits (theme). A no-op unless they have said yes. */
export function remember(key: string, value: string) {
	if (!allowed()) return;
	try {
		localStorage.setItem(key, value);
	} catch {}
}

/* Remember something for this visit only (that the opening animation has played). A no-op unless they have said yes. */
export function rememberVisit(key: string, value: string) {
	if (!allowed()) return;
	try {
		sessionStorage.setItem(key, value);
	} catch {}
}

export function readVisit(key: string): string | null {
	try {
		return sessionStorage.getItem(key);
	} catch {
		return null;
	}
}

/* Remove everything this site has stored. */
export function clearStored() {
	try {
		OURS.forEach((k) => {
			localStorage.removeItem(k);
			sessionStorage.removeItem(k);
		});
	} catch {}
}

export function setStorageChoice(next: "yes" | "no") {
	choice = next;
	if (next === "yes") {
		try {
			localStorage.setItem(CONSENT_KEY, "yes");
			// Keep the choice they have already made this visit.
			localStorage.setItem("smc:theme", document.documentElement.dataset.theme === "dark" ? "dark" : "light");
		} catch {}
	} else {
		clearStored();
	}
	window.dispatchEvent(new Event(STORAGE_EVENT));
}
