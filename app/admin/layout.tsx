import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, DEV_BYPASS } from "@/lib/auth";
import { signOut } from "./auth-actions";
import { AdminNav, AdminSidebar } from "@/components/admin/AdminNav";
import SignOutButton from "@/components/admin/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";
import { Status } from "@/components/admin/ui";
import { ArrowUpRight } from "lucide-react";

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
		<div data-surface="inverse" className="min-h-dvh bg-background text-foreground antialiased selection:bg-accent selection:text-background">
			{profile && (
				<header className="sticky top-0 z-30 bg-background">
					<div className="flex h-16 items-center justify-between gap-4 px-6 md:px-8">
						<Link href="/admin" className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground">
							SM Chemicals
						</Link>
						<div className="flex items-center gap-4 text-sm md:gap-6">
							{DEV_BYPASS && <Status tone="warn" className="hidden sm:inline-flex">Dev mode</Status>}
							<a
								href="/"
								target="_blank"
								rel="noopener noreferrer"
								className="hidden items-center gap-1 text-muted transition-colors hover:text-foreground sm:inline-flex"
							>
								View site
								<ArrowUpRight aria-hidden className="h-4 w-4" />
							</a>
							<ThemeToggle className="text-muted hover:text-foreground" />
							<span className="hidden text-muted md:inline">{profile.email}</span>
							<Status tone="info" className="hidden capitalize sm:inline-flex">{profile.role}</Status>
							<form action={signOut}>
								<SignOutButton />
							</form>
						</div>
					</div>
					{/* Below lg the sections sit in one scrollable row. */}
					<div className="lg:hidden">
						<AdminNav permissions={permissions} />
					</div>
				</header>
			)}
			{profile ? (
				<div className="flex">
					<aside className="sticky top-16 hidden h-[calc(100dvh-4rem)] w-60 shrink-0 overflow-y-auto lg:block">
						<AdminSidebar permissions={permissions} />
					</aside>
					<main className="min-w-0 flex-1">{children}</main>
				</div>
			) : (
				<main>{children}</main>
			)}
		</div>
	);
}
