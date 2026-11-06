import { gsap } from "@/lib/gsap";
import { createWordInk, type WordInk } from "@/lib/ink-word";

/*
 * The Popular tags share one liquid. Browsers allow only so many WebGL contexts, so rather than one per tag there is a
 * single hidden canvas that draws the change (the same ink as the hero's word, see lib/ink-word.ts), and each tag
 * copies the frames onto its own small 2D canvas. The tags take turns, one every few seconds, so there is only ever one
 * change in motion on the page.
 */
export type Tag = {
	root: HTMLElement; // the tag's text stack, which the canvas sits over
	canvas: HTMLCanvasElement; // this tag's own 2D canvas
	probe: HTMLElement; // zero-size box on the text baseline
	words: string[];
	at: number;
	visible: boolean;
	painted: boolean;
};

const PAD_Y = 0.35;
const PAD_X = 0.12;
const SWEEP = 1.3;
const GAP_MS = 3400;

let gl: HTMLCanvasElement | null = null;
let ink: WordInk | null = null;
let active: Tag | null = null;
const tags = new Set<Tag>();
let timer = 0;
let turn = 0;
let busy = false;

const spec = () => {
	const t = active!;
	const cs = getComputedStyle(t.root);
	return { weight: cs.fontWeight, family: cs.fontFamily, px: parseFloat(cs.fontSize), letterSpacing: parseFloat(cs.letterSpacing) || 0 };
};
const layout = () => {
	const t = active!;
	const r = t.root.getBoundingClientRect();
	const f = parseFloat(getComputedStyle(t.root).fontSize);
	const top = r.top - f * PAD_Y;
	return { width: r.width + f * PAD_X * 2, height: r.height + f * PAD_Y * 2, baseline: t.probe.getBoundingClientRect().bottom - top, left: -f * PAD_X, top: -f * PAD_Y };
};

function engine(): WordInk | null {
	if (ink) return ink;
	gl = document.createElement("canvas");
	gl.setAttribute("aria-hidden", "true");
	gl.style.cssText = "position:fixed;left:-9999px;top:0;pointer-events:none;visibility:hidden";
	document.body.appendChild(gl);
	ink = createWordInk(gl, {
		font: () => spec(),
		layout: () => {
			const l = layout();
			return { width: l.width, height: l.height, baseline: l.baseline };
		},
	});
	if (!ink) {
		gl.remove();
		gl = null;
	}
	return ink;
}

/* Put the tag's current frame on its own canvas (and place that canvas over the text). */
function copy(t: Tag) {
	if (!gl) return;
	const l = layout();
	const c = t.canvas;
	c.style.left = `${l.left}px`;
	c.style.top = `${l.top}px`;
	c.style.width = `${l.width}px`;
	c.style.height = `${l.height}px`;
	if (c.width !== gl.width || c.height !== gl.height) {
		c.width = gl.width;
		c.height = gl.height;
	}
	const ctx = c.getContext("2d");
	ctx?.clearRect(0, 0, c.width, c.height);
	ctx?.drawImage(gl, 0, 0);
}

/* Draw a tag showing one word, still. Used before and after a change, so the canvas and the page text always match. */
function still(t: Tag, word: string) {
	const e = engine();
	if (!e) return;
	active = t;
	e.setColors([1, 1, 1], [0.8, 0.93, 1]);
	e.resize();
	e.setPair(word, word);
	e.set(0);
	e.render();
	copy(t);
}

function change(t: Tag) {
	const e = engine();
	if (!e || busy) return;
	busy = true;
	const from = t.words[t.at];
	const to = t.words[(t.at + 1) % t.words.length];
	still(t, from);
	if (!t.painted) {
		t.painted = true;
		t.root.dataset.gl = "1";
		t.canvas.style.visibility = "visible";
		Array.from(t.root.querySelectorAll<HTMLElement>("[data-word]")).forEach((w) => (w.style.color = "transparent"));
	}
	// One word re-inks itself: it melts away along the front, then soaks back in. Several words melt into each other.
	const single = t.words.length === 1;
	const legs: [string, string][] = single ? [[from, ""], ["", from]] : [[from, to]];
	const tl = gsap.timeline({
		onComplete: () => {
			t.at = (t.at + 1) % t.words.length;
			still(t, t.words[t.at]);
			busy = false;
		},
	});
	legs.forEach(([a, b], n) => {
		const st = { t: 0 };
		tl.call(() => e.setPair(a, b));
		tl.to(st, {
			t: 1,
			duration: single ? SWEEP * 0.85 : SWEEP,
			ease: "power1.inOut",
			onUpdate: () => {
				active = t;
				e.set(st.t);
				e.render();
				copy(t);
			},
		}, n === 0 ? undefined : ">");
	});
}

function next() {
	timer = window.setTimeout(next, GAP_MS);
	if (document.hidden || busy) return;
	const list = Array.from(tags).filter((t) => t.visible);
	if (!list.length) return;
	change(list[turn++ % list.length]);
}

/* Register a tag; returns how to remove it. */
export function addTag(t: Tag): () => void {
	tags.add(t);
	const io = new IntersectionObserver(([e]) => (t.visible = e.isIntersecting));
	io.observe(t.root);
	if (!timer) timer = window.setTimeout(next, GAP_MS);
	return () => {
		io.disconnect();
		tags.delete(t);
		if (!tags.size) {
			window.clearTimeout(timer);
			timer = 0;
		}
	};
}
