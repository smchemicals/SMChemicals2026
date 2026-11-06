"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { startMfaSetup, confirmMfaSetup, removeMfa, type MfaSetup } from "./mfa-actions";
import { BTN, BTN_QUIET, FIELD_IN_PANEL as FIELD, Field, Notice, Panel, Status } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";

/* Setting up the authenticator: a QR code to scan (or the key to type), then the first code to prove it works. */
export function MfaSetupFlow({ field = FIELD }: { field?: string }) {
	const router = useRouter();
	const [setup, setSetup] = useState<MfaSetup | null>(null);
	const [code, setCode] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, start] = useTransition();

	const begin = () =>
		start(async () => {
			setError(null);
			const res = await startMfaSetup();
			if (res.error) setError(res.error);
			else setSetup(res);
		});

	const confirm = () =>
		start(async () => {
			setError(null);
			const res = await confirmMfaSetup(setup!.factorId!, code);
			if (res.error) setError(res.error);
			else router.refresh();
		});

	// Setting up also finishes on the sixth digit.
	const digits = code.replace(/\D/g, "");
	useEffect(() => {
		if (setup && digits.length === 6 && !pending) confirm();
	}, [digits]); // eslint-disable-line react-hooks/exhaustive-deps

	if (!setup) {
		return (
			<div className="space-y-4">
				<button type="button" onClick={begin} disabled={pending} className={BTN}>
					{pending ? "Starting…" : "Set up authenticator app"}
				</button>
				{error && <Notice tone="danger">{error}</Notice>}
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<ol className="space-y-5 text-base leading-[1.5] text-foreground">
				<li>
					<span className="font-semibold">1. Scan this with an authenticator app</span> such as Google Authenticator, Microsoft Authenticator, 1Password or Authy.
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img src={setup.qr} alt="QR code to add SM Chemicals to your authenticator app" width={200} height={200} className="mt-3 h-[200px] w-[200px] rounded-lg bg-white p-2" />
					<span className="mt-3 block text-sm text-muted">
						Can&apos;t scan it? Enter this key instead: <code className="select-all break-all rounded bg-surface px-1.5 py-0.5 text-foreground">{setup.secret}</code>
					</span>
				</li>
				<li>
					<span className="font-semibold">2. Enter the 6 digits it shows</span>
					<div className="mt-3 max-w-xs">
						<Field label="6-digit code">
							<input
								value={code}
								onChange={(e) => setCode(e.target.value)}
								inputMode="numeric"
								autoComplete="one-time-code"
								maxLength={7}
								placeholder="123 456"
								className={`${field} tracking-[0.3em] tabular-nums`}
							/>
						</Field>
					</div>
				</li>
			</ol>
			<div className="flex flex-wrap items-center gap-3">
				<button type="button" onClick={confirm} disabled={pending || code.replace(/\s/g, "").length !== 6} className={`${BTN} disabled:opacity-50`}>
					{pending ? "Checking…" : "Turn on two-step sign-in"}
				</button>
				<button type="button" onClick={() => { setSetup(null); setCode(""); setError(null); }} className={BTN_QUIET}>
					Start again
				</button>
			</div>
			{error && <Notice tone="danger">{error}</Notice>}
		</div>
	);
}

/* The Account page's section: whether it is on, and how to turn it on or off. */
export function MfaPanel({ factorId, required, connected }: { factorId: string | null; required: boolean; connected: boolean }) {
	const router = useRouter();
	const [error, setError] = useState<string | null>(null);
	const [pending, start] = useTransition();

	return (
		<Panel title="Two-step sign-in">
			{!connected ? (
				<p className="max-w-xl text-lg text-muted">Two-step sign-in is available once Supabase is connected.</p>
			) : factorId ? (
				<div className="space-y-5">
					<div className="flex flex-wrap items-center gap-3">
						<Status tone="ok">On</Status>
						<span className="text-base text-muted">Each sign-in also asks for a code from your authenticator app.</span>
					</div>
					<ConfirmAction
						disabled={pending}
						prompt="Turn off two-step sign-in?"
						warning={required ? "Your account will be asked to set it up again straight away, because your role requires it." : "Your account will be protected by the password alone."}
						confirmLabel="Yes, turn it off"
						onConfirm={() =>
							start(async () => {
								setError(null);
								const res = await removeMfa(factorId);
								if (res.error) setError(res.error);
								else router.refresh();
							})
						}
					>
						Turn off
					</ConfirmAction>
					{error && <Notice tone="danger">{error}</Notice>}
				</div>
			) : (
				<div className="space-y-5">
					<p className="max-w-xl text-lg text-muted">
						Protect this account with a code from an authenticator app, as well as the password.{required ? " Your role requires it." : ""}
					</p>
					<MfaSetupFlow />
				</div>
			)}
		</Panel>
	);
}
