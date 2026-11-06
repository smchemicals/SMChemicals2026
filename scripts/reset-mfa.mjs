import { createClient } from "@supabase/supabase-js";

// For when the founder's phone is lost: removes the authenticator from one login, so the next sign-in sets up a new one.
// Usage: npm run reset:mfa -- <email>
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (process.argv[2] || "").trim().toLowerCase();

if (!url || !key) {
	console.error("Missing env. Need NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local");
	process.exit(1);
}
if (!email) {
	console.error("Usage: npm run reset:mfa -- <email>");
	process.exit(1);
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

const { data: list, error: listError } = await supabase.auth.admin.listUsers({ perPage: 1000 });
if (listError) {
	console.error("listUsers failed:", listError.message);
	process.exit(1);
}
const user = list.users.find((u) => u.email?.toLowerCase() === email);
if (!user) {
	console.error(`No login found for ${email}.`);
	process.exit(1);
}

const { data, error } = await supabase.auth.admin.mfa.listFactors({ userId: user.id });
if (error) {
	console.error("listFactors failed:", error.message);
	process.exit(1);
}
if (!data.factors.length) {
	console.log(`${email} has no authenticator set up. Nothing to reset.`);
	process.exit(0);
}
for (const f of data.factors) {
	const res = await supabase.auth.admin.mfa.deleteFactor({ id: f.id, userId: user.id });
	if (res.error) {
		console.error("deleteFactor failed:", res.error.message);
		process.exit(1);
	}
}
console.log(`✓ Two-step sign-in reset for ${email}. Sign in with the password, then set up a new authenticator.`);
