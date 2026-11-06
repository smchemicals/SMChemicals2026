"use client";

import { useEffect, useRef } from "react";

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

/*
 * Domain-warped noise, tinted in the brand blues. The pointer pushes a soft
 * ripple through the field. The bottom edge fades into the page navy so the
 * hero flows straight into the next section.
 */
const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 u_res; uniform float u_time; uniform vec2 u_mouse; uniform float u_light;

float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+vec2(1,0)), f.x), mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), f.x), f.y);
}
float fbm(vec2 p){ float v = 0.0, a = 0.5; for(int i=0;i<4;i++){ v += a*noise(p); p = p*2.02 + 7.3; a *= 0.5; } return v; }

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * vec2(asp, 1.0) * 1.6;
  vec2 m = (u_mouse - 0.5) * vec2(asp, 1.0) * 1.6;
  float d = length(p - m);
  p += normalize(p - m + 1e-4) * 0.05 * exp(-d * 3.5) * sin(d * 14.0 - u_time * 1.6);

  float t = u_time * 0.05;
  vec2 q = vec2(fbm(p + t), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.0*q + vec2(1.7, 9.2) + t*1.3), fbm(p + 3.0*q + vec2(8.3, 2.8) - t*1.1));
  float f = fbm(p + 3.0*r);

  vec3 deep = vec3(0.027, 0.090, 0.133);
  vec3 blue = vec3(0.0, 0.53, 0.80);
  vec3 sky  = vec3(0.40, 0.71, 0.87);

  vec3 ice = vec3(0.933, 0.965, 0.984);
  float body = smoothstep(0.22, 0.70, f);
  float crest = smoothstep(0.50, 0.95, f * f * 1.9 + length(q) * 0.35);

  // Dark theme: navy depths, blue body, sky crests.
  vec3 colD = mix(deep, blue * 0.95, body);
  colD = mix(colD, sky, crest * 0.85);
  colD = mix(colD, deep, smoothstep(0.38, 0.0, uv.y));
  colD = mix(colD, deep, smoothstep(0.9, 0.0, uv.x) * 0.35);

  // Light theme: the same flow, drawn in ice and sky with the brand blue in the thick parts.
  vec3 colL = mix(ice, mix(sky, ice, 0.35), body * 0.9);
  colL = mix(colL, mix(blue, sky, 0.45), crest * 0.55);
  colL = mix(colL, ice, smoothstep(0.38, 0.0, uv.y));

  vec3 col = mix(colD, colL, u_light);
  gl_FragColor = vec4(col, 1.0);
}`;

export function LiquidField() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uLight = gl.getUniformLocation(prog, "u_light");

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mouse = { x: 0.7, y: 0.6, tx: 0.7, ty: 0.6 };
    let raf = 0;
    let visible = true;
    let t0 = performance.now();
    // The field is soft, so it is drawn small and at 30 frames a second, and it backs off further on a slow device: if
    // frames take too long it renders at a lower resolution until they don't. It also stops while the tab is hidden.
    let quality = 1;
    let last = 0;
    let slow = 0;
    let frames = 0;

    const resize = () => {
      // Render at reduced resolution; the field is soft so it costs nothing visually.
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * 0.55 * quality;
      canvas.width = Math.max(2, Math.floor(canvas.clientWidth * scale));
      canvas.height = Math.max(2, Math.floor(canvas.clientHeight * scale));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
    };

    const draw = (now: number) => {
      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      gl.uniform1f(uTime, (now - t0) / 1000 + 20);
      gl.uniform2f(uMouse, mouse.x, mouse.y);
      // The field follows the theme: navy in dark, ice and sky in light.
      gl.uniform1f(uLight, document.documentElement.dataset.theme === "dark" ? 0 : 1);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const loop = (now: number) => {
      if (!visible || document.hidden) {
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(loop);
      const dt = now - last;
      if (dt < 30) return; // about 30 frames a second
      last = now;
      draw(now);
      // Adapt: a run of frames over 45ms means the GPU is struggling, so draw smaller.
      if (++frames > 20 && dt > 45) slow++;
      if (frames > 20 && dt <= 45 && slow > 0) slow--;
      if (slow > 12 && quality > 0.45) {
        quality *= 0.8;
        slow = 0;
        frames = 0;
        resize();
      }
    };
    const onVisibility = () => {
      if (!document.hidden && visible && !raf && !reduce) raf = requestAnimationFrame(loop);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      mouse.tx = (e.clientX - r.left) / r.width;
      mouse.ty = 1 - (e.clientY - r.top) / r.height;
    };

    resize();
    const ro = new ResizeObserver(() => {
      resize();
      if (reduce) draw(performance.now());
    });
    ro.observe(canvas);

    if (reduce) {
      draw(performance.now());
    } else {
      window.addEventListener("pointermove", onMove, { passive: true });
      const io = new IntersectionObserver(([entry]) => {
        visible = entry.isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(loop);
      });
      io.observe(canvas);
      raf = requestAnimationFrame(loop);
      (canvas as HTMLCanvasElement & { _io?: IntersectionObserver })._io = io;
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
      (canvas as HTMLCanvasElement & { _io?: IntersectionObserver })._io?.disconnect();
      // Only release the context if the canvas is really gone. React re-runs effects
      // on the same canvas (Strict Mode, fast refresh); losing it then leaves a dead context.
      setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension("WEBGL_lose_context")?.loseContext();
      }, 0);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="absolute inset-0 h-full w-full" />;
}

