"use client";

/*
 * Last resort: the root layout itself failed, so this replaces the whole page.
 * It is deliberately self-contained, with inline styles and no imports. It must not
 * load the site stylesheet (importing it here a second time breaks the dev server's
 * CSS chunking), nor a header, footer or WebGL that could fail again.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
	return (
		<html lang="en">
			<body style={{ margin: 0, background: "#071722", color: "#ffffff", fontFamily: "system-ui, -apple-system, 'Segoe UI', sans-serif" }}>
				<main
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						minHeight: "100dvh",
						maxWidth: "48rem",
						margin: "0 auto",
						padding: "0 1.5rem",
					}}
				>
					<h1 style={{ margin: 0, fontSize: "clamp(2.5rem, 8vw, 6rem)", fontWeight: 600, lineHeight: 0.95, letterSpacing: "-0.045em" }}>
						Something went wrong.
					</h1>
					<p style={{ margin: "1.5rem 0 0", maxWidth: "28rem", fontSize: "1.125rem", lineHeight: 1.55, color: "rgba(255,255,255,0.75)" }}>
						The site couldn&rsquo;t load. Try again in a moment.
					</p>
					<button
						type="button"
						onClick={reset}
						style={{
							marginTop: "2.5rem",
							width: "fit-content",
							height: "3rem",
							padding: "0 1.5rem",
							border: 0,
							borderRadius: "0.375rem",
							background: "#ffffff",
							color: "#071722",
							fontSize: "1.0625rem",
							fontWeight: 600,
							cursor: "pointer",
						}}
					>
						Try again
					</button>
				</main>
			</body>
		</html>
	);
}
