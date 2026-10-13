import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, DEV_BYPASS } from "@/lib/auth";
import { signOut } from "./auth-actions";
import { AdminNav, AdminSidebar } from "@/components/admin/AdminNav";
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
		<div data-surface="inverse" className="relative min-h-dvh bg-deep text-white antialiased [color-scheme:dark] selection:bg-accent-500 selection:text-black">
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
					<div className="flex h-16 items-center justify-between px-6 md:px-8">
						<Link href="/admin" className="group flex items-center gap-3">
							<span className="h-px w-5 bg-accent-500" />
							<span className="type-label whitespace-nowrap text-white">
								SM<span className="text-accent-500"> · </span>CMS
							</span>
						</Link>
						<div className="flex items-center gap-4 md:gap-5">
							{DEV_BYPASS && (
								<span className="type-label whitespace-nowrap border border-amber-400/40 bg-amber-400/10 px-2.5 py-1 text-amber-300">
									Dev mode
								</span>
							)}
							<a
								href="/"
								target="_blank"
								rel="noopener noreferrer"
								className="type-label group hidden sm:inline-flex items-center gap-1.5 text-white/70 transition-colors hover:text-accent-500"
							>
								View site
								<span className="transition-transform duration-300 group-hover:translate-x-0.5">
									↗
								</span>
							</a>
							<span className="hidden h-5 w-px bg-white/10 md:block" />
							<span className="hidden text-white/65 text-sm md:inline">
								{profile.email}
							</span>
							<span className="type-label hidden whitespace-nowrap border border-accent-500/30 bg-accent-500/5 px-3 py-1 text-accent-500 sm:inline-block">
								{profile.role}
							</span>
							<form action={signOut}>
								<SignOutButton />
							</form>
						</div>
					</div>
					{/* Below lg the sections sit in one scrollable row. */}
					<div className="border-t border-white/10 lg:hidden">
						<AdminNav permissions={permissions} />
					</div>
				</header>
			)}
			{profile ? (
				<div className="relative z-10 flex">
					<aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto border-r border-white/10 lg:block">
						<AdminSidebar permissions={permissions} />
					</aside>
					<main className="min-w-0 flex-1">{children}</main>
				</div>
			) : (
				<main className="relative z-10">{children}</main>
			)}
		</div>
	);
}
