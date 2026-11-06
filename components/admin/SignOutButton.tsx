"use client";

import { LogOut } from "lucide-react";
import { useFormStatus } from "react-dom";
import AuthOverlay from "@/components/admin/AuthOverlay";

/*
 * "rail" is the full-width button at the foot of the side rail: the same pastel red as every leaving action in the admin
 * (it fills solid red when you point at it). The default is the quiet text link used in the top bar on small screens.
 */
export default function SignOutButton({ variant = "link" }: { variant?: "link" | "rail" }) {
	const { pending } = useFormStatus();
	return (
		<>
			{variant === "rail" ? (
				<button
					type="submit"
					disabled={pending}
					className="flex h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-danger-soft px-3 font-heading text-[0.9375rem] font-semibold tracking-[-0.01em] text-danger-ink outline-none transition-colors hover:bg-danger hover:text-background focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface disabled:opacity-60"
				>
					<LogOut aria-hidden size={16} />
					Sign out
				</button>
			) : (
				<button
					type="submit"
					disabled={pending}
					className="cursor-pointer whitespace-nowrap rounded text-sm font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
				>
					Sign out
				</button>
			)}
			<AuthOverlay show={pending} label="Signing out" />
		</>
	);
}
