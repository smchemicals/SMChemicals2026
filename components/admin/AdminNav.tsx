"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string };
type NavGroup = { title: string | null; links: NavLink[] };

/* Every admin section, grouped, filtered by the user's permissions. */
export function useGroups(permissions: string[]): NavGroup[] {
	const can = (section: string) => permissions.includes(section);
	const pick = (links: (NavLink & { needs?: string })[]) =>
		links.filter((l) => !l.needs || can(l.needs));

	return [
		{
			title: null,
			links: [{ href: "/admin", label: "Overview" }],
		},
		{
			title: "Content",
			links: pick([
				{ href: "/admin/products", label: "Products", needs: "products" },
				{ href: "/admin/content", label: "Home and contact", needs: "content" },
				{ href: "/admin/about", label: "About", needs: "about" },
				{ href: "/admin/careers", label: "Careers", needs: "careers" },
				{ href: "/admin/blog", label: "Blog", needs: "blog" },
			]),
		},
		{
			title: "Workflow",
			links: pick([
				{ href: "/admin/publish", label: "Publish", needs: "publish" },
				{ href: "/admin/analytics", label: "Analytics", needs: "activity" },
				{ href: "/admin/activity", label: "Activity", needs: "activity" },
			]),
		},
		{
			title: "Team",
			links: pick([
				{ href: "/admin/users", label: "Team", needs: "users" },
				{ href: "/admin/account", label: "Account" },
			]),
		},
	].filter((g) => g.links.length > 0);
}

export function useActive() {
	const path = usePathname();
	return (href: string) =>
		href === "/admin" ? path === "/admin" : path.startsWith(href);
}

/*
 * The rail. A solid column fixed to the left edge, full height, so it reads as part of the frame and not something floating
 * on the page. Every entry is a full-width row you can see is a target; the page you are on is filled in solid (the
 * colours swapped, like the site's own buttons), the others tint on hover. Short labels name the three groups.
 */
export function AdminSidebar({ permissions }: { permissions: string[] }) {
	const groups = useGroups(permissions);
	const active = useActive();

	return (
		<nav aria-label="Admin" className="flex flex-col gap-5 px-3 pb-4 pt-1">
			{groups.map((g, gi) => (
				<div key={gi}>
					{g.title && <p className="mb-1.5 px-3 text-sm font-medium text-muted/80">{g.title}</p>}
					<ul className="space-y-1">
						{g.links.map(({ href, label }) => {
							const on = active(href);
							return (
								<li key={href}>
									<Link
										href={href}
										aria-current={on ? "page" : undefined}
										className={`flex h-10 items-center rounded-md px-3 font-heading text-base tracking-[-0.02em] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
											on
												? "bg-foreground font-semibold text-background"
												: "font-medium text-foreground/80 hover:bg-foreground/10 hover:text-foreground"
										}`}
									>
										{label}
									</Link>
								</li>
							);
						})}
					</ul>
				</div>
			))}
		</nav>
	);
}
