import { requirePermission } from "@/lib/auth";
import { getCatalog, catalogTotals } from "@/lib/cms/products";
import { ProductsManager } from "./ProductsManager";
import { PageHeader } from "@/components/admin/ui";

export const metadata = { title: "Products" };

export default async function ProductsAdmin() {
	await requirePermission("products");
	const categories = await getCatalog();
	const totals = catalogTotals(categories);

	return (
		<div className="mx-auto max-w-6xl px-6 py-10 md:px-10 md:py-14">
			<PageHeader title="Products">
				<span className="tabular-nums text-foreground">{totals.categories}</span> categories and{" "}
				<span className="tabular-nums text-foreground">{totals.products}</span> products. Edits are saved as drafts until you publish.
			</PageHeader>

			<ProductsManager categories={categories} />
		</div>
	);
}
