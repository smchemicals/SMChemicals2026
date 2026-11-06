"use client";

import { useActionState, useState } from "react";
import { createUser, type CreateUserState } from "./actions";
import type { RoleRow } from "@/lib/cms/roles";
import { FIELD_IN_PANEL, LABEL, BTN, SaveResult } from "@/components/admin/ui";
import { Select } from "@/components/ui/select";

const initial: CreateUserState = {};

const inputCls = FIELD_IN_PANEL;
const labelCls = LABEL;

export function AdminInvite({ roles }: { roles: RoleRow[] }) {
	const [state, action, pending] = useActionState(createUser, initial);
	const assignable = roles.filter((r) => r.key !== "founder");
	const [role, setRole] = useState(assignable.find((r) => r.key === "editor")?.key ?? assignable[0]?.key ?? "");

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
				<div className="flex flex-col gap-2">
					<span className={labelCls} id="invite-role">Role</span>
					<input type="hidden" name="role" value={role} />
					<Select size="md" label="Role" value={role} onChange={setRole} options={assignable.map((r) => ({ value: r.key, label: r.label }))} />
				</div>
				<label className="flex flex-col gap-2">
					<span className={labelCls}>Temporary password</span>
					<input
						type="text"
						autoComplete="off"
						name="password"
						required
						minLength={8}
						placeholder="At least 8 characters"
						className={inputCls}
					/>
				</label>
			</div>

			<div className="flex flex-wrap items-center gap-4">
				<button type="submit" disabled={pending} className={BTN}>
					{pending ? "Creating…" : "Create user"}
				</button>
				<SaveResult {...state} />
			</div>
		</form>
	);
}
