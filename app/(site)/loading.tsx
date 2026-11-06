/*
 * Shown in place of a page while it loads. Navy like the heroes, so the header
 * keeps its light ink and nothing flashes white; one short line sweeps across.
 * No heavy graphics, since this is on screen for a moment.
 */
export default function Loading() {
	return (
		<div
			role="status"
			aria-live="polite"
			data-surface="inverse"
			className="flex min-h-svh flex-1 flex-col items-center justify-center gap-6 bg-background text-foreground"
		>
			<span className="relative block h-1 w-40 overflow-hidden rounded-full bg-foreground/15">
				<span className="load-sweep absolute inset-y-0 left-0 w-2/5 rounded-full bg-accent" />
			</span>
			<span className="text-base text-muted">Loading</span>
		</div>
	);
}
