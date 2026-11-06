"use client";

import { useActionState, useRef } from "react";
import { verifyCode, type VerifyState } from "./actions";
import { signOut } from "../auth-actions";
import { AuthScreen, AUTH_FIELD, AUTH_LABEL } from "@/components/admin/AuthScreen";
import AuthOverlay from "@/components/admin/AuthOverlay";
import { BTN, Field, Notice } from "@/components/admin/ui";

export function VerifyForm() {
	const [state, action, pending] = useActionState(verifyCode, {} as VerifyState);
	const form = useRef<HTMLFormElement>(null);
	return (
		<AuthScreen title="Your code">
			<AuthOverlay show={pending} label="Checking your code" />
			<form ref={form} action={action} className="flex flex-col gap-6">
				<p data-in className="max-w-md text-lg leading-[1.5] text-foreground/80">
					Open your authenticator app and enter the 6 digits it shows for SM Chemicals.
				</p>
				<div data-in>
					<Field label="6-digit code" className={AUTH_LABEL}>
						<input
							name="code"
							inputMode="numeric"
							autoComplete="one-time-code"
							pattern="[0-9 ]*"
							maxLength={7}
							required
							autoFocus
							placeholder="123 456"
							// The sixth digit signs you in: no button to find. Pasting "123 456" works too.
							onChange={(e) => {
								if (!pending && e.target.value.replace(/\D/g, "").length === 6) form.current?.requestSubmit();
							}}
							className={`${AUTH_FIELD} tracking-[0.3em] tabular-nums`}
						/>
					</Field>
				</div>
				<div data-in className="flex flex-wrap items-center gap-x-6 gap-y-3">
					<button type="submit" disabled={pending} className={`${BTN} !h-14 w-full !text-lg sm:w-auto sm:!px-10`}>
						{pending ? "Checking…" : "Continue"}
					</button>
					<button type="submit" formAction={signOut} formNoValidate className="cursor-pointer rounded text-base font-medium text-foreground/75 outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-accent">
						Use a different account
					</button>
				</div>
				{state.error && <Notice tone="danger">{state.error}</Notice>}
			</form>
		</AuthScreen>
	);
}
