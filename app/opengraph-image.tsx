import { ImageResponse } from "next/og";
import { OG_SCRIM, ogBackground } from "@/lib/og";

export const alt = "SM Chemicals: Industrial chemical solutions, Hyderabad";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/* The link preview: the hero's own liquid, the brand name, the one-line promise. */
export default async function OpengraphImage() {
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
				<div style={{ display: "flex", fontSize: 40, fontWeight: 700, letterSpacing: -1, position: "relative" }}>SM Chemicals</div>
				<div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
					<div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1, letterSpacing: -3 }}>
						High-precision chemistry
					</div>
					<div style={{ display: "flex", fontSize: 92, fontWeight: 700, lineHeight: 1.05, letterSpacing: -3, color: "#65b6df" }}>
						for industry across India.
					</div>
					<div style={{ display: "flex", fontSize: 30, marginTop: 28, color: "#c3d6e3" }}>
						Water treatment, construction, textile and process chemicals.
					</div>
				</div>
			</div>
		),
		size,
	);
}
