import { ImageResponse } from "next/og";
import { getPostBySlug } from "@/lib/cms/blog";
import { OG_SCRIM, ogBackground } from "@/lib/og";

export const alt = "SM Chemicals blog";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* A preview card per post: its title over the hero's liquid. */
export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
	const { slug } = await params;
	const post = await getPostBySlug(slug).catch(() => null);
	const title = post?.title ?? "Insights & updates";
	const bg = await ogBackground();
	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					flexDirection: "column",
					justifyContent: "space-between",
					background: "#071722",
					color: "#eef6fb",
					padding: 72,
					position: "relative",
					fontFamily: "sans-serif",
				}}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img src={bg} alt="" width={1200} height={630} style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630 }} />
				<div style={{ position: "absolute", left: 0, top: 0, width: 1200, height: 630, backgroundImage: OG_SCRIM, display: "flex" }} />
				<div style={{ display: "flex", fontSize: 34, color: "#9fd3f0", position: "relative" }}>SM Chemicals · Blog</div>
				<div style={{ display: "flex", fontSize: title.length > 70 ? 60 : 76, fontWeight: 700, lineHeight: 1.08, letterSpacing: -2, position: "relative", maxWidth: 1000 }}>
					{title}
				</div>
			</div>
		),
		size,
	);
}
