"use client";

import { useActionState } from "react";
import { updateProfile, updatePassword, type AccountState } from "./actions";

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-4 text-white text-lg font-light outline-none transition-colors placeholder:text-white/40 focus:border-accent-500";
const labelCls =
	"type-label text-white/60 block mb-1";
const btnCls =
	"type-label group mt-2 inline-flex w-fit cursor-pointer items-center gap-3 bg-cta px-8 py-4 text-white transition-colors hover:bg-cta-hover disabled:opacity-50";

function Eyebrow({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex items-center gap-3">
			<span className="h-px w-5 bg-accent-500/60" />
			<h2 className="type-label text-white/70">
				{children}
			</h2>
		</div>
	);
}

function Status({ state }: { state: AccountState }) {
	if (state.error) return <p className="text-sm text-accent-500">{state.error}</p>;
	if (state.success)
		return <p className="text-sm text-white/65">{state.success}</p>;
	return null;
}

export function AccountForms({ fullName }: { fullName: string }) {
	const [profileState, profileAction, profilePending] = useActionState(
		updateProfile,
		{} as AccountState,
	);
	const [pwState, pwAction, pwPending] = useActionState(
		updatePassword,
		{} as AccountState,
	);

	return (
		<div className="space-y-16">
			<form action={profileAction} className="flex flex-col gap-6">
				<Eyebrow>Profile</Eyebrow>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Full name</span>
					<input
						name="full_name"
						defaultValue={fullName}
						placeholder="Your name"
						className={inputCls}
					/>
				</label>
				<button type="submit" disabled={profilePending} className={btnCls}>
					{profilePending ? "Saving…" : "Save name"}
				</button>
				<Status state={profileState} />
			</form>

			<form
				action={pwAction}
				className="flex flex-col gap-6 border-t border-white/10 pt-14"
			>
				<Eyebrow>Change password</Eyebrow>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>New password</span>
					<input
						type="password"
						name="password"
						required
						autoComplete="new-password"
						placeholder="••••••••"
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Confirm password</span>
					<input
						type="password"
						name="confirm"
						required
						autoComplete="new-password"
						placeholder="••••••••"
						className={inputCls}
					/>
				</label>
				<button type="submit" disabled={pwPending} className={btnCls}>
					{pwPending ? "Updating…" : "Update password"}
				</button>
				<Status state={pwState} />
			</form>
		</div>
	);
}
