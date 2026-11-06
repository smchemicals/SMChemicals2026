import { requireStaff } from "@/lib/auth";
import { AccountForms } from "./AccountForms";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Account" };

export default async function AccountPage() {
	const profile = await requireStaff();

	return (
		<div className="mx-auto max-w-2xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Your account">
				{profile.email}, <span className="capitalize">{profile.role}</span>
			</PageHeader>

			<AccountForms fullName={profile.full_name ?? ""} />
		</div>
	);
}
