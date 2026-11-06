/*
 * Field rules for the public forms. Each returns an error message, or null
 * when the value is fine. Limits mirror the server schema in
 * app/api/contact/route.ts, which still checks everything on submit.
 */
export type Rule = (value: string) => string | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME = /^[\p{L}\p{M}][\p{L}\p{M}\s.'’-]*$/u;

/* The mail providers most often mistyped. A near miss on one of these is almost certainly a typo. */
const COMMON_DOMAINS = ["gmail.com", "yahoo.com", "yahoo.co.in", "outlook.com", "hotmail.com", "icloud.com", "rediffmail.com", "live.com"];

function distance(a: string, b: string) {
	const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
	for (let j = 1; j <= b.length; j++) d[0][j] = j;
	for (let i = 1; i <= a.length; i++)
		for (let j = 1; j <= b.length; j++)
			d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
	return d[a.length][b.length];
}

/* "you@gmial.com" gives "gmail.com"; anything that is not a near miss gives null. */
export function suggestDomain(email: string): string | null {
	const at = email.lastIndexOf("@");
	if (at < 1) return null;
	const domain = email.slice(at + 1).toLowerCase();
	if (!domain || COMMON_DOMAINS.includes(domain)) return null;
	const near = COMMON_DOMAINS.find((c) => distance(domain, c) <= 2 && Math.abs(domain.length - c.length) <= 2);
	return near ?? null;
}

export const rules = {
	name: (v: string) => {
		const t = v.trim();
		if (!t) return "Please enter your name.";
		if (t.length < 2) return "That looks too short for a name.";
		if (/\d/.test(t)) return "Names can't contain numbers.";
		if (!NAME.test(t)) return "Use letters only, with spaces, dots, hyphens or apostrophes.";
		if (t.length > 200) return "That name is too long.";
		return null;
	},
	email: (v: string) => {
		const t = v.trim();
		if (!t) return "Please enter your email.";
		if (/\s/.test(t)) return "Remove the spaces from the email address.";
		if (!t.includes("@")) return "An email address needs an @, like you@company.com.";
		if (!EMAIL.test(t) || t.includes("..") || t.startsWith(".") || t.split("@")[0].length > 64)
			return "Enter a valid email, like you@company.com.";
		const fix = suggestDomain(t);
		if (fix) return `Did you mean ${t.slice(0, t.lastIndexOf("@") + 1)}${fix}?`;
		if (t.length > 200) return "That email is too long.";
		return null;
	},
	phone:
		({ required }: { required: boolean }) =>
		(v: string) => {
			const t = v.trim();
			if (!t) return required ? "Please enter a contact number." : null;
			if (/[^\d\s+()-]/.test(t)) return "Use digits, spaces, + or - only.";
			const digits = t.replace(/\D/g, "");
			if (digits.length < 10) return `Add ${10 - digits.length} more digit${10 - digits.length === 1 ? "" : "s"}; numbers need at least 10.`;
			if (digits.length > 15) return "That has too many digits.";
			if (/^(\d)\1+$/.test(digits)) return "Please enter a real number.";
			// Without a country code it is an Indian mobile number: ten digits starting 6 to 9 (a leading 0 is allowed).
			if (!t.startsWith("+") && (digits.length === 10 || (digits.length === 11 && digits.startsWith("0")))) {
				if (!/^[6-9]/.test(digits.slice(-10))) return "Indian mobile numbers start with 6, 7, 8 or 9.";
			}
			if (t.startsWith("+91") && !/^[6-9]\d{9}$/.test(digits.slice(2)))
				return "After +91, enter a 10 digit number starting 6 to 9.";
			return null;
		},
	company:
		({ required }: { required: boolean }) =>
		(v: string) => {
			const t = v.trim();
			if (!t) return required ? "Please enter your company." : null;
			if (t.length < 2) return "That looks too short for a company name.";
			if (!/\p{L}/u.test(t)) return "A company name needs some letters.";
			if (t.length > 200) return "That company name is too long.";
			return null;
		},
	choice: (label: string) => (v: string) =>
		v ? null : `Please select ${label}.`,
	message:
		({ min = 0, required = false }: { min?: number; required?: boolean }) =>
		(v: string) => {
			const t = v.trim();
			if (!t) return required ? "Please add a few details." : null;
			if (t.length < min)
				return `A little more detail helps, ${min - t.length} more character${min - t.length === 1 ? "" : "s"}.`;
			if (min > 0 && t.split(/\s+/).length < 3) return "Please write at least a few words.";
			if (t.length > 5000) return "Please keep this under 5,000 characters.";
			return null;
		},
	quantity: (v: string) => {
		const t = v.trim();
		if (!t) return null;
		const n = Number(t.replace(/,/g, ""));
		if (!Number.isFinite(n) || n <= 0) return "Enter a quantity above zero.";
		return null;
	},
	optionalText: (max: number) => (v: string) =>
		v.trim().length > max ? `Please keep this under ${max} characters.` : null,
} as const;

/* Resume check, used on the file input before anything is uploaded. */
export const MAX_RESUME_BYTES = 5 * 1024 * 1024;

export function resumeError(file: File | null | undefined): string | null {
	if (!file) return "Please attach your resume (PDF).";
	const isPdf =
		file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
	if (!isPdf) return "Resume must be a PDF.";
	if (file.size > MAX_RESUME_BYTES) return "Resume must be under 5 MB.";
	if (file.size === 0) return "That file is empty.";
	return null;
}
