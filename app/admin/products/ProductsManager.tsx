"use client";

import { useEffect, useMemo, useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Pencil, Trash2, Star } from "lucide-react";
import { ImageField } from "@/components/admin/ImageField";
import type { Product, ProductCategory, ProductSpec } from "@/data/products";
import {
	createCategory,
	updateCategory,
	deleteCategory,
	setCategoryPopular,
	saveProduct,
	deleteProduct,
	type ActionState,
} from "./actions";
import { BTN, BTN_QUIET, FIELD, FIELD_IN_PANEL, FIELD_ON_SURFACE, ICON_BTN, ICON_DANGER, LABEL, LINK_BTN, Field, Notice, Status } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { Select } from "@/components/ui/select";

const SPEC_FIELDS: { key: keyof ProductSpec; label: string }[] = [
	{ key: "chemicalName", label: "Chemical name" },
	{ key: "formula", label: "Formula" },
	{ key: "cas", label: "CAS number" },
	{ key: "appearance", label: "Appearance" },
	{ key: "purity", label: "Purity" },
	{ key: "grade", label: "Grade" },
	{ key: "solidContent", label: "Solid content" },
	{ key: "packaging", label: "Packaging" },
	{ key: "endUse", label: "End use" },
	{ key: "synonyms", label: "Synonyms" },
];

type DrawerState = { categoryId: string; product: Product | null } | null;

