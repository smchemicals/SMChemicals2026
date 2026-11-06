import { CircleAlert, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * What a field has to say about itself: a soft pastel block with an icon, rose for something to fix and mint for
 * "that works". The tint sits quietly on the ground and the ink on it is dark enough to read (both follow the
 * theme through the surface tokens). It always reserves its height, so a message appearing or clearing while someone
 * types never shifts the form.
 */
export function FieldMessage({
	id,
	kind,
	children,
	className,
}: {
	id?: string;
	kind: "error" | "ok" | null;
	children?: React.ReactNode;
	className?: string;
}) {
	const error = kind === "error";
	const Icon = error ? CircleAlert : CircleCheck;
	return (
		<div id={id} role={error ? "alert" : "status"} aria-live={error ? "assertive" : "polite"} className={cn("mt-4 min-h-11", className)}>
			{kind && (
				<p
					className={cn(
						"inline-flex max-w-full items-start gap-2.5 rounded-md px-3.5 py-2.5 text-base font-medium leading-snug",
						error ? "bg-danger-soft text-danger-ink" : "bg-ok-soft text-ok-ink",
					)}
				>
					<Icon aria-hidden className="mt-0.5 h-[1.125em] w-[1.125em] shrink-0" strokeWidth={2.25} />
					<span>{children}</span>
				</p>
			)}
		</div>
	);
}

/* Underline colour for the step forms' big inputs: rose with an error, mint once the answer is valid. */
export const stepFieldState = (state: "error" | "ok" | null) =>
	state === "error" ? "!border-danger" : state === "ok" ? "!border-ok" : "";
