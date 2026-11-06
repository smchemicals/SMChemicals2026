import { writeFileSync } from "node:fs";
import { productCategories } from "../data/products";

const q = (v: string) => `'${String(v).replace(/'/g, "''")}'`;
const jsonb = (o: Record<string, unknown>) =>
	`'${JSON.stringify(o).replace(/'/g, "''")}'::jsonb`;

const lines: string[] = [
	"-- 0003 catalogue: the categories and chemicals, generated from data/products.ts by scripts/gen-products-seed.ts.",
	"-- Needs 0002. Categories are refreshed on a re-run; products are added only when the table is empty.",
	"",
];

const catRows = productCategories.map(
	(c, i) => `  (${q(c.id)}, ${q(c.name)}, ${q(c.blurb)}, ${i})`,
);
lines.push(
	"insert into public.product_categories (id, name, blurb, sort_order) values",
	catRows.join(",\n") + "",
	"on conflict (id) do update set name = excluded.name, blurb = excluded.blurb, sort_order = excluded.sort_order;",
	"",
);

const prodRows: string[] = [];
for (const c of productCategories) {
	c.products.forEach((p, i) => {
		const spec = Object.fromEntries(
			Object.entries(p.spec).filter(([, v]) => v != null && v !== ""),
		);
		prodRows.push(
			`  (${q(c.id)}, ${q(p.name)}, ${q(p.description)}, ${jsonb(spec)}, ${i})`,
		);
	});
}
lines.push(
	"-- Seed products only when the table is empty (avoids dupes on re-run).",
	"insert into public.products (category_id, name, description, spec, sort_order)",
	"select * from (values",
	prodRows.join(",\n"),
	") as v(category_id, name, description, spec, sort_order)",
	"where not exists (select 1 from public.products);",
	"",
);

// The categories that carry the Popular tag at launch (they can be changed any time in the admin).
const POPULAR = ["water-boiler", "ro", "etp", "cooling"];
lines.push(
	"-- Popular tags at launch. Only set on a fresh catalogue, so a re-run never undoes what the admin changed.",
	"update public.product_categories set popular = true",
	`  where id in (${POPULAR.map(q).join(", ")})`,
	"  and not exists (select 1 from public.product_categories where popular);",
	"",
);

const out = "supabase/migrations/0003_catalogue_seed.sql";
writeFileSync(out, lines.join("\n"));
console.log(
	`wrote ${out} — ${productCategories.length} categories, ${prodRows.length} products`,
);
