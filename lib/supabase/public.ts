import { createClient } from "@supabase/supabase-js";
import { failFastFetch } from "@/lib/supabase/fail-fast";

/*
 * The public site reads published content from Supabase on every request and falls back to the built-in defaults when
 * that fails (see fail-fast.ts for how an unreachable database is kept from stalling pages).
 */
export function createPublicClient() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			auth: { persistSession: false, autoRefreshToken: false },
			global: { fetch: failFastFetch },
		},
	);
}
