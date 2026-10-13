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
				className="type-label whitespace-nowrap cursor-pointer text-white/70 transition-colors hover:text-accent-500 disabled:opacity-60"
			>
				Sign out
			</button>
			<AuthOverlay show={pending} label="Signing out" />
		</>
	);
}
