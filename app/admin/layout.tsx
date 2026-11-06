import type { Metadata } from "next";
import Link from "next/link";
import { getProfile, DEV_BYPASS } from "@/lib/auth";
import { signOut } from "./auth-actions";
import { AdminSidebar } from "@/components/admin/AdminNav";
import { AdminMobileMenu } from "@/components/admin/AdminMobileMenu";
import SignOutButton from "@/components/admin/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";
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
	// The rail, the top bar and the sections appear only once the second step (if any) is done; before that, just the screen.
	const inside = profile?.mfa === "ok" ? profile : null;

	return (
		<div data-surface="inverse" className="min-h-dvh bg-background text-foreground antialiased selection:bg-accent selection:text-background">
			{inside ? (
				<div className="lg:flex">
					{/* The rail: anchored to the left edge for the full height of the screen. */}
					<aside className="hidden h-dvh w-64 shrink-0 flex-col bg-surface lg:sticky lg:top-0 lg:flex">
						<Link href="/admin" className="flex h-16 shrink-0 items-center px-6 font-heading text-lg font-semibold tracking-[-0.03em] text-foreground outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent">
							SM Chemicals
						</Link>
						<div className="min-h-0 flex-1 overflow-y-auto">
							<AdminSidebar permissions={permissions} />
						</div>
						<div className="shrink-0 px-3 pb-4 pt-3">
							<div className="px-3 pb-3">
								{/* The whole address, wrapping if it has to: never cut off. */}
								<p className="text-[0.9375rem] font-medium leading-snug text-foreground [overflow-wrap:anywhere]">{inside.email}</p>
								<p className="mt-0.5 text-sm capitalize text-muted">{inside.role}</p>
							</div>
							<form action={signOut}>
								<SignOutButton variant="rail" />
							</form>
						</div>
					</aside>

					<div className="min-w-0 flex-1">
						<header className="sticky top-0 z-30 bg-background">
							<div className="flex h-16 items-center justify-between gap-4 px-6 md:px-10">
								<Link href="/admin" className="font-heading text-lg font-semibold tracking-[-0.03em] text-foreground lg:hidden">
									SM Chemicals
								</Link>
								<div className="ml-auto hidden items-center gap-8 text-sm lg:flex">
									{DEV_BYPASS && <span className="font-medium text-warn-ink">Dev mode</span>}
									<a
										href="/"
										target="_blank"
										rel="noopener noreferrer"
										className="inline-flex items-center gap-1 text-muted transition-colors hover:text-foreground"
									>
										View site
										<ArrowUpRight aria-hidden className="h-4 w-4" />
									</a>
									<ThemeToggle className="text-muted hover:text-foreground" />
								</div>
								<div className="ml-auto lg:hidden">
									<AdminMobileMenu permissions={permissions} email={inside.email} role={inside.role} />
								</div>
							</div>
						</header>
						<main>{children}</main>
					</div>
				</div>
			) : (
				<main>{children}</main>
			)}
		</div>
	);
}
