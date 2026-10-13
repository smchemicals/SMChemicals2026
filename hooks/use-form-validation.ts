"use client";

import { useState } from "react";
import type { Rule } from "@/lib/validators";

/*
 * Live, client-side validation for a form.
 *
 * - Values are checked on every keystroke.
 * - A field's error shows once you've left it (or tried to submit), so
 *   nobody is told "invalid email" after typing one letter. Once it shows,
 *   it updates live and clears the moment the value is fixed.
 * - `isValid` is live from the first keystroke, for a positive tick.
 * - `validateAll()` on submit reveals every error and focuses the first one.
 *
 * Inputs stay uncontrolled; `register(name)` wires id, name, change/blur
 * handlers and the aria attributes.
 */
export function useFormValidation<K extends string>(
	rules: Record<K, Rule>,
	{ idPrefix, initial = {} }: { idPrefix: string; initial?: Partial<Record<K, string>> },
) {
	const keys = Object.keys(rules) as K[];
	const [values, setValues] = useState<Partial<Record<K, string>>>(initial);
	const [touched, setTouched] = useState<Partial<Record<K, boolean>>>({});
	const [submitted, setSubmitted] = useState(false);

	const idOf = (name: K) => `${idPrefix}-${name}`;
	const errorIdOf = (name: K) => `${idOf(name)}-error`;
	const errorOf = (name: K) => rules[name](values[name] ?? "");

	/* The message to show right now (null while the field is untouched). */
	const error = (name: K) => (touched[name] || submitted ? errorOf(name) : null);

	/* Has a value and passes its rule. */
	const isValid = (name: K) => (values[name] ?? "").trim() !== "" && !errorOf(name);

	const setValue = (name: K, value: string) =>
		setValues((v) => ({ ...v, [name]: value }));

	const touch = (name: K) =>
		setTouched((t) => (t[name] ? t : { ...t, [name]: true }));

	const register = (name: K) => {
		const shown = error(name);
		return {
			id: idOf(name),
			name,
			onChange: (
				e: React.ChangeEvent<
					HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
				>,
			) => {
				setValue(name, e.target.value);
				// A choice is complete the moment it's made.
				if (e.target.tagName === "SELECT") touch(name);
			},
			onBlur: () => touch(name),
			"aria-invalid": shown ? true : undefined,
			"aria-describedby": errorIdOf(name),
		};
	};

	const validateAll = () => {
		setSubmitted(true);
		const first = keys.find((k) => errorOf(k));
		if (first) document.getElementById(idOf(first))?.focus();
		return !first;
	};

	const reset = () => {
		setValues(initial);
		setTouched({});
		setSubmitted(false);
	};

	return {
		register,
		error,
		errorId: errorIdOf,
		isValid,
		setValue,
		touch,
		validateAll,
		reset,
	};
}
