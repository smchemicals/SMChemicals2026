"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
	updateUserRole,
	deleteUser,
	resetUserPassword,
} from "./actions";
import type { Member } from "@/lib/cms/users";
import type { RoleRow } from "@/lib/cms/roles";

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
		<div className="flex flex-col gap-3 border-b border-r border-l border-white/10 px-7 py-6 first:border-t">
			<div className="flex flex-wrap items-center justify-between gap-5">
				<div className="min-w-0">
					<div className="flex items-center gap-3">
						<span className="text-white text-lg font-bold tracking-tight">
							{member.full_name?.trim() || member.email.split("@")[0]}
						</span>
						{isSelf && (
							<span className="uppercase tracking-[0.2em] text-white/30 text-[0.55rem] font-black">
								You
							</span>
						)}
					</div>
					<div className="text-white/45 text-[0.82rem] font-light tracking-wide">
						{member.email}
					</div>
				</div>
				<div className="flex items-center gap-5">
					<select
						value={member.role}
						disabled={pending || lockedRole}
						onChange={(e) =>
							start(async () => {
								const res = await updateUserRole(member.id, e.target.value);
								note(res.error ?? "Role updated", Boolean(res.error));
								router.refresh();
							})
						}
						className="cursor-pointer border border-white/15 bg-transparent px-3 py-2 text-white text-[0.7rem] font-bold uppercase tracking-[0.18em] outline-none transition-colors focus:border-accent-500 disabled:cursor-not-allowed disabled:text-white/30"
					>
						{roles.map((r) => (
							<option
								key={r.key}
								value={r.key}
								className="bg-deep normal-case"
							>
								{r.label}
							</option>
						))}
					</select>
					<button
						type="button"
						onClick={() => setShowPw((v) => !v)}
						className="cursor-pointer uppercase tracking-[0.2em] text-white/55 text-[0.62rem] font-bold transition-colors hover:text-accent-500"
					>
						Password
					</button>
					{!isSelf && (
						<button
							type="button"
							disabled={pending}
							onClick={() => {
								if (
									!window.confirm(
										`Remove ${member.email}? This permanently deletes their account.`,
									)
								)
									return;
								start(async () => {
									const res = await deleteUser(member.id);
									note(res.error ?? "Removed", Boolean(res.error));
									router.refresh();
								});
							}}
							className="cursor-pointer uppercase tracking-[0.2em] text-white/55 text-[0.62rem] font-bold transition-colors hover:text-red-400 disabled:opacity-50"
						>
							Remove
						</button>
					)}
				</div>
			</div>

			{showPw && (
				<div className="flex flex-wrap items-center gap-3 pt-1">
					<input
						type="text"
						value={pw}
						onChange={(e) => setPw(e.target.value)}
						placeholder="New password (min 8 chars)"
						className="w-64 border-b border-white/15 bg-transparent py-2 text-white text-sm font-light outline-none placeholder:text-white/20 focus:border-accent-500"
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
						className="cursor-pointer bg-accent-500 px-5 py-2 uppercase tracking-[0.2em] text-black text-[0.6rem] font-black transition-colors hover:bg-white disabled:opacity-50"
					>
						Set password
					</button>
				</div>
			)}

			{msg && (
				<span
					className={`text-[0.8rem] font-light tracking-wide ${
						msg.error ? "text-red-400" : "text-accent-500"
					}`}
				>
					{msg.text}
				</span>
			)}
		</div>
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
		<div className="flex flex-col">
			{members.map((m) => (
				<Row
					key={m.id}
					member={m}
					currentUserId={currentUserId}
					currentRole={currentRole}
					roles={roles}
				/>
			))}
		</div>
	);
}
