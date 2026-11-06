"use client";

import { useActionState, useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { SECTIONS } from "@/lib/permissions";
import type { RoleRow } from "@/lib/cms/roles";
import {
	createRole,
	deleteRole,
	setRolePermissions,
	type RoleState,
} from "./role-actions";
import { FIELD_IN_PANEL, LABEL, BTN, Status, SaveResult } from "@/components/admin/ui";

const inputCls = FIELD_IN_PANEL;
const labelCls = LABEL;
const btnCls = BTN;

function RoleCard({
	role,
	initial,
}: {
	role: RoleRow;
	initial: string[];
}) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [sel, setSel] = useState<string[]>(initial);
	const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);

	const isFounder = role.key === "founder";
	const toggle = (section: string) =>
		setSel((p) =>
			p.includes(section) ? p.filter((s) => s !== section) : [...p, section],
		);

	return (
		<div className="rounded-xl bg-background p-5 md:p-6">
			<div className="mb-5 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{role.label}</span>
					{role.is_system && <Status tone="info">Built-in</Status>}
				</div>
				{!role.is_system && (
					<button
						type="button"
						disabled={pending}
						onClick={() => {
							if (!window.confirm(`Delete the “${role.label}” role?`)) return;
							start(async () => {
								const res = await deleteRole(role.key);
								setMsg({
									text: res.error ?? "Role deleted",
									error: Boolean(res.error),
								});
								router.refresh();
							});
						}}
						className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-md text-muted outline-none transition-colors hover:text-danger-ink focus-visible:ring-2 focus-visible:ring-accent disabled:opacity-50"
						aria-label={`Delete the ${role.label} role`}
					>
						<Trash2 size={18} aria-hidden />
					</button>
				)}
			</div>

			{isFounder ? (
				<p className="text-base text-muted">
					Founder always has full access to every section.
				</p>
			) : (
				<>
					<div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
						{SECTIONS.map((s) => (
							<label
								key={s.key}
								className="flex cursor-pointer items-center gap-3 py-1"
							>
								<input
									type="checkbox"
									checked={sel.includes(s.key)}
									onChange={() => toggle(s.key)}
									className="h-5 w-5 cursor-pointer accent-[var(--color-accent)]"
								/>
								<span className="text-base text-foreground">{s.label}</span>
							</label>
						))}
					</div>

					<div className="mt-6 flex items-center gap-4">
						<button
							type="button"
							disabled={pending}
							onClick={() =>
								start(async () => {
									const res = await setRolePermissions(role.key, sel);
									setMsg({
										text: res.error ?? "Permissions saved",
										error: Boolean(res.error),
									});
									router.refresh();
								})
							}
							className={btnCls}
						>
							{pending ? "Saving…" : "Save permissions"}
						</button>
						{msg && <Status tone={msg.error ? "danger" : "ok"}>{msg.text}</Status>}
					</div>
				</>
			)}
		</div>
	);
}

export function RolesManager({
	roles,
	permsByRole,
}: {
	roles: RoleRow[];
	permsByRole: Record<string, string[]>;
}) {
	const router = useRouter();
	const [state, action, pending] = useActionState(createRole, {} as RoleState);

	useEffect(() => {
		if (state.ok) router.refresh();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<div className="space-y-5">
			<div className="space-y-4">
				{roles.map((r) => (
					<RoleCard key={r.key} role={r} initial={permsByRole[r.key] ?? []} />
				))}
			</div>

			<form
				action={action}
				className="rounded-xl bg-background p-5 md:p-6"
			>
				<h3 className="mb-4 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">New role</h3>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className={labelCls}>Role name</span>
						<input name="label" placeholder="e.g. Author" className={inputCls} />
					</label>
					<label className="flex flex-col gap-1.5">
						<span className={labelCls}>Key (optional, from name)</span>
						<input name="key" placeholder="author" className={inputCls} />
					</label>
				</div>
				<div className="mt-6 flex items-center gap-4">
					<button type="submit" disabled={pending} className={btnCls}>
						<Plus size={16} aria-hidden /> {pending ? "Creating…" : "Create role"}
					</button>
					<SaveResult {...state} />
				</div>
			</form>
		</div>
	);
}
