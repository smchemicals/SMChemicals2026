import { requirePermission, DEV_BYPASS } from "@/lib/auth";
import { getProfiles } from "@/lib/cms/users";
import { getRoles, getPermissionsByRole } from "@/lib/cms/roles";
import { UsersManager } from "./UsersManager";
import { AdminInvite } from "./AdminInvite";
import { RolesManager } from "./RolesManager";
import { Notice, PageHeader, Panel } from "@/components/admin/ui";

export const metadata = { title: "Users" };

export default async function UsersRoute() {
	const profile = await requirePermission("users");
	const [members, roles, permsByRole] = await Promise.all([
		getProfiles(),
		getRoles(),
		getPermissionsByRole(),
	]);

	return (
		<div className="mx-auto max-w-5xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Team">Manage who can sign in. Change roles, reset passwords, or remove accounts.</PageHeader>
			{DEV_BYPASS && <Notice tone="warn" className="mb-8">Dev mode: sample data. Connect Supabase to manage real users.</Notice>}

			<UsersManager members={members} currentUserId={profile.id} currentRole={profile.role} roles={roles} />

			<Panel title="Add a team member" className="mt-20">
				<p className="-mt-3 mb-8 text-lg text-muted">They sign in with the email and password you set here.</p>
				<AdminInvite roles={roles} />
			</Panel>

			<Panel title="Roles and permissions" className="mt-20">
				<p className="-mt-3 mb-8 max-w-xl text-lg text-muted">Create roles and choose which sections each one can open. Founder always has full access.</p>
				<RolesManager roles={roles} permsByRole={permsByRole} />
			</Panel>
		</div>
	);
}
