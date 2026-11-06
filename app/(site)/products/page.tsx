import { Metadata } from "next"
import { ProductsGrid } from "@/components/productspage-components/products-grid"
import ProductsHero from "@/components/productspage-components/products-hero";
import { getPublishedCatalog } from "@/lib/cms/snapshots";

export const metadata: Metadata = {
  title: "Products",
  description: "Browse SM Chemicals' full catalogue of industrial chemicals: water treatment, ETP/STP, cooling tower, boiler, textile and construction chemicals.",
  alternates: { canonical: "/products" },
}

export default async function ProductsPage() {
	const categories = await getPublishedCatalog();
	return (
		<>
			<ProductsHero />
			<ProductsGrid categories={categories} />
		</>
	);
}