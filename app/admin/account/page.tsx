import { requireStaff, DEV_BYPASS } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/cms/products";
import { AccountForms } from "./AccountForms";
import { MfaPanel, MfaSetupFlow } from "./MfaPanel";
import { AuthScreen, AUTH_FIELD } from "@/components/admin/AuthScreen";
import { signOut } from "../auth-actions";
import SignOutButton from "@/components/admin/SignOutButton";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Account" };

export default async function AccountPage() {
	const profile = await requireStaff({ allowSetup: true });

	// Someone whose role requires two-step sign-in, and has not set it up, sees only this until they have.
	if (profile.mfa === "enroll") {
		return (
			<AuthScreen title="Secure your account">
				<p data-in className="max-w-md text-lg leading-[1.5] text-foreground/80">
					Your role needs two-step sign-in. Set it up once with an authenticator app, and you are in.
				</p>
				<div data-in>
					<MfaSetupFlow field={AUTH_FIELD} />
				</div>
				<form data-in action={signOut}>
					<SignOutButton />
				</form>
			</AuthScreen>
		);
	}

	const connected = !DEV_BYPASS && supabaseConfigured();
	let factorId: string | null = null;
	if (connected) {
		const supabase = await createClient();
		const { data } = await supabase.auth.mfa.listFactors();
		factorId = data?.totp?.[0]?.id ?? null;
	}
	const required = profile.role === "founder" || profile.role === "admin";

	return (
		<div className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Your account">
				{profile.email}, <span className="capitalize">{profile.role}</span>
			</PageHeader>

			<div className="space-y-16">
				<AccountForms fullName={profile.full_name ?? ""} />
				<MfaPanel factorId={factorId} required={required} connected={connected} />
			</div>
		</div>
	);
}
