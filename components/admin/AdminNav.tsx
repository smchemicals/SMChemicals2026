"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	LayoutGrid,
	FlaskConical,
	FileText,
	Info,
	Briefcase,
	Newspaper,
	Send,
	Activity,
	Users,
	UserRound,
	type LucideIcon,
} from "lucide-react";

type NavLink = { href: string; label: string; icon: LucideIcon };
type NavGroup = { title: string | null; links: NavLink[] };

/* Every admin section, grouped, filtered by the user's permissions. */
function useGroups(permissions: string[]): NavGroup[] {
	const can = (section: string) => permissions.includes(section);
	const pick = (links: (NavLink & { needs?: string })[]) =>
		links.filter((l) => !l.needs || can(l.needs));

	return [
		{
			title: null,
			links: [{ href: "/admin", label: "Overview", icon: LayoutGrid }],
		},
		{
			title: "Content",
			links: pick([
				{ href: "/admin/products", label: "Products", icon: FlaskConical, needs: "products" },
				{ href: "/admin/content", label: "Home & Contact", icon: FileText, needs: "content" },
				{ href: "/admin/about", label: "About", icon: Info, needs: "about" },
				{ href: "/admin/careers", label: "Careers", icon: Briefcase, needs: "careers" },
				{ href: "/admin/blog", label: "Blog", icon: Newspaper, needs: "blog" },
			]),
		},
		{
			title: "Workflow",
			links: pick([
				{ href: "/admin/publish", label: "Publish", icon: Send, needs: "publish" },
				{ href: "/admin/activity", label: "Activity", icon: Activity, needs: "activity" },
			]),
		},
		{
			title: "Team",
			links: pick([
				{ href: "/admin/users", label: "Users", icon: Users, needs: "users" },
				{ href: "/admin/account", label: "Account", icon: UserRound },
			]),
		},
	].filter((g) => g.links.length > 0);
}

function useActive() {
	const path = usePathname();
	return (href: string) =>
		href === "/admin" ? path === "/admin" : path.startsWith(href);
}

/* Desktop: a fixed left rail with grouped sections. */
export function AdminSidebar({ permissions }: { permissions: string[] }) {
	const groups = useGroups(permissions);
	const active = useActive();

	return (
		<nav aria-label="Admin" className="flex flex-col gap-7 px-4 py-8">
			{groups.map((g) => (
				<div key={g.title ?? "main"}>
					{g.title && (
						<p className="type-label mb-2 px-3 text-white/45">{g.title}</p>
					)}
					<ul className="space-y-0.5">
						{g.links.map(({ href, label, icon: Icon }) => {
							const on = active(href);
							return (
								<li key={href}>
									<Link
										href={href}
										aria-current={on ? "page" : undefined}
										className={`group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
											on
												? "bg-white/[0.07] text-white"
												: "text-white/65 hover:bg-white/[0.04] hover:text-white"
										}`}
									>
										<span
											aria-hidden
											className={`absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full bg-accent-500 transition-opacity ${
												on ? "opacity-100" : "opacity-0"
											}`}
										/>
										<Icon
											className={`h-4 w-4 shrink-0 ${on ? "text-accent-500" : "text-white/45 group-hover:text-white/80"}`}
										/>
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

/* Mobile and tablet: the same sections as one scrollable row. */
export function AdminNav({ permissions }: { permissions: string[] }) {
	const links = useGroups(permissions).flatMap((g) => g.links);
	const active = useActive();

	return (
		<nav
			aria-label="Admin"
			className="flex items-center gap-1 overflow-x-auto px-4 py-2 [scrollbar-width:none]"
		>
			{links.map(({ href, label, icon: Icon }) => {
				const on = active(href);
				return (
					<Link
						key={href}
						href={href}
						aria-current={on ? "page" : undefined}
						className={`flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors ${
							on
								? "bg-white/[0.07] text-white"
								: "text-white/65 hover:text-white"
						}`}
					>
						<Icon className={`h-3.5 w-3.5 ${on ? "text-accent-500" : "text-white/45"}`} />
						{label}
					</Link>
				);
			})}
		</nav>
	);
}