export function ProductsManager({ categories }: { categories: ProductCategory[] }) {
	const router = useRouter();
	const [query, setQuery] = useState("");
	const [newCatOpen, setNewCatOpen] = useState(false);
	const [editingCat, setEditingCat] = useState<string | null>(null);
	const [drawer, setDrawer] = useState<DrawerState>(null);
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<string | null>(null);

	const q = query.trim().toLowerCase();
	const filtered = useMemo(() => {
		if (!q) return categories;
		return categories
			.map((c) => ({
				...c,
				products: c.products.filter(
					(p) =>
						p.name.toLowerCase().includes(q) ||
						p.description.toLowerCase().includes(q) ||
						Object.values(p.spec).some((v) => String(v).toLowerCase().includes(q)),
				),
			}))
			.filter((c) => c.products.length > 0);
	}, [q, categories]);

	const run = (fn: () => Promise<{ ok?: boolean; error?: string }>) =>
		start(async () => {
			setMsg(null);
			const res = await fn();
			if (res.error) setMsg(res.error);
			else router.refresh();
		});

	return (
		<div>
			<div className="mb-8 flex flex-wrap items-center gap-4">
				<div className="relative min-w-48 flex-1">
					<Search size={18} aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search products"
						aria-label="Search products"
						className={`${FIELD} h-12 pl-11`}
					/>
				</div>
				<button type="button" onClick={() => setNewCatOpen((v) => !v)} aria-expanded={newCatOpen} className={BTN}>
					<Plus size={16} aria-hidden /> New category
				</button>
			</div>

			{newCatOpen && (
				<CategoryForm
					onDone={() => {
						setNewCatOpen(false);
						router.refresh();
					}}
					onCancel={() => setNewCatOpen(false)}
				/>
			)}

			{msg && <Notice tone="danger" className="mb-6">{msg}</Notice>}

			<div className="space-y-16">
				{filtered.map((cat) => (
					<section key={cat.id} aria-label={cat.name}>
						{editingCat === cat.id ? (
							<CategoryForm
								category={cat}
								onDone={() => {
									setEditingCat(null);
									router.refresh();
								}}
								onCancel={() => setEditingCat(null)}
							/>
						) : (
							<div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
								<div className="flex flex-wrap items-center gap-3">
									<h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">{cat.name}</h2>
									<span className="text-sm tabular-nums text-muted">{cat.products.length} {cat.products.length === 1 ? "product" : "products"}</span>
									{cat.popular && (
										<Status tone="warn">
											<Star size={14} aria-hidden className="fill-current" /> Popular
										</Status>
									)}
								</div>
								<div className="flex flex-wrap items-center gap-x-5 gap-y-2">
									<button
										type="button"
										disabled={pending}
										aria-pressed={Boolean(cat.popular)}
										title={cat.popular ? "Remove the Popular tag" : "Show a Popular tag on this category"}
										onClick={() => run(() => setCategoryPopular(cat.id, !cat.popular))}
										className={LINK_BTN}
									>
										<Star size={16} aria-hidden className={cat.popular ? "fill-current text-warn-ink" : ""} />
										{cat.popular ? "Remove Popular" : "Mark Popular"}
									</button>
									<button type="button" onClick={() => setDrawer({ categoryId: cat.id, product: null })} className={LINK_BTN}>
										<Plus size={16} aria-hidden /> Product
									</button>
									<button type="button" onClick={() => setEditingCat(cat.id)} className={LINK_BTN}>
										<Pencil size={16} aria-hidden /> Edit
									</button>
									<ConfirmAction
										disabled={pending}
										prompt={cat.products.length ? `Delete ${cat.name} and its ${cat.products.length === 1 ? "product" : `${cat.products.length} products`}?` : `Delete ${cat.name}?`}
										warning="They are removed from the catalogue draft, and this can't be undone. The live site changes only when you publish."
										onConfirm={() => run(() => deleteCategory(cat.id))}
									>
										<Trash2 size={16} aria-hidden /> Delete
									</ConfirmAction>
								</div>
							</div>
						)}

						<div className="-mx-3">
							{cat.products.length === 0 ? (
								<p className="px-3 py-3 text-base text-muted md:px-4">No products yet.</p>
							) : (
								<ul>
									{cat.products.map((product) => (
										<li key={product.id} className="flex items-center justify-between gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-foreground/5 md:px-4">
											<div className="flex min-w-0 items-center gap-4">
												{product.image ? (
													// eslint-disable-next-line @next/next/no-img-element
													<img src={product.image} alt="" loading="lazy" className="h-12 w-16 shrink-0 rounded-md bg-surface object-cover" />
												) : (
													<span aria-hidden title="No photo yet" className="h-12 w-16 shrink-0 rounded-md bg-surface" />
												)}
												<div className="min-w-0">
													<span className="block truncate text-base font-medium text-foreground">{product.name}</span>
													{(product.spec.cas || product.spec.purity) && (
														<span className="flex flex-wrap gap-x-4 text-sm text-muted">
															{product.spec.cas && <span>CAS <span className="tabular-nums">{product.spec.cas}</span></span>}
															{product.spec.purity && <span>Purity {product.spec.purity}</span>}
														</span>
													)}
												</div>
											</div>
											<div className="flex shrink-0 items-center gap-1">
												<button type="button" onClick={() => setDrawer({ categoryId: cat.id, product })} className={ICON_BTN} aria-label={`Edit ${product.name}`} title="Edit">
													<Pencil size={18} aria-hidden />
												</button>
												<ConfirmAction
													disabled={pending}
													prompt={`Delete ${product.name}?`}
													warning="It is removed from the catalogue draft, and this can't be undone. The live site changes only when you publish."
													ariaLabel={`Delete ${product.name}`}
													className={ICON_DANGER}
													onConfirm={() => run(() => deleteProduct(product.id))}
												>
													<Trash2 size={18} aria-hidden />
												</ConfirmAction>
											</div>
										</li>
									))}
								</ul>
							)}
						</div>
					</section>
				))}
				{filtered.length === 0 && <Notice>Nothing matches “{query}”.</Notice>}
			</div>

			{drawer && (
				<ProductDrawer
					categories={categories}
					categoryId={drawer.categoryId}
					product={drawer.product}
					onClose={() => setDrawer(null)}
					onSaved={() => {
						setDrawer(null);
						router.refresh();
					}}
				/>
			)}
		</div>
	);
}

