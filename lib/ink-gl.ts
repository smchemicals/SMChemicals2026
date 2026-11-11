/*
 * The ink: a navy mask that spreads from a point and covers the screen, the same
 * family of noise as the hero background. Used by the menu and by page transitions.
 * draw(p, ox, oy): p is how far it has spread (0 to 1), ox/oy the origin (0 to 1,
 * bottom-left). start()/stop() control the render loop.
 */
const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

/*
 * Ink spreading from a point (the Menu button). The same noise family as the
 * hero, used here as a growing mask instead of a backdrop: the edge breaks up
 * organically and carries a thin blue rim, the surface keeps a faint drift.
 */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res; uniform float u_time; uniform float u_p; uniform vec2 u_o; uniform float u_mode;
uniform sampler2D u_text; uniform float u_tin; uniform float u_hasText;
uniform sampler2D u_cnt; uniform sampler2D u_cntPrev; uniform vec4 u_cbox; uniform float u_hasCnt; uniform float u_cin; uniform float u_cmix;
uniform vec3 u_ground; uniform float u_dark; uniform float u_light; uniform float u_inv; uniform vec3 u_tint; uniform float u_useTint;

// A hash with no sin(). The usual one-liner, fract(sin(dot(p, k)) * 43758.5), asks sin() for huge angles, and GPUs differ a lot in
// how well they answer: on many Windows machines (Direct3D through ANGLE) the answers are coarse, and the noise turns into
// visible rectangles that follow the grid. This one uses only multiply, add and fract, which every GPU does exactly.
float hash(vec2 p){
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.02 + 7.3; a *= 0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 a = vec2(uv.x * asp, uv.y);
  vec2 o = vec2(u_o.x * asp, u_o.y);
  float maxd = length(vec2(max(o.x, asp - o.x), max(o.y, 1.0 - o.y)));
  float d = length(a - o) / maxd;

  vec2 q = vec2(fbm(a * 2.2 + u_time * 0.05), fbm(a * 2.2 + vec2(5.2, 1.3) - u_time * 0.04));
  float n = fbm(a * 2.0 + 2.5 * q);

  float edge = u_p * 1.5 - (d * 0.8 + n * 0.5);
  float cover = smoothstep(0.0, 0.03, edge);
  float rim = smoothstep(0.18, 0.0, edge) * cover;

  vec3 deep = vec3(0.027, 0.090, 0.133);
  vec3 blue = vec3(0.0, 0.53, 0.80);
  vec3 sky  = vec3(0.40, 0.71, 0.87);

  float drift = smoothstep(0.35, 0.95, fbm(a * 1.6 + q * 2.0 + u_time * 0.03));
  vec3 col = deep + blue * 0.3 * drift;
  col = mix(col, mix(blue, sky, n), rim * 0.7);
  if (u_mode > 0.5) {
    // Reveal: a light ground with a hole that grows, so the page beneath (the hero) shows through.
    vec3 ice = u_ground;
    float a = 1.0 - cover;
    float rimOut = smoothstep(-0.22, 0.0, edge) * a;
    vec3 c2 = mix(ice, mix(blue, sky, n), rimOut * 0.9);
    // On the light ground the letters are filled with deep liquid ink; on the dark ground with light.
    vec3 lightInk = vec3(0.90, 0.95, 0.98);
    // One noisy front sweeps left to right and inks everything in: the count at the left first, then the name.
    float front = u_tin * 1.7 - (uv.x * 0.9 + n * 0.5);
    float shown = smoothstep(0.0, 0.06, front);
    float glow = smoothstep(0.0, 0.18, front) * (1.0 - smoothstep(0.18, 0.4, front));
    if (u_hasText > 0.5) {
      // The name is cut out of the ground and filled with the liquid itself. It inks in from the left
      // along a noisy front, and the growing hole eats it like everything else on the ground.
      float glyph = texture2D(u_text, uv).a;
      vec3 ink = mix(deep + blue * 0.55 * drift, mix(lightInk, sky, 0.25 * drift), u_dark);
      ink = mix(ink, sky, glow * 0.6);
      c2 = mix(c2, ink, glyph * shown);
    }
    if (u_hasCnt > 0.5) {
      // The count, cut out the same way: digits in the ink, the percent sign in the brand blue.
      vec2 cu = (uv - u_cbox.xy) / (u_cbox.zw - u_cbox.xy);
      if (cu.x >= 0.0 && cu.x <= 1.0 && cu.y >= 0.0 && cu.y <= 1.0) {
        // When the number changes, the old digits bleed into the new ones along the liquid's own noise:
        // no rolling, the glyphs melt and re-form.
        vec4 t0 = texture2D(u_cntPrev, cu);
        vec4 t1 = texture2D(u_cnt, cu);
        float mm = smoothstep(0.0, 0.22, u_cmix * 1.45 - fbm(cu * vec2(9.0, 4.0) + u_time * 0.2) * 0.9);
        vec4 t = mix(t0, t1, mm);
        float seam = mm * (1.0 - mm) * 4.0;
        vec3 dInk = mix(deep + blue * 0.55 * drift, mix(lightInk, sky, 0.25 * drift), u_dark);
        vec3 pInk = mix(blue, sky, n);
        // The count has its own noisy front, slower and starting at once, so the digits visibly soak in from the left
        // (with the blue glow along the edge) and then keep rolling.
        float cf = u_cin * 1.9 - (cu.x * 0.95 + n * 0.55);
        float cshown = smoothstep(0.0, 0.08, cf);
        float cglow = smoothstep(0.0, 0.2, cf) * (1.0 - smoothstep(0.2, 0.5, cf));
        dInk = mix(dInk, sky, max(cglow * 0.75, seam * 0.7));
        c2 = mix(c2, dInk, t.r * t.a * cshown);
        c2 = mix(c2, pInk, t.g * t.a * cshown);
      }
    }
    gl_FragColor = vec4(c2 * a, a);
  } else {
    // Light theme: the same spreading ink drawn in ice and sky, with the blue along its rim.
    vec3 ice = vec3(0.933, 0.965, 0.984);
    vec3 colL = mix(ice, mix(sky, ice, 0.4), 0.45 * drift);
    colL = mix(colL, mix(blue, sky, n), rim * 0.55);
    col = mix(col, colL, u_light);
    // A tint (a button's own fill colour) replaces the palette: same spreading ink, drawn in that colour.
    if (u_useTint > 0.5) {
      vec3 tl = min(u_tint * 1.14 + 0.04, vec3(1.0));
      col = mix(u_tint * 0.92, tl, drift);
      col = mix(col, mix(u_tint, tl, n), rim * 0.6);
    }
    // Inverted: the ink is eaten away from the origin outward, so a transition only ever moves forward.
    float rimI = smoothstep(-0.2, 0.0, edge) * (1.0 - cover);
    vec3 colR = mix(col, mix(blue, sky, n), rimI * (0.55 + 0.15 * (1.0 - u_light)));
    float cv = mix(cover, 1.0 - cover, u_inv);
    col = mix(col, colR, u_inv);
    gl_FragColor = vec4(col * cv, cv);
  }
}`;


export type InkOptions = {
	/** Reveal mode only: a word cut out of the ground and filled with the liquid. */
	text?: string;
	/** CSS font family for that word. */
	font?: string;
	/** Its size in CSS pixels, read again on every resize. */
	textPx?: () => number;
	/** Reveal mode only: a rolling number cut out the same way, bottom left. */
	counter?: { px: () => number; left: () => number; bottom: () => number };
	/** The ground colour (0 to 1 rgb) and whether it is dark, so the letters flip to light ink. */
	ground?: [number, number, number];
	dark?: boolean;
};

export type Ink = {
	/** How far the word has inked in, 0 to 1. */
	setIn: (v: number, count?: number) => void;
	/** The counter's value, 0 to 100 and fractional so the digits roll. */
	setCounter: (v: number) => void;
	/** Redraw the word, e.g. once the font has loaded. */
	refreshText: () => void;
	/** Force the ink to the light (true) or dark (false) palette; null follows the page theme. */
	setTone: (light: boolean | null) => void;
	/** Inverted: draw(p) clears the ink outward from the origin instead of spreading it (0 = covered, 1 = clear). */
	setInverted: (on: boolean) => void;
	/** Draw the ink in one colour (0 to 1 rgb), e.g. a button fill; null goes back to the theme palette. */
	setTint: (rgb: [number, number, number] | null) => void;
	draw: (p: number, ox: number, oy: number) => void;
	start: () => void;
	stop: () => void;
	destroy: () => void;
};

export function createInk(canvas: HTMLCanvasElement, mode: "ink" | "reveal" = "ink", opts: InkOptions = {}): Ink | null {
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
	const uRes = gl.getUniformLocation(prog, "u_res");
	const uTime = gl.getUniformLocation(prog, "u_time");
	const uP = gl.getUniformLocation(prog, "u_p");
	const uO = gl.getUniformLocation(prog, "u_o");
	gl.uniform1f(gl.getUniformLocation(prog, "u_mode"), mode === "reveal" ? 1 : 0);
	const uTin = gl.getUniformLocation(prog, "u_tin");
	const uLight = gl.getUniformLocation(prog, "u_light");
	const uInv = gl.getUniformLocation(prog, "u_inv");
	const uTint = gl.getUniformLocation(prog, "u_tint");
	const uUseTint = gl.getUniformLocation(prog, "u_useTint");
	const uCin = gl.getUniformLocation(prog, "u_cin");
	const hasText = mode === "reveal" && !!opts.text;
	gl.uniform1f(gl.getUniformLocation(prog, "u_hasText"), hasText ? 1 : 0);
	gl.uniform1i(gl.getUniformLocation(prog, "u_text"), 0);
	gl.uniform3f(gl.getUniformLocation(prog, "u_ground"), ...(opts.ground ?? [0.933, 0.965, 0.984]));
	gl.uniform1f(gl.getUniformLocation(prog, "u_dark"), opts.dark ? 1 : 0);
	const hasCnt = mode === "reveal" && !!opts.counter;
	gl.uniform1f(gl.getUniformLocation(prog, "u_hasCnt"), hasCnt ? 1 : 0);
	gl.uniform1i(gl.getUniformLocation(prog, "u_cnt"), 1);
	const uCbox = gl.getUniformLocation(prog, "u_cbox");
	const cntTex = hasCnt ? gl.createTexture() : null;
	if (cntTex) {
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, cntTex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	}
	const cur = document.createElement("canvas");
	const prev = document.createElement("canvas");
	const prevTex = hasCnt ? gl.createTexture() : null;
	if (prevTex) {
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, prevTex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.uniform1i(gl.getUniformLocation(prog, "u_cntPrev"), 2);
	}
	const uCmix = gl.getUniformLocation(prog, "u_cmix");
	let cntN = 0;
	let cmixStart = -1e9;
	const MORPH_MS = 240;

	/* The number as a flat red/green mask: digits in fixed columns (so nothing shifts), the % after them with its own gap. */
	const drawNumber = (target: HTMLCanvasElement, n: number) => {
		if (!opts.counter) return;
		const k = canvas.width / Math.max(1, canvas.clientWidth);
		const px = opts.counter.px() * k;
		const cell = px * 1.05;
		const boxW = Math.ceil(px * 3.4);
		const boxH = Math.ceil(cell);
		target.width = boxW;
		target.height = boxH;
		const ctx = target.getContext("2d");
		if (!ctx) return;
		ctx.clearRect(0, 0, boxW, boxH);
		ctx.font = `600 ${px}px ${opts.font ?? "sans-serif"}`;
		ctx.textBaseline = "middle";
		ctx.textAlign = "center";
		ctx.fillStyle = "rgb(255,0,0)";
		const col = px * 0.64;
		let x = 0;
		for (const ch of String(Math.min(100, Math.max(0, n))).padStart(2, "0")) {
			ctx.fillText(ch, x + col / 2, cell / 2);
			x += col;
		}
		ctx.textAlign = "left";
		ctx.fillStyle = "rgb(0,255,0)";
		ctx.fillText("%", x + px * 0.08, cell / 2);
	};
	const place = () => {
		if (!opts.counter) return;
		const k = canvas.width / Math.max(1, canvas.clientWidth);
		const left = opts.counter.left() * k;
		const bottom = opts.counter.bottom() * k;
		const boxW = cur.width;
		const boxH = cur.height;
		gl.uniform4f(uCbox, left / canvas.width, bottom / canvas.height, (left + boxW) / canvas.width, (bottom + boxH) / canvas.height);
	};
	const upload = (unit: number, texture: WebGLTexture | null, source: HTMLCanvasElement) => {
		gl.activeTexture(unit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
	};
	const uploadCounter = () => {
		if (!cntTex || !prevTex || !opts.counter) return;
		drawNumber(cur, cntN);
		drawNumber(prev, cntN);
		upload(gl.TEXTURE1, cntTex, cur);
		upload(gl.TEXTURE2, prevTex, prev);
		place();
		gl.activeTexture(gl.TEXTURE0);
	};
	const tex = hasText ? gl.createTexture() : null;
	if (tex) {
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
	}
	const uploadText = () => {
		if (!tex || !opts.text) return;
		const w = canvas.width;
		const h = canvas.height;
		const c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		const ctx = c.getContext("2d");
		if (!ctx) return;
		const k = w / Math.max(1, canvas.clientWidth);
		const px = (opts.textPx?.() ?? 120) * k;
		ctx.fillStyle = "#fff";
		ctx.font = `600 ${px}px ${opts.font ?? "sans-serif"}`;
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		(ctx as CanvasRenderingContext2D & { letterSpacing?: string }).letterSpacing = `${-0.03 * px}px`;
		ctx.fillText(opts.text, w / 2, h / 2);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, tex);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c);
	};

	const state: { p: number; ox: number; oy: number; tin: number; cin: number; tone: boolean | null; inv: number; tint: [number, number, number] | null } = { p: 0, ox: 0.9, oy: 0.95, tin: 0, cin: 0, tone: null, inv: 0, tint: null };
	let raf = 0;
	const t0 = performance.now();

	const resize = () => {
		// The menu ink is a soft wash and can render small. The preloader cuts sharp letters out of the ground, so it
		// renders at (nearly) the screen's real resolution, capped to a pixel budget the GPU can hold at 60fps.
		const cw = Math.max(1, canvas.clientWidth);
		const ch = Math.max(1, canvas.clientHeight);
		const scale = hasText
			? Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3_600_000 / (cw * ch)))
			: Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(1_800_000 / (cw * ch))) * 0.7;
		canvas.width = Math.max(2, Math.floor(canvas.clientWidth * scale));
		canvas.height = Math.max(2, Math.floor(canvas.clientHeight * scale));
		gl.viewport(0, 0, canvas.width, canvas.height);
		gl.uniform2f(uRes, canvas.width, canvas.height);
		uploadText();
		uploadCounter();
	};
	const render = (now: number) => {
		gl.clearColor(0, 0, 0, 0);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.uniform1f(uTime, (now - t0) / 1000 + 12);
		gl.uniform1f(uP, state.p);
		gl.uniform2f(uO, state.ox, state.oy);
		gl.uniform1f(uTin, state.tin);
		gl.uniform1f(uInv, state.inv);
		gl.uniform1f(uUseTint, state.tint ? 1 : 0);
		if (state.tint) gl.uniform3f(uTint, state.tint[0], state.tint[1], state.tint[2]);
		// The menu ink and the page transition follow the theme.
		gl.uniform1f(uLight, state.tone === null ? (document.documentElement.dataset.theme === "dark" ? 0 : 1) : state.tone ? 1 : 0);
		gl.uniform1f(uCin, state.cin);
		gl.uniform1f(uCmix, Math.min(1, Math.max(0, (performance.now() - cmixStart) / MORPH_MS)));
		gl.drawArrays(gl.TRIANGLES, 0, 3);
	};
	const loop = (now: number) => {
		render(now);
		raf = requestAnimationFrame(loop);
	};
	resize();
	window.addEventListener("resize", resize);

	return {
		setTint: (rgb) => {
			state.tint = rgb;
		},
		setInverted: (on) => {
			state.inv = on ? 1 : 0;
		},
		setTone: (light) => {
			state.tone = light;
		},
		setCounter: (v) => {
			if (!cntTex || !prevTex) return;
			const n = Math.min(100, Math.max(0, Math.round(v)));
			if (n === cntN) return;
			// What was on screen becomes the "from" mask; the new number is the "to" mask; the morph restarts.
			prev.width = cur.width;
			prev.height = cur.height;
			prev.getContext("2d")?.drawImage(cur, 0, 0);
			upload(gl.TEXTURE2, prevTex, prev);
			cntN = n;
			drawNumber(cur, cntN);
			upload(gl.TEXTURE1, cntTex, cur);
			gl.activeTexture(gl.TEXTURE0);
			cmixStart = performance.now();
		},
		setIn: (v, count) => {
			state.tin = v;
			if (count !== undefined) state.cin = count;
		},
		refreshText: uploadText,
		draw: (p, ox, oy) => {
			state.p = p;
			state.ox = ox;
			state.oy = oy;
		},
		start: () => {
			resize();
			if (!raf) raf = requestAnimationFrame(loop);
		},
		stop: () => {
			cancelAnimationFrame(raf);
			raf = 0;
		},
		destroy: () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
			// Only release the context if the canvas is really gone. React re-runs effects
			// on the same canvas (Strict Mode, fast refresh); losing it then leaves a dead context.
			setTimeout(() => {
				if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
			}, 0);
		},
	};
}
