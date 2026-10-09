import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, DEV_BYPASS } from "@/lib/auth";
import { signOut } from "./auth-actions";
import { AdminNav } from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";

export const metadata: Metadata = {
	title: { template: "%s · SM Chemicals CMS", default: "SM Chemicals CMS" },
	robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const profile = await getProfile();
	const permissions = profile?.permissions ?? [];

	return (
		<div className="relative min-h-dvh bg-deep text-white antialiased selection:bg-accent-500 selection:text-black">
			<div
				className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
				style={{
					backgroundImage:
						"radial-gradient(circle at center, var(--color-accent) 1px, transparent 1px)",
					backgroundSize: "34px 34px",
				}}
			/>

			{profile && (
				<header className="sticky top-0 z-30 border-b border-white/10 bg-deep/85 backdrop-blur">
					<div className="flex items-center justify-between px-6 py-5 md:px-10">
						<div className="flex items-center gap-10">
							<Link
								href="/admin"
								className="group flex items-center gap-3"
							>
								<span className="h-px w-5 bg-accent-500" />
								<span className="uppercase tracking-[0.35em] text-white text-[0.74rem] font-black">
									SM<span className="text-accent-500"> · </span>CMS
								</span>
							</Link>
							<AdminNav permissions={permissions} />
						</div>
						<div className="flex items-center gap-5">
							{DEV_BYPASS && (
								<span className="border border-amber-400/40 bg-amber-400/10 px-3 py-1 uppercase tracking-[0.22em] text-amber-300 text-[0.58rem] font-black">
									Dev mode
								</span>
							)}
							<a
								href="/"
								target="_blank"
								rel="noopener noreferrer"
								className="group hidden sm:inline-flex items-center gap-1.5 uppercase tracking-[0.24em] text-white/55 text-[0.66rem] font-bold transition-colors hover:text-accent-500"
							>
								View site
								<span className="transition-transform duration-300 group-hover:translate-x-0.5">
									↗
								</span>
							</a>
							<span className="hidden text-white/45 text-[0.7rem] tracking-wide md:inline">
								{profile.email}
							</span>
							<span className="border border-accent-500/30 bg-accent-500/5 px-3 py-1 uppercase tracking-[0.24em] text-accent-500 text-[0.58rem] font-black">
								{profile.role}
							</span>
							<form action={signOut}>
								<SignOutButton />
							</form>
						</div>
					</div>
				</header>
			)}
			<main className="relative z-10">{children}</main>
		</div>
	);
}
