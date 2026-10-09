import { PageHero } from "@/components/ui/page-hero";

export default function ProductsHeader() {
	return (
		<PageHero eyebrow="Product Index" title="Chemical" titleAccent="Portfolio.">
			High-purity industrial compounds —{" "}
			<span className="font-normal text-accent">engineered for consistency</span>,
			verified for scale.
		</PageHero>
	);
}
