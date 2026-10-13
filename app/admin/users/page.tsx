import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getProfiles } from "@/lib/cms/users";
import { getRoles, getPermissionsByRole } from "@/lib/cms/roles";
import { UsersManager } from "./UsersManager";
import { AdminInvite } from "./AdminInvite";
import { RolesManager } from "./RolesManager";

export const metadata = { title: "Users" };

export default async function UsersRoute() {
	const profile = await requirePermission("users");
	const [members, roles, permsByRole] = await Promise.all([
		getProfiles(),
		getRoles(),
		getPermissionsByRole(),
	]);

	return (
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-12">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">
						Users
					</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Team <span className="text-white/50 font-light">access.</span>
				</h1>
				<p className="mt-6 max-w-xl text-white/65 text-sm font-light leading-relaxed">
					Manage who can sign in. Change roles, reset passwords, or remove
					accounts.
				</p>
				{DEV_BYPASS && (
					<p className="mt-4 inline-block border border-amber-400/40 bg-amber-400/10 px-4 py-2 text-amber-300 text-xs font-medium tracking-wide">
						Dev mode — sample data. Connect Supabase to manage real users.
					</p>
				)}
			</div>

			<UsersManager
				members={members}
				currentUserId={profile.id}
				currentRole={profile.role}
				roles={roles}
			/>

			<div className="mt-16 border-t border-white/10 pt-14">
				<div className="mb-2 flex items-center gap-3">
					<span className="h-px w-5 bg-accent-500/60" />
					<span className="type-label text-white/70">
						Add a team member
					</span>
				</div>
				<p className="mb-8 text-white/65 text-sm font-light">
					They sign in with the email and password you set here.
				</p>
				<AdminInvite roles={roles} />
			</div>

			<div className="mt-16 border-t border-white/10 pt-14">
				<div className="mb-2 flex items-center gap-3">
					<span className="h-px w-5 bg-accent-500/60" />
					<span className="type-label text-white/70">
						Roles & permissions
					</span>
				</div>
				<p className="mb-8 max-w-xl text-white/65 text-sm font-light leading-relaxed">
					Create roles and choose which sections each one can access. Founder
					always has full access.
				</p>
				<RolesManager roles={roles} permsByRole={permsByRole} />
			</div>
		</div>
	);
}
