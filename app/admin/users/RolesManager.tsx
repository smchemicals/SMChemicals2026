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

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-2.5 text-white text-sm font-light outline-none transition-colors placeholder:text-white/40 focus:border-accent-500";
const labelCls =
	"type-label text-white/60";
const btnCls =
	"type-label inline-flex items-center gap-2 bg-cta px-6 py-3 text-white transition-colors hover:bg-cta-hover disabled:opacity-50 cursor-pointer";

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
		<div className="border border-white/10 bg-white/[0.02] p-6">
			<div className="mb-5 flex items-center justify-between gap-4">
				<div className="flex items-center gap-3">
					<span className="text-white text-lg font-bold tracking-tight">
						{role.label}
					</span>
					<span className="text-white/50 text-xs font-light">/{role.key}</span>
					{role.is_system && (
						<span className="type-label border border-white/15 px-2 py-0.5 text-white/60">
							Built-in
						</span>
					)}
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
						className="text-white/60 transition-colors hover:text-red-400 disabled:opacity-50 cursor-pointer"
						aria-label="Delete role"
					>
						<Trash2 size={15} />
					</button>
				)}
			</div>

			{isFounder ? (
				<p className="text-white/60 text-xs font-light">
					Founder always has full access to every section.
				</p>
			) : (
				<>
					<div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
						{SECTIONS.map((s) => (
							<label
								key={s.key}
								className="flex cursor-pointer items-center gap-2"
							>
								<input
									type="checkbox"
									checked={sel.includes(s.key)}
									onChange={() => toggle(s.key)}
									className="h-4 w-4 accent-accent-500 cursor-pointer"
								/>
								<span className="text-white/70 text-xs font-light">
									{s.label}
								</span>
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
						{msg && (
							<span
								className={`text-xs font-light ${
									msg.error ? "text-red-400" : "text-accent-500"
								}`}
							>
								{msg.text}
							</span>
						)}
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
				className="border border-white/10 bg-white/[0.02] p-6"
			>
				<div className="mb-4 flex items-center gap-3">
					<span className="h-px w-5 bg-accent-500/60" />
					<span className="type-label text-white/75">
						New role
					</span>
				</div>
				<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
					<label className="flex flex-col gap-1.5">
						<span className={labelCls}>Role name</span>
						<input name="label" placeholder="e.g. Author" className={inputCls} />
					</label>
					<label className="flex flex-col gap-1.5">
						<span className={labelCls}>Key (optional — from name)</span>
						<input name="key" placeholder="author" className={inputCls} />
					</label>
				</div>
				<div className="mt-6 flex items-center gap-4">
					<button type="submit" disabled={pending} className={btnCls}>
						<Plus size={13} /> {pending ? "Creating…" : "Create role"}
					</button>
					{state.error && (
						<span className="text-red-400 text-xs">{state.error}</span>
					)}
					{state.ok && <span className="text-accent-500 text-xs">{state.ok}</span>}
				</div>
			</form>
		</div>
	);
}
