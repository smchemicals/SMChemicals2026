"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
	checkLock,
	recordFailure,
	clearFailures,
	getClientIp,
} from "@/lib/security/throttle";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { logLoginAttempt } from "@/lib/security/loginLog";

export interface LoginState {
	error?: string;
}

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1).max(200),
});

function safeNext(value: FormDataEntryValue | null): string {
	const next = typeof value === "string" ? value : "";
	if (next.startsWith("/admin") && !next.startsWith("//")) return next;
	return "/admin";
}

export async function login(
	_prev: LoginState,
	formData: FormData,
): Promise<LoginState> {
	const parsed = LoginSchema.safeParse({
		email: formData.get("email"),
		password: formData.get("password"),
	});
	if (!parsed.success) {
		return { error: "Invalid email or password." };
	}
	const { email, password } = parsed.data;
	const ip = await getClientIp();

	const lockMessage = (min: number) =>
		`Account temporarily locked, too many failed sign-in attempts from your network. Try again in ${min} minute${
			min === 1 ? "" : "s"
		}.`;

	const lock = await checkLock(ip, email);
	if (lock.locked) {
		await logLoginAttempt({ email, ip, reason: "blocked_locked", success: false });
		return { error: lockMessage(lock.retryAfterMin) };
	}

	const token = formData.get("cf-turnstile-response");
	const human = await verifyTurnstile(
		typeof token === "string" ? token : null,
		ip,
	);
	if (!human.ok) {
		await logLoginAttempt({
			email,
			ip,
			reason: `captcha_failed:${human.reason ?? "unknown"}`,
			success: false,
		});
		return {
			error:
				"Couldn't sign you in, bot verification failed. Please reload and try again.",
		};
	}

	const supabase = await createClient();
	const { error } = await supabase.auth.signInWithPassword({ email, password });

	if (error) {
		await recordFailure(ip, email);
		const after = await checkLock(ip, email);
		if (after.locked) {
			await logLoginAttempt({ email, ip, reason: "locked_out", success: false });
			return { error: lockMessage(after.retryAfterMin) };
		}
		await logLoginAttempt({
			email,
			ip,
			reason: "invalid_credentials",
			success: false,
		});
		return {
			error: "Incorrect email or password. Please check and try again.",
		};
	}

	await clearFailures(ip, email);
	await logLoginAttempt({ email, ip, reason: "success", success: true });
	redirect(safeNext(formData.get("next")));
}
