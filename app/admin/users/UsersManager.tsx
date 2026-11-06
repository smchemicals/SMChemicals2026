"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserRole, deleteUser, resetUserPassword, resetMemberMfa } from "./actions";
import type { Member } from "@/lib/cms/users";
import type { RoleRow } from "@/lib/cms/roles";
import { BTN, FIELD_IN_PANEL, LINK_BTN, Status } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Trash2 } from "lucide-react";
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

	const isSelf = member.id === currentUserId;
	const canEditFounder = currentRole === "founder";
	const lockedRole = isSelf || (member.role === "founder" && !canEditFounder);
	const note = (text: string, error: boolean) => setMsg({ text, error });

	return (
		<li className="flex flex-col gap-4 rounded-lg px-4 py-5 transition-colors hover:bg-foreground/5">
			<div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<span className="font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">
							{member.full_name?.trim() || member.email.split("@")[0]}
						</span>
						{isSelf && <span className="text-sm text-muted">You</span>}
					</div>
					<div className="text-sm text-muted">{member.email}</div>
				</div>
				<div className="flex flex-wrap items-center gap-x-5 gap-y-3">
					<div className={lockedRole || pending ? "pointer-events-none opacity-60" : ""}>
						<Select
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
					{!isSelf && (
						<ConfirmAction
							disabled={pending}
							prompt={`Reset two-step sign-in for ${member.email}?`}
							warning="Use this if they lost their phone. They'll set up a new authenticator the next time they sign in with their password."
							confirmLabel="Yes, reset it"
							className={LINK_BTN}
							onConfirm={() =>
								start(async () => {
									const res = await resetMemberMfa(member.id);
									note(res.error ?? "Two-step sign-in reset", Boolean(res.error));
								})
							}
						>
							Reset two-step
						</ConfirmAction>
					)}
					{!isSelf && (
						<ConfirmAction
							disabled={pending}
							prompt={`Remove ${member.email}?`}
							warning="Their account is deleted for good and they can no longer sign in."
							confirmLabel="Yes, remove"
							onConfirm={() =>
								start(async () => {
									const res = await deleteUser(member.id);
									note(res.error ?? "Removed", Boolean(res.error));
									router.refresh();
								})
							}
						>
							<Trash2 size={16} aria-hidden /> Remove
						</ConfirmAction>
					)}
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
		<section>
			<ul className="-mx-4">
				{members.map((m) => (
					<Row key={m.id} member={m} currentUserId={currentUserId} currentRole={currentRole} roles={roles} />
				))}
			</ul>
		</section>
	);
}
