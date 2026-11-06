import { readFile } from "node:fs/promises";
import { join } from "node:path";

/*
 * The hero's liquid as a still (drawn by scripts/make-og-background.mjs), for the link-preview images. The picture is
 * listed in next.config.mjs (outputFileTracingIncludes) so it ships with the routes that read it on any host.
 */
export async function ogBackground(): Promise<string> {
	const file = await readFile(join(process.cwd(), "app", "og-bg.png"));
	return `data:image/png;base64,${file.toString("base64")}`;
}

/* A scrim that keeps the white type readable over the lighter parts of the liquid. */
export const OG_SCRIM = "linear-gradient(90deg, rgba(7,23,34,0.78) 0%, rgba(7,23,34,0.45) 55%, rgba(7,23,34,0.1) 100%)";
