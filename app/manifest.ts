import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

export default function manifest(): MetadataRoute.Manifest {
	return {
		name: SITE.name,
		short_name: SITE.name,
		description: SITE.description,
		start_url: "/",
		display: "standalone",
		background_color: "#eef6fb",
		theme_color: "#071722",
		icons: [{ src: "/icon.png", sizes: "any", type: "image/png" }],
	};
}
