"use client";

import { useActionState } from "react";
import { updateProfile, updatePassword, type AccountState } from "./actions";
import { BTN, FIELD_IN_PANEL as FIELD, Field, Panel, SaveResult } from "@/components/admin/ui";

export function AccountForms({ fullName }: { fullName: string }) {
	const [profileState, profileAction, profilePending] = useActionState(updateProfile, {} as AccountState);
	const [pwState, pwAction, pwPending] = useActionState(updatePassword, {} as AccountState);

	return (
		<div className="space-y-8">
			<form action={profileAction}>
				<Panel title="Profile">
					<div className="flex flex-col gap-6">
						<Field label="Full name">
							<input name="full_name" defaultValue={fullName} autoComplete="name" placeholder="Your name" className={FIELD} />
						</Field>
						<div className="flex flex-wrap items-center gap-4">
							<button type="submit" disabled={profilePending} className={BTN}>
								{profilePending ? "Saving…" : "Save name"}
							</button>
							<SaveResult error={profileState.error} ok={profileState.success} />
						</div>
					</div>
				</Panel>
			</form>

			<form action={pwAction}>
				<Panel title="Change password">
					<div className="flex flex-col gap-6">
						<Field label="New password" hint="At least 8 characters.">
							<input type="password" name="password" required minLength={8} autoComplete="new-password" className={FIELD} />
						</Field>
						<Field label="Confirm password">
							<input type="password" name="confirm" required minLength={8} autoComplete="new-password" className={FIELD} />
						</Field>
						<div className="flex flex-wrap items-center gap-4">
							<button type="submit" disabled={pwPending} className={BTN}>
								{pwPending ? "Updating…" : "Update password"}
							</button>
							<SaveResult error={pwState.error} ok={pwState.success} />
						</div>
					</div>
				</Panel>
			</form>
		</div>
	);
}
