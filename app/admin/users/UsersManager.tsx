"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, deleteUser, resetUserPassword } from "./actions";
import type { Member } from "@/lib/cms/users";
import type { RoleRow } from "@/lib/cms/roles";
import { BTN, FIELD_IN_PANEL, LINK_BTN, LINK_DANGER, Status } from "@/components/admin/ui";
import { Select } from "@/components/ui/select";

function Row({
	member,
	currentUserId,
	currentRole,
	roles,
}: {
	member: Member;
	currentUserId: string;
	currentRole: string;
	roles: RoleRow[];
}) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<{ text: string; error: boolean } | null>(null);
	const [pw, setPw] = useState("");
	const [showPw, setShowPw] = useState(false);
	const [confirming, setConfirming] = useState(false);

	const isSelf = member.id === currentUserId;
	const canEditFounder = currentRole === "founder";
	const lockedRole = isSelf || (member.role === "founder" && !canEditFounder);
	const note = (text: string, error: boolean) => setMsg({ text, error });

	return (
		<li className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0">
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<span className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
							{member.full_name?.trim() || member.email.split("@")[0]}
						</span>
						{isSelf && <Status tone="info">You</Status>}
					</div>
					<div className="text-sm text-muted">{member.email}</div>
				</div>
				<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
					<div className={lockedRole || pending ? "pointer-events-none opacity-60" : ""}>
						<Select
							inPanel
							size="md"
							label={`Role for ${member.email}`}
							value={member.role}
							className="w-44"
							options={roles.map((r) => ({ value: r.key, label: r.label }))}
							onChange={(role) =>
								start(async () => {
									const res = await updateUserRole(member.id, role);
									note(res.error ?? "Role updated", Boolean(res.error));
									router.refresh();
								})
							}
						/>
					</div>
					<button type="button" onClick={() => setShowPw((v) => !v)} aria-expanded={showPw} className={LINK_BTN}>
						Password
					</button>
					{!isSelf &&
						(confirming ? (
							<span className="inline-flex items-center gap-3 text-sm text-muted">
								Delete this account?
								<button
									type="button"
									disabled={pending}
									onClick={() =>
										start(async () => {
											const res = await deleteUser(member.id);
											note(res.error ?? "Removed", Boolean(res.error));
											setConfirming(false);
											router.refresh();
										})
									}
									className={LINK_DANGER + " font-semibold text-danger-ink"}
								>
									Yes, remove
								</button>
								<button type="button" onClick={() => setConfirming(false)} className={LINK_BTN}>
									Keep
								</button>
							</span>
						) : (
							<button type="button" disabled={pending} onClick={() => setConfirming(true)} className={LINK_DANGER}>
								Remove
							</button>
						))}
				</div>
			</div>

			{showPw && (
				<div className="flex flex-wrap items-center gap-3">
					<input
						type="text"
						autoComplete="off"
						value={pw}
						onChange={(e) => setPw(e.target.value)}
						placeholder="New password, at least 8 characters"
						aria-label={`New password for ${member.email}`}
						className={`${FIELD_IN_PANEL} max-w-xs`}
					/>
					<button
						type="button"
						disabled={pending || pw.length < 8}
						onClick={() =>
							start(async () => {
								const res = await resetUserPassword(member.id, pw);
								note(res.error ?? "Password set", Boolean(res.error));
								if (!res.error) {
									setPw("");
									setShowPw(false);
								}
							})
						}
						className={BTN}
					>
						Set password
					</button>
				</div>
			)}

			{msg && <Status tone={msg.error ? "danger" : "ok"} className="w-fit">{msg.text}</Status>}
		</li>
	);
}

export function UsersManager({
	members,
	currentUserId,
	currentRole,
	roles,
}: {
	members: Member[];
	currentUserId: string;
	currentRole: string;
	roles: RoleRow[];
}) {
	return (
		<section className="rounded-xl bg-surface p-6 md:p-8">
			<ul className="divide-y divide-line">
				{members.map((m) => (
					<Row key={m.id} member={m} currentUserId={currentUserId} currentRole={currentRole} roles={roles} />
				))}
			</ul>
		</section>
	);
}