function CategoryForm({
	category,
	onDone,
	onCancel,
}: {
	category?: ProductCategory;
	onDone: () => void;
	onCancel?: () => void;
}) {
	const action = category ? updateCategory : createCategory;
	const [state, formAction, pending] = useActionState(action, {} as ActionState);

	useEffect(() => {
		if (state.ok) onDone();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	return (
		<form action={formAction} className="mb-6 rounded-lg bg-surface p-5 md:p-6">
			{category && <input type="hidden" name="id" value={category.id} />}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<Field label="Category name">
					<input name="name" defaultValue={category?.name} required placeholder="e.g. Boiler chemicals" className={FIELD_ON_SURFACE} />
				</Field>
				<Field label="Short description">
					<input name="blurb" defaultValue={category?.blurb} className={FIELD_ON_SURFACE} />
				</Field>
			</div>
			<label className="mt-5 inline-flex cursor-pointer items-center gap-3 text-base text-foreground">
				<input type="checkbox" name="popular" defaultChecked={Boolean(category?.popular)} className="h-5 w-5 cursor-pointer accent-[var(--color-accent)]" />
				Show a Popular tag for this category
			</label>
			<div className="mt-5 flex flex-wrap items-center gap-4">
				<button type="submit" disabled={pending} className={BTN}>
					{pending ? "Saving…" : category ? "Save category" : "Add category"}
				</button>
				{onCancel && (
					<button type="button" onClick={onCancel} className={BTN_QUIET}>
						Cancel
					</button>
				)}
				{state.error && <Status tone="danger">{state.error}</Status>}
			</div>
		</form>
	);
}

function ProductDrawer({
	categories,
	categoryId,
	product,
	onClose,
	onSaved,
}: {
	categories: ProductCategory[];
	categoryId: string;
	product: Product | null;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [state, formAction, pending] = useActionState(saveProduct, {} as ActionState);
	const [imageUrl, setImageUrl] = useState(product?.image ?? "");
	const [category, setCategory] = useState(categoryId);

	useEffect(() => {
		if (state.ok) onSaved();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-1100 flex justify-end" role="dialog" aria-modal="true" aria-label={product ? "Edit product" : "New product"}>
			<div className="absolute inset-0 bg-black/60" onClick={onClose} />
			<div className="relative h-full w-full max-w-xl overflow-y-auto bg-background shadow-[0_0_80px_-20px_rgb(0_0_0/0.5)]">
				<div className="sticky top-0 z-10 flex items-center justify-between bg-background px-6 py-5 md:px-8">
					<h2 className="font-heading text-2xl font-semibold tracking-[-0.03em] text-foreground">{product ? "Edit product" : "New product"}</h2>
					<button type="button" onClick={onClose} className={ICON_BTN} aria-label="Close">
						<X size={20} aria-hidden />
					</button>
				</div>

				<form action={formAction} className="px-6 pb-10 md:px-8">
					{product && <input type="hidden" name="id" value={product.id} />}
					<input type="hidden" name="category_id" value={category} />
					<input type="hidden" name="image_url" value={imageUrl} />

					<div className="space-y-5">
						<div className="flex flex-col gap-2">
							<span className={LABEL}>Category</span>
							<Select size="md" label="Category" value={category} onChange={setCategory} options={categories.map((c) => ({ value: c.id, label: c.name }))} />
						</div>
						<Field label="Product name">
							<input name="name" defaultValue={product?.name} required placeholder="e.g. Polyaluminium Chloride" className={FIELD} />
						</Field>
						<Field label="Description">
							<textarea name="description" defaultValue={product?.description} rows={4} className={`${FIELD} resize-none`} />
						</Field>

						<div className="flex flex-col gap-2">
							<span className={LABEL}>Photo</span>
							<ImageField
								value={imageUrl}
								onChange={setImageUrl}
								bucket="product-images"
								aspect={4 / 3}
								variant="product"
								hint="JPG, PNG or WebP, up to 5 MB. You fit it to the product panel before it uploads."
							/>
						</div>
					</div>

					<h3 className="mb-4 mt-10 font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">Specifications</h3>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						{SPEC_FIELDS.map(({ key, label }) => (
							<Field key={key} label={label}>
								<input name={key} defaultValue={product?.spec[key] ?? ""} className={FIELD} />
							</Field>
						))}
					</div>

					<div className="mt-8 flex flex-wrap items-center gap-4">
						<button type="submit" disabled={pending} className={BTN}>
							{pending ? "Saving…" : product ? "Save product" : "Add product"}
						</button>
						{state.error && <Status tone="danger">{state.error}</Status>}
					</div>
				</form>
			</div>
		</div>
	);
}
