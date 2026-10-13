import { requirePermission } from "@/lib/auth";
import { getCatalog, catalogTotals } from "@/lib/cms/products";
import { ProductsManager } from "./ProductsManager";

export const metadata = { title: "Products" };

export default async function ProductsAdmin() {
	await requirePermission("products");
	const categories = await getCatalog();
	const totals = catalogTotals(categories);

	return (
		<div className="mx-auto max-w-6xl px-6 py-12 md:px-10 md:py-14">
			<div className="mb-12">
				<div className="mb-5 flex items-center gap-3">
					<span className="h-px w-7 bg-accent-500" />
					<span className="type-label text-accent-500">
						Products
					</span>
				</div>
				<h1 className="text-white text-4xl md:text-5xl font-semibold tracking-tight leading-none">
					Catalog<span className="text-white/50 font-light">.</span>
				</h1>
				<p className="mt-6 text-white/65 text-sm font-light tracking-wide">
					<span className="text-white tabular-nums">{totals.categories}</span> categories
					<span className="mx-2 text-white/40">/</span>
					<span className="text-white tabular-nums">{totals.products}</span> products
				</p>
				<p className="mt-3 text-white/65 text-sm">
					Add, edit and delete categories and products. Edits are saved as
					drafts until you publish.
				</p>
			</div>

			<ProductsManager categories={categories} />
		</div>
	);
}
