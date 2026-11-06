/*
 * One word turning into another through the site's liquid. The same family of noise as the preloader, the menu and
 * the page transition: a noisy front sweeps along the word from the left; behind it the new word has soaked in,
 * ahead of it the old word is still there, and where the two overlap the letters melt into each other and pick up
 * the glow of the ink's edge. The front also pushes the letters about a little as it passes, so the edge is liquid
 * rather than a wipe. Everything is drawn in WebGL, so the word at rest is drawn by the same code and nothing pops
 * between rest and motion.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res; uniform float u_time; uniform float u_t; uniform float u_w; uniform float u_amp;
uniform sampler2D u_a; uniform sampler2D u_b; uniform vec3 u_col; uniform vec3 u_glow;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.02 + 7.3; a *= 0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 a = vec2(uv.x * asp, uv.y);
  vec2 q = vec2(fbm(a * 1.6 + u_time * 0.05), fbm(a * 1.6 + vec2(5.2, 1.3) - u_time * 0.04));
  float n = fbm(a * 1.4 + 2.2 * q);

  // The front travels along the word (x is measured against the longer of the two words, so it never idles).
  float x = clamp(uv.x / u_w, 0.0, 1.0);
  float front = u_t * 2.15 - (x * 0.95 + n * 0.6);
  float band = smoothstep(0.0, 0.2, front) * (1.0 - smoothstep(0.2, 0.5, front));

  // In the band the letters are pushed along the liquid's own flow, then settle.
  vec2 push = (q - 0.5) * 2.0 * band * u_amp / u_res;
  vec2 s = uv + push;
  float ga = texture2D(u_a, s).a;
  float gb = texture2D(u_b, s).a;

  float inB = smoothstep(0.0, 0.08, front);
  float outA = 1.0 - smoothstep(0.1, 0.24, front);
  float alpha = max(ga * outA, gb * inB);

  // The word is its own colour, lit by the ink's edge as the front passes.
  vec3 col = mix(u_col, u_glow, band * 0.65);
  gl_FragColor = vec4(col * alpha, alpha);
}`;

export type WordInk = {
	/** The word that is there and the word that comes next (the same word for a word at rest). */
	setPair: (from: string, to: string) => void;
	/** How far the change has gone, 0 to 1. */
	set: (t: number) => void;
	setColors: (word: [number, number, number], glow: [number, number, number]) => void;
	/** Draw one frame now. */
	render: () => void;
	/** Redraw the textures and size, e.g. once fonts have loaded or the layout changed. */
	resize: () => void;
	destroy: () => void;
};

export type WordInkOptions = {
	/** The font shorthand without the size, e.g. "600", and the family, read from the page. */
	font: () => { weight: string; family: string; px: number; letterSpacing: number };
	/** Where the letters sit: the box of the canvas in CSS pixels and the baseline's distance from its top. */
	layout: () => { width: number; height: number; baseline: number };
};

export function createWordInk(canvas: HTMLCanvasElement, opts: WordInkOptions): WordInk | null {
	const gl = canvas.getContext("webgl", { antialias: false, alpha: true, premultipliedAlpha: true });
	if (!gl) return null;
	const compile = (type: number, src: string) => {
		const sh = gl.createShader(type)!;
		gl.shaderSource(sh, src);
		gl.compileShader(sh);
		return sh;
	};
	const prog = gl.createProgram()!;
	gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
	gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
	gl.linkProgram(prog);
	if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
	gl.useProgram(prog);
	const buf = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buf);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
	const loc = gl.getAttribLocation(prog, "p");
	gl.enableVertexAttribArray(loc);
	gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
	const U = (n: string) => gl.getUniformLocation(prog, n);
	const uRes = U("u_res"), uTime = U("u_time"), uT = U("u_t"), uW = U("u_w"), uAmp = U("u_amp"), uCol = U("u_col"), uGlow = U("u_glow");
	gl.uniform1i(U("u_a"), 0);
	gl.uniform1i(U("u_b"), 1);

	const mk = (unit: number) => {
		const t = gl.createTexture();
		gl.activeTexture(unit);
		gl.bindTexture(gl.TEXTURE_2D, t);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		return t;
	};
	const texA = mk(gl.TEXTURE0);
	const texB = mk(gl.TEXTURE1);

	const state = {
		from: "",
		to: "",
		t: 0,
		col: [1, 1, 1] as [number, number, number],
		glow: [1, 1, 1] as [number, number, number],
		wFrac: 1,
	};
	const t0 = performance.now();
	const scratch = document.createElement("canvas");

	const textMask = (text: string, unit: number, texture: WebGLTexture | null) => {
		const w = canvas.width;
		const h = canvas.height;
		scratch.width = w;
		scratch.height = h;
		const ctx = scratch.getContext("2d");
		if (!ctx) return 0;
		ctx.clearRect(0, 0, w, h);
		const k = w / Math.max(1, canvas.clientWidth);
		const f = opts.font();
		const lay = opts.layout();
		ctx.fillStyle = "#fff";
		ctx.font = `${f.weight} ${f.px * k}px ${f.family}`;
		ctx.textAlign = "left";
		ctx.textBaseline = "alphabetic";
		(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${f.letterSpacing * k}px`;
		ctx.fillText(text, 0, lay.baseline * k);
		gl.activeTexture(unit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, scratch);
		return ctx.measureText(text).width / w;
	};

	const upload = () => {
		const wa = textMask(state.from, gl.TEXTURE0, texA);
		const wb = textMask(state.to, gl.TEXTURE1, texB);
		state.wFrac = Math.max(0.05, wa, wb);
	};

	const render = () => {
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform1f(uTime, (performance.now() - t0) / 1000 + 12);
		gl.uniform1f(uT, state.t);
		gl.uniform1f(uW, state.wFrac);
		// How far the letters are pushed by the front: a touch, capped, so big letters (a hero word, "404") stay whole letters.
		gl.uniform1f(uAmp, Math.min(opts.font().px * 0.05, 5) * (canvas.width / Math.max(1, canvas.clientWidth)));
		gl.uniform3f(uCol, ...state.col);
		gl.uniform3f(uGlow, ...state.glow);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};

	const resize = () => {
		const lay = opts.layout();
		const dpr = Math.min(window.devicePixelRatio || 1, 2);
		canvas.style.width = `${lay.width}px`;
		canvas.style.height = `${lay.height}px`;
		canvas.width = Math.max(2, Math.round(lay.width * dpr));
		canvas.height = Math.max(2, Math.round(lay.height * dpr));
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.uniform2f(uRes, canvas.width, canvas.height);
		upload();
		render();
	};

	return {
		setPair: (from, to) => {
			state.from = from;
			state.to = to;
			upload();
		},
		set: (t) => {
			state.t = t;
		},
		setColors: (word, glow) => {
			state.col = word;
			state.glow = glow;
		},
		render,
		resize,
		destroy: () => {
			setTimeout(() => {
				if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
			}, 0);
		},
	};
}

/*
 * Resolves once the exact face the canvas will draw with is loaded. "fonts.ready" alone is not enough: it can resolve
 * before a weight that nothing on the page has used yet has been fetched, and a canvas drawing with an unloaded
 * weight silently uses a fallback (thin, wrong letters) until the next redraw.
 */
export async function fontReady(el: Element, text: string): Promise<void> {
	try {
		const cs = getComputedStyle(el);
		await document.fonts?.load(`${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`, text);
		await document.fonts?.ready;
	} catch {}
}
