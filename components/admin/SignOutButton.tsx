"use client";

import { useFormStatus } from "react-dom";
import AuthOverlay from "@/components/admin/AuthOverlay";

export default function SignOutButton() {
	const { pending } = useFormStatus();
	return (
		<>
			<button
				type="submit"
				disabled={pending}
				className="cursor-pointer whitespace-nowrap rounded text-sm font-medium text-muted outline-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-60"
			>
				Sign out
			</button>
			<AuthOverlay show={pending} label="Signing out" />
		</>
	);
}
