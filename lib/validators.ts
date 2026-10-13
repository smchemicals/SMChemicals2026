/*
 * Field rules for the public forms. Each returns an error message, or null
 * when the value is fine. Limits mirror the server schema in
 * app/api/contact/route.ts, which still checks everything on submit.
 */
export type Rule = (value: string) => string | null;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const rules = {
	name: (v: string) => {
		const t = v.trim();
		if (!t) return "Please enter your name.";
		if (t.length < 2) return "Name looks too short.";
		if (t.length > 200) return "Name is too long.";
		return null;
	},
	email: (v: string) => {
		const t = v.trim();
		if (!t) return "Please enter your email.";
		if (!EMAIL.test(t)) return "Enter a valid email, like you@company.com.";
		if (t.length > 200) return "Email is too long.";
		return null;
	},
	phone:
		({ required }: { required: boolean }) =>
		(v: string) => {
			const t = v.trim();
			if (!t) return required ? "Please enter a contact number." : null;
			if (/[^\d\s+()-]/.test(t))
				return "Use digits, spaces, +, - or brackets only.";
			const digits = t.replace(/\D/g, "").length;
			if (digits < 10) return "Phone number needs at least 10 digits.";
			if (digits > 15) return "Phone number has too many digits.";
			return null;
		},
	company:
		({ required }: { required: boolean }) =>
		(v: string) => {
			const t = v.trim();
			if (!t) return required ? "Please enter your company." : null;
			if (t.length > 200) return "Company name is too long.";
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
				return `A little more detail helps (${min - t.length} more characters).`;
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
