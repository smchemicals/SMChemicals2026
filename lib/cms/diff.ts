type J = unknown;

const IGNORE_KEYS = new Set(["created_at", "updated_at"]);
const LABEL_KEYS = ["title", "name", "label", "role", "author", "quote", "id"];
// Fields we can match array items by, so an edit reads as a value change rather
// than a remove + add. Ordered by preference.
const KEY_FIELDS = ["id", "slug", "key", "label", "name", "title", "year"];

const isObj = (v: J): v is Record<string, J> =>
	typeof v === "object" && v !== null && !Array.isArray(v);

function labelOf(o: Record<string, J>): string {
	for (const k of LABEL_KEYS) {
		const v = o[k];
		if (typeof v === "string" && v.trim())
			return v.length > 40 ? `${v.slice(0, 37)}…` : v;
	}
	return "item";
}

function shortVal(v: J): string {
	if (v === null || v === undefined) return "None";
	if (typeof v === "string")
		return v.length > 60 ? `“${v.slice(0, 57)}…”` : `“${v}”`;
	if (Array.isArray(v)) return `${v.length} item${v.length === 1 ? "" : "s"}`;
	if (typeof v === "object") {
		const parts = Object.entries(v as Record<string, J>)
			.filter(
				([k, val]) =>
					!IGNORE_KEYS.has(k) &&
					val !== null &&
					val !== undefined &&
					typeof val !== "object",
			)
			.map(([k, val]) => `${k}: ${val}`);
		return parts.length ? `{ ${parts.join(", ")} }` : "{…}";
	}
	return String(v);
}

const field = (path: string, key: string): string =>
	path ? `${path} · ${key}` : key;

// Returns a field name that uniquely identifies every item in the array, or null.
function keyField(arr: J[]): string | null {
	if (arr.length === 0 || !arr.every(isObj)) return null;
	for (const k of KEY_FIELDS) {
		const vals = arr.map((x) => (x as Record<string, J>)[k]);
		if (vals.every((v) => typeof v === "string" || typeof v === "number")) {
			const strs = vals.map(String);
			if (new Set(strs).size === strs.length) return k;
		}
	}
	return null;
}

export function deepEqual(a: J, b: J): boolean {
	if (a === b) return true;
	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		return a.every((x, i) => deepEqual(x, b[i]));
	}
	if (isObj(a) && isObj(b)) {
		const ak = Object.keys(a);
		const bk = Object.keys(b);
		if (ak.length !== bk.length) return false;
		return ak.every((k) => k in b && deepEqual(a[k], b[k]));
	}
	return false;
}

function diffArray(a: J[], b: J[], path: string, out: string[]): void {
	const ka = keyField(a);
	const kb = keyField(b);
	const key = ka && ka === kb ? ka : null;

	if (key) {
		const A = a as Record<string, J>[];
		const B = b as Record<string, J>[];
		const idOf = (x: Record<string, J>) => String(x[key]);
		const am = new Map(A.map((x) => [idOf(x), x]));
		const bm = new Map(B.map((x) => [idOf(x), x]));
		for (const x of A)
			if (!bm.has(idOf(x))) out.push(`${path}: removed “${labelOf(x)}”`);
		for (const x of B)
			if (!am.has(idOf(x))) out.push(`${path}: added “${labelOf(x)}”`);
		for (const x of B) {
			const before = am.get(idOf(x));
			if (before && !deepEqual(before, x))
				walk(before, x, `${path} · ${labelOf(x)}`, out);
		}
		const order = (arr: Record<string, J>[], other: Map<string, J>) =>
			arr
				.filter((x) => other.has(idOf(x)))
				.map(idOf)
				.join(",");
		if (order(A, bm) !== order(B, am)) out.push(`${path}: reordered`);
		return;
	}

	const enc = (v: J) => JSON.stringify(v);
	const as = new Set(a.map(enc));
	const bs = new Set(b.map(enc));
	for (const v of a)
		if (!bs.has(enc(v))) out.push(`${path}: removed ${shortVal(v)}`);
	for (const v of b)
		if (!as.has(enc(v))) out.push(`${path}: added ${shortVal(v)}`);
}

function walk(a: J, b: J, path: string, out: string[]): void {
	if (deepEqual(a, b)) return;
	if (Array.isArray(a) && Array.isArray(b)) {
		diffArray(a, b, path, out);
		return;
	}
	if (isObj(a) && isObj(b)) {
		const keys = new Set(
			[...Object.keys(a), ...Object.keys(b)].filter(
				(k) => !IGNORE_KEYS.has(k),
			),
		);
		for (const k of keys) walk(a[k], b[k], field(path, k), out);
		return;
	}
	out.push(`${path || "value"}: ${shortVal(a)} → ${shortVal(b)}`);
}

export function diffData(published: J, draft: J): string[] {
	const out: string[] = [];
	walk(published, draft, "", out);
	return out;
}
