import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { failFastFetch } from "@/lib/supabase/fail-fast";

export async function createClient() {
	const cookieStore = await cookies();
	return createServerClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
		{
			global: { fetch: failFastFetch },
			cookies: {
				getAll() {
					return cookieStore.getAll();
				},
				setAll(cookiesToSet) {
					try {
						cookiesToSet.forEach(({ name, value, options }) => {
							cookieStore.set(name, value, options);
						});
					} catch {}
				},
			},
		},
	);
}
