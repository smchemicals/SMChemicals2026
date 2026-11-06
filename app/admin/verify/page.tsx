import { redirect } from "next/navigation";
import { getProfile, DEV_BYPASS } from "@/lib/auth";
import { VerifyForm } from "./VerifyForm";

export const metadata = { title: "Your code" };

export default async function VerifyPage() {
	if (DEV_BYPASS) redirect("/admin");
	const profile = await getProfile();
	if (!profile) redirect("/admin/login");
	if (profile.mfa === "ok") redirect("/admin");
	if (profile.mfa === "enroll") redirect("/admin/account");
	return <VerifyForm />;
}
