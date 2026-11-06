import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { failFastFetch } from "@/lib/supabase/fail-fast";

export function createAdminClient() {
	return createSupabaseClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!,
		{
			auth: { autoRefreshToken: false, persistSession: false },
			global: { fetch: failFastFetch },
		},
	);
}
