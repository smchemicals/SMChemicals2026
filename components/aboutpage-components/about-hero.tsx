import { PageHero } from "@/components/ui/page-hero";

export function AboutHero() {
	return (
		<PageHero eyebrow="Est. 2008" title="The" titleAccent="Standards.">
			Since 2008, SM Chemicals has defined the intersection of{" "}
			<span className="font-normal text-accent">high-precision engineering</span>{" "}
			and industrial-scale supply excellence.
		</PageHero>
	);
}
