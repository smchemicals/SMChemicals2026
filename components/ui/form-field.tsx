import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * The message line under a field. It always reserves its height, so errors
 * appearing or clearing while someone types never shift the form.
 */
export function FieldError({
	id,
	message,
}: {
	id: string;
	message: string | null;
}) {
	return (
		<p
			id={id}
			aria-live="polite"
			className={cn(
				"mt-2 min-h-5 text-sm leading-5 text-danger transition-opacity duration-200",
				message ? "opacity-100" : "opacity-0",
			)}
		>
			{message ?? ""}
		</p>
	);
}

/* Small tick at the right of a text field once its value is valid. */
export function ValidTick({ show }: { show: boolean }) {
	return (
		<Check
			aria-hidden
			className={cn(
				"pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-accent-ink transition-all duration-300",
				show ? "scale-100 opacity-100" : "scale-50 opacity-0",
			)}
		/>
	);
}

/* Border colour for an underline input: red when it has an error. */
export const fieldState = (hasError: boolean) =>
	hasError
		? "border-danger focus:border-danger hover:border-danger"
		: "";
