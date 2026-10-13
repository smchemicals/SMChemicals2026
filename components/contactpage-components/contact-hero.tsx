import { PageHero } from "@/components/ui/page-hero";

export function ContactHero() {
	return (
		<PageHero eyebrow="Contact Us" title="Start a" titleAccent="Conversation.">
			Questions about our products or need a{" "}
			<span className="font-normal text-accent-ink">custom solution?</span> Our
			team of experts is ready to help you find the right chemical fit.
		</PageHero>
	);
}
