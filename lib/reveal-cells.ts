import { gsap } from "@/lib/gsap";

/*
 * Reveal for card grids. Mark each card with `data-cell`; its contents are
 * `[data-cell-part]` children if any are marked, otherwise its direct
 * children (decorations that are `absolute` or `aria-hidden` are left alone,
 * so hover-only corners keep working).
 *
 * The cell itself, its background and the grid's hairlines never move or
 * fade, so a grid never shows as grey gaps or empty frames while it fills in.
 * Each cell has its own ScrollTrigger (not batch, which mis-fires under
 * Lenis), so every row animates as it reaches the viewport. Cells in a row
 * cascade left to right: a blue hairline sweeps the top edge (the ::before in
 * globals.css, driven by --cell-sweep), then the contents rise out of a soft
 * blur.
 *
 * Call inside useGSAP so everything is cleaned up with the component.
 */
export function revealCells(root: HTMLElement | null) {
	if (!root) return;

	const mm = gsap.matchMedia();
	mm.add("(prefers-reduced-motion: no-preference)", () => {
		const cells = gsap.utils.toArray<HTMLElement>("[data-cell]", root);

		cells.forEach((cell) => {
			const marked = cell.querySelectorAll<HTMLElement>("[data-cell-part]");
			const parts = marked.length
				? marked
				: cell.querySelectorAll<HTMLElement>(
						":scope > :not(.absolute):not([aria-hidden])",
					);

			// Column within its own grid, for the left-to-right cascade.
			const grid = cell.parentElement;
			const siblings = grid
				? Array.from(grid.children).filter((c) => c.hasAttribute("data-cell"))
				: [cell];
			const cols = grid
				? Math.max(
						1,
						getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean)
							.length,
					)
				: 1;
			const col = siblings.indexOf(cell) % cols;

			gsap.set(cell, { "--cell-sweep": 0, "--cell-sweep-o": 0 });
			gsap.set(parts, { autoAlpha: 0, y: 22, filter: "blur(6px)" });

			gsap
				.timeline({
					delay: col * 0.1,
					defaults: { ease: "expo" },
					scrollTrigger: { trigger: cell, start: "top 90%", once: true },
				})
				.set(cell, { "--cell-sweep-o": 1 })
				.to(cell, {
					"--cell-sweep": 1,
					duration: 0.8,
					ease: "power3.inOut",
				})
				.to(
					parts,
					{
						autoAlpha: 1,
						y: 0,
						filter: "blur(0px)",
						duration: 1,
						stagger: 0.08,
						clearProps: "filter",
					},
					"<0.2",
				)
				.to(cell, { "--cell-sweep-o": 0, duration: 0.8 }, "-=0.5");
		});
	});
}
