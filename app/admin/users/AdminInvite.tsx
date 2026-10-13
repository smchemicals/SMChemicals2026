"use client";

import { useActionState } from "react";
import { createUser, type CreateUserState } from "./actions";
import type { RoleRow } from "@/lib/cms/roles";

const initial: CreateUserState = {};

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-3 text-white font-light outline-none transition-colors placeholder:text-white/40 focus:border-accent-500";
const labelCls =
	"type-label text-white/60";

export function AdminInvite({ roles }: { roles: RoleRow[] }) {
	const [state, action, pending] = useActionState(createUser, initial);
	const assignable = roles.filter((r) => r.key !== "founder");

	return (
		<form action={action} className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Full name</span>
					<input
						type="text"
						name="full_name"
						placeholder="First Last"
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Email</span>
					<input
						type="email"
						name="email"
						required
						placeholder="person@smchemicals.co.in"
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Role</span>
					<select
						name="role"
						defaultValue="editor"
						className={`${inputCls} cursor-pointer`}
					>
						{assignable.map((r) => (
							<option key={r.key} value={r.key} className="bg-deep">
								{r.label}
							</option>
						))}
					</select>
				</label>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Temporary password</span>
					<input
						type="text"
						name="password"
						required
						minLength={8}
						placeholder="At least 8 characters"
						className={inputCls}
					/>
				</label>
			</div>

			<button
				type="submit"
				disabled={pending}
				className="type-label group mt-2 inline-flex w-fit cursor-pointer items-center gap-3 bg-cta px-8 py-4 text-white transition-colors hover:bg-cta-hover disabled:opacity-50"
			>
				{pending ? "Creating…" : "Create user"}
				<span className="transition-transform duration-500 group-hover:translate-x-1">
					&rarr;
				</span>
			</button>

			{state.error && <p className="text-sm text-red-400">{state.error}</p>}
			{state.ok && <p className="text-sm text-accent-500">{state.ok}</p>}
		</form>
	);
}
