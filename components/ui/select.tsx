"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type SelectOption = { value: string; label: string; hint?: string };

/*
 * The site's own select, in place of the browser's. The same field as the search box (a flat surface, the focus ring
 * in the accent), and a flat panel of rows beneath it: no borders, no shadows beyond a soft drop. Fully keyboard
 * driven (arrows, Home/End, type a letter to jump, Enter to choose, Escape to close) and announced as a listbox.
 */
export function Select({
	value,
	onChange,
	options,
	label,
	className,
	size = "lg",
	placeholder = "Select",
	inPanel = false,
}: {
	value: string;
	onChange: (value: string) => void;
	options: SelectOption[];
	label: string;
	className?: string;
	size?: "md" | "lg";
	placeholder?: string;
	/** Sits on a surface-coloured panel, so the field and its list use the page colour instead. */
	inPanel?: boolean;
}) {
	const id = useId();
	const root = useRef<HTMLDivElement>(null);
	const list = useRef<HTMLUListElement>(null);
	const typed = useRef({ text: "", at: 0 });
	const [open, setOpen] = useState(false);
	const selectedIndex = useMemo(() => options.findIndex((o) => o.value === value), [options, value]);
	const [active, setActive] = useState(0);
	const current = options[selectedIndex];

	const show = () => {
		setActive(Math.max(0, selectedIndex));
		setOpen(true);
	};
	const choose = (i: number) => {
		onChange(options[i].value);
		setOpen(false);
	};

	// A click anywhere else closes it.
	useEffect(() => {
		if (!open) return;
		const away = (e: PointerEvent) => {
			if (!root.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener("pointerdown", away);
		return () => document.removeEventListener("pointerdown", away);
	}, [open]);

	// Keep the active row in view.
	useEffect(() => {
		if (!open) return;
		list.current?.children[active]?.scrollIntoView({ block: "nearest" });
	}, [active, open]);

	const onKey = (e: React.KeyboardEvent) => {
		const n = options.length;
		if (e.key === "ArrowDown" || e.key === "ArrowUp") {
			e.preventDefault();
			if (!open) return show();
			setActive((i) => (e.key === "ArrowDown" ? Math.min(n - 1, i + 1) : Math.max(0, i - 1)));
		} else if (e.key === "Home" || e.key === "End") {
			if (!open) return;
			e.preventDefault();
			setActive(e.key === "Home" ? 0 : n - 1);
		} else if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			if (!open) show();
			else choose(active);
		} else if (e.key === "Escape") {
			if (open) {
				e.preventDefault();
				e.stopPropagation();
				setOpen(false);
			}
		} else if (e.key === "Tab") {
			setOpen(false);
		} else if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) {
			// Type a few letters to jump to a row.
			const t = typed.current;
			const now = performance.now();
			t.text = now - t.at > 700 ? e.key.toLowerCase() : t.text + e.key.toLowerCase();
			t.at = now;
			const hit = options.findIndex((o) => o.label.toLowerCase().startsWith(t.text));
			if (hit >= 0) {
				if (!open) show();
				setActive(hit);
			}
		}
	};

	return (
		<div ref={root} className={cn("relative", className)}>
			<button
				type="button"
				role="combobox"
				aria-label={label}
				aria-haspopup="listbox"
				aria-expanded={open}
				aria-controls={`${id}-list`}
				aria-activedescendant={open ? `${id}-${active}` : undefined}
				onClick={() => (open ? setOpen(false) : show())}
				onKeyDown={onKey}
				className={cn(
					"flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-4 text-left text-base font-semibold text-foreground outline-none ring-2 ring-transparent transition-shadow hover:ring-foreground/15 focus-visible:ring-accent",
					size === "lg" ? "h-14" : "h-12",
					inPanel ? "bg-background" : "bg-surface",
					open && "ring-accent",
				)}
			>
				<span className={cn("truncate", !current && "font-normal text-muted/70")}>{current?.label ?? placeholder}</span>
				<ChevronDown aria-hidden className={cn("h-5 w-5 shrink-0 text-muted transition-transform duration-300", open && "rotate-180")} />
			</button>
			{open && (
				<ul
					ref={list}
					id={`${id}-list`}
					role="listbox"
					aria-label={label}
					className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-72 overflow-y-auto rounded-lg bg-surface py-2 ring-1 ring-foreground/10 shadow-[0_24px_48px_-24px_rgb(0_0_0/0.35)]"
					data-lenis-prevent
				>
					{options.map((o, i) => {
						const picked = i === selectedIndex;
						return (
							<li
								key={o.value}
								id={`${id}-${i}`}
								role="option"
								aria-selected={picked}
								onPointerDown={(e) => e.preventDefault()}
								onClick={() => choose(i)}
								onMouseEnter={() => setActive(i)}
								className={cn(
									"flex cursor-pointer items-center justify-between gap-4 px-4 py-2.5 text-base transition-colors",
									i === active ? "bg-foreground/8 text-foreground" : "text-muted",
									picked && "font-semibold text-foreground",
								)}
							>
								<span className="truncate">{o.label}</span>
								{picked ? <Check aria-hidden className="h-4 w-4 shrink-0 text-accent-ink" strokeWidth={2.5} /> : o.hint ? <span className="shrink-0 text-sm text-muted/70">{o.hint}</span> : null}
							</li>
						);
					})}
				</ul>
			)}
		</div>
	);
}
