import type { ComponentProps } from "react";
import { ButtonLink, type ButtonSize } from "@/components/ui/button";

/*
 * Older names for the shared button (components/ui/button.tsx), kept so
 * existing pages keep working. They are the same button, not a second style.
 */
type Legacy = { variant?: "primary" | "outline"; size?: ButtonSize };

export function CtaButton(props: Legacy & ComponentProps<typeof ButtonLink>) {
	return <ButtonLink {...props} />;
}
