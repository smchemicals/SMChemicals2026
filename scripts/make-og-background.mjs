/*
 * Draws the hero's liquid (the same shader as components/ui/liquid-field.tsx, dark theme) once, into app/og-bg.png, for
 * the link-preview images (app/opengraph-image.tsx and friends). A link preview can't run WebGL, so it uses this still.
 * Run it again if the hero's look changes:  node scripts/make-og-background.mjs
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const W = 1200, H = 630, TIME = Number(process.env.OG_TIME ?? 31);
const fract = (x) => x - Math.floor(x);
const mix = (a, b, t) => a + (b - a) * t;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const hash = (x, y) => fract(Math.sin(x * 127.1 + y * 311.7) * 43758.5453);
function noise(x, y) {
	const ix = Math.floor(x), iy = Math.floor(y);
	let fx = x - ix, fy = y - iy;
	fx = fx * fx * (3 - 2 * fx); fy = fy * fy * (3 - 2 * fy);
	return mix(mix(hash(ix, iy), hash(ix + 1, iy), fx), mix(hash(ix, iy + 1), hash(ix + 1, iy + 1), fx), fy);
}
function fbm(x, y) {
	let v = 0, a = 0.5;
	for (let i = 0; i < 5; i++) { v += a * noise(x, y); const nx = x * 2.02 + 7.3, ny = y * 2.02 + 7.3; x = nx; y = ny; a *= 0.5; }
	return v;
}
const deep = [0.027, 0.090, 0.133], blue = [0.0, 0.53, 0.80], sky = [0.40, 0.71, 0.87];
const mix3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const asp = W / H, t = TIME * 0.05;
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
	raw[y * (W * 3 + 1)] = 0;
	for (let x = 0; x < W; x++) {
		const ux = (x + 0.5) / W, uy = 1 - (y + 0.5) / H;
		const px = (ux - 0.5) * asp * 1.6, py = (uy - 0.5) * 1.6;
		const qx = fbm(px + t, py), qy = fbm(px + 5.2 - t, py + 1.3);
		const rx = fbm(px + 3 * qx + 1.7 + t * 1.3, py + 3 * qy + 9.2), ry = fbm(px + 3 * qx + 8.3 - t * 1.1, py + 3 * qy + 2.8);
		const f = fbm(px + 3 * rx, py + 3 * ry);
		const body = smooth(0.22, 0.70, f);
		const crest = smooth(0.50, 0.95, f * f * 1.9 + Math.hypot(qx, qy) * 0.35);
		let c = mix3(deep, blue.map((v) => v * 0.95), body);
		c = mix3(c, sky, crest * 0.85);
		c = mix3(c, deep, smooth(0.38, 0.0, uy));
		c = mix3(c, deep, smooth(0.9, 0.0, ux) * 0.35);
		const o = y * (W * 3 + 1) + 1 + x * 3;
		raw[o] = Math.round(c[0] * 255); raw[o + 1] = Math.round(c[1] * 255); raw[o + 2] = Math.round(c[2] * 255);
	}
}
const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
	const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
	const body = Buffer.concat([Buffer.from(type), data]);
	const sum = Buffer.alloc(4); sum.writeUInt32BE(crc(body));
	return Buffer.concat([len, body, sum]);
};
const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4); ihdr[8] = 8; ihdr[9] = 2;
writeFileSync("app/og-bg.png", Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]));
console.log("app/og-bg.png written");
