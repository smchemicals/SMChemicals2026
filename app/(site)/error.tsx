"use client";

import { useEffect } from "react";
import { StatusHero } from "@/components/status-hero";
import { Button, ButtonLink } from "@/components/ui/button";

/* Shown when a page fails while rendering. The site header and footer stay in place. */
export default function ErrorPage({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error(error);
	}, [error]);

	return (
		<StatusHero
			lines={["Something", "went wrong."]}
			text="This page couldn't load. Try again in a moment. If it keeps happening, let us know through the contact page."
		>
			<Button onClick={reset} arrow="right">
				Try again
			</Button>
			<ButtonLink href="/" variant="outline" arrow="right">
				Go to homepage
			</ButtonLink>
		</StatusHero>
	);
}
