"use client";

import { useEffect, useMemo, useState, useActionState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, X, Pencil, Trash2, Upload } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Product, ProductCategory, ProductSpec } from "@/data/products";
import {
	createCategory,
	updateCategory,
	deleteCategory,
	saveProduct,
	deleteProduct,
	type ActionState,
} from "./actions";

const SPEC_FIELDS: { key: keyof ProductSpec; label: string }[] = [
	{ key: "chemicalName", label: "Chemical Name" },
	{ key: "formula", label: "Formula" },
	{ key: "cas", label: "CAS No." },
	{ key: "appearance", label: "Appearance" },
	{ key: "purity", label: "Purity" },
	{ key: "grade", label: "Grade" },
	{ key: "solidContent", label: "Solid Content" },
	{ key: "packaging", label: "Packaging" },
	{ key: "endUse", label: "End Use" },
	{ key: "synonyms", label: "Synonyms" },
];

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-2.5 text-white text-sm font-light outline-none transition-colors placeholder:text-white/20 focus:border-accent-500";
const labelCls =
	"uppercase tracking-[0.25em] text-white/40 text-[0.55rem] font-black";
const btnPrimary =
	"inline-flex items-center gap-2 bg-accent-500 px-6 py-3 uppercase tracking-[0.25em] text-black text-[0.62rem] font-black transition-colors hover:bg-white disabled:opacity-50 cursor-pointer";
const btnGhost =
	"inline-flex items-center gap-1.5 uppercase tracking-[0.2em] text-white/55 text-[0.6rem] font-bold transition-colors hover:text-white cursor-pointer";

type DrawerState = { categoryId: string; product: Product | null } | null;

export function ProductsManager({
	categories,
}: {
	categories: ProductCategory[];
}) {
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
						Object.values(p.spec).some((v) =>
							String(v).toLowerCase().includes(q),
						),
				),
			}))
			.filter((c) => c.products.length > 0);
	}, [q, categories]);

	const remove = (run: () => Promise<{ ok?: boolean; error?: string }>) =>
		start(async () => {
			setMsg(null);
			const res = await run();
			if (res.error) setMsg(res.error);
			else router.refresh();
		});

	return (
		<div>
			<div className="mb-8 flex flex-wrap items-center gap-4">
				<div className="relative flex-1 min-w-[12rem]">
					<Search
						size={15}
						className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-white/30"
					/>
					<input
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search catalog…"
						className="w-full border-b border-white/15 bg-transparent py-2.5 pl-6 text-white text-sm font-light outline-none placeholder:text-white/25 focus:border-accent-500"
					/>
				</div>
				<button onClick={() => setNewCatOpen((v) => !v)} className={btnPrimary}>
					<Plus size={14} /> New category
				</button>
			</div>

			{newCatOpen && (
				<CategoryForm
					onDone={() => {
						setNewCatOpen(false);
						router.refresh();
					}}
				/>
			)}

			{msg && (
				<p className="mb-6 border border-red-400/30 bg-red-400/5 px-4 py-2 text-red-400 text-xs">
					{msg}
				</p>
			)}

			<div className="space-y-12">
				{filtered.map((cat) => (
					<section key={cat.id}>
						<div className="mb-4 border-b border-white/10 pb-3">
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
								<div className="flex items-center justify-between gap-4">
									<div className="flex items-baseline gap-3">
										<h2 className="uppercase tracking-[0.2em] text-white text-sm font-black">
											{cat.name}
										</h2>
										<span className="text-white/30 text-[0.6rem] font-bold tabular-nums">
											{String(cat.products.length).padStart(2, "0")}
										</span>
									</div>
									<div className="flex items-center gap-4">
										<button
											onClick={() => setDrawer({ categoryId: cat.id, product: null })}
											className={btnGhost}
										>
											<Plus size={13} /> Product
										</button>
										<button onClick={() => setEditingCat(cat.id)} className={btnGhost}>
											<Pencil size={12} /> Edit
										</button>
										<button
											disabled={pending}
											onClick={() => {
												if (
													window.confirm(
														`Delete category “${cat.name}” and its ${cat.products.length} products?`,
													)
												)
													remove(() => deleteCategory(cat.id));
											}}
											className="inline-flex items-center gap-1.5 uppercase tracking-[0.2em] text-white/45 text-[0.6rem] font-bold transition-colors hover:text-red-400 cursor-pointer disabled:opacity-50"
										>
											<Trash2 size={12} /> Delete
										</button>
									</div>
								</div>
							)}
						</div>

						<div className="border-t border-l border-white/10">
							{cat.products.map((product) => (
								<div
									key={product.id}
									className="group flex items-center justify-between gap-4 border-b border-r border-white/10 px-6 py-4"
								>
									<div className="min-w-0">
										<span className="block uppercase tracking-[0.12em] text-white text-sm font-bold truncate">
											{product.name}
										</span>
										<span className="mt-0.5 flex flex-wrap gap-x-4 text-white/40 text-[0.68rem] font-light">
											{product.spec.cas && (
												<span>
													CAS{" "}
													<span className="text-white/65 tabular-nums">
														{product.spec.cas}
													</span>
												</span>
											)}
											{product.spec.purity && (
												<span>
													Purity{" "}
													<span className="text-white/65">{product.spec.purity}</span>
												</span>
											)}
										</span>
									</div>
									<div className="flex shrink-0 items-center gap-4 opacity-60 transition-opacity group-hover:opacity-100">
										<button
											onClick={() => setDrawer({ categoryId: cat.id, product })}
											className={btnGhost}
										>
											<Pencil size={12} /> Edit
										</button>
										<button
											disabled={pending}
											onClick={() => {
												if (window.confirm(`Delete “${product.name}”?`))
													remove(() => deleteProduct(product.id));
											}}
											className="text-white/40 transition-colors hover:text-red-400 cursor-pointer disabled:opacity-50"
											aria-label="Delete product"
										>
											<Trash2 size={14} />
										</button>
									</div>
								</div>
							))}
							{cat.products.length === 0 && (
								<p className="border-b border-r border-white/10 px-6 py-5 text-white/30 text-xs font-light">
									No products yet.
								</p>
							)}
						</div>
					</section>
				))}
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
		<form
			action={formAction}
			className="mb-8 border border-white/10 bg-white/[0.02] p-6"
		>
			{category && <input type="hidden" name="id" value={category.id} />}
			<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Category name</span>
					<input
						name="name"
						defaultValue={category?.name}
						required
						placeholder="e.g. Boiler Chemicals"
						className={inputCls}
					/>
				</label>
				<label className="flex flex-col gap-1.5">
					<span className={labelCls}>Blurb</span>
					<input
						name="blurb"
						defaultValue={category?.blurb}
						placeholder="Short description"
						className={inputCls}
					/>
				</label>
			</div>
			<div className="mt-5 flex items-center gap-4">
				<button type="submit" disabled={pending} className={btnPrimary}>
					{pending ? "Saving…" : category ? "Save category" : "Add category"}
				</button>
				{onCancel && (
					<button type="button" onClick={onCancel} className={btnGhost}>
						Cancel
					</button>
				)}
				{state.error && <span className="text-red-400 text-xs">{state.error}</span>}
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
	const supabase = useMemo(() => createClient(), []);
	const [imageUrl, setImageUrl] = useState(product?.image ?? "");
	const [uploading, setUploading] = useState(false);
	const [imgErr, setImgErr] = useState<string | null>(null);

	const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (!file.type.startsWith("image/")) {
			setImgErr("Choose an image file.");
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			setImgErr("Image must be under 5 MB.");
			return;
		}
		setImgErr(null);
		setUploading(true);
		const ext = file.name.split(".").pop() || "jpg";
		const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const { error } = await supabase.storage
			.from("product-images")
			.upload(path, file, { cacheControl: "3600", upsert: false });
		if (error) {
			setImgErr(error.message);
			setUploading(false);
			return;
		}
		const { data } = supabase.storage.from("product-images").getPublicUrl(path);
		setImageUrl(data.publicUrl);
		setUploading(false);
	};

	useEffect(() => {
		if (state.ok) onSaved();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

	return (
		<div className="fixed inset-0 z-[1100] flex justify-end">
			<div
				className="absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
			/>
			<div className="relative h-full w-full max-w-xl overflow-y-auto border-l border-white/10 bg-deep shadow-2xl">
				<div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-deep px-8 py-6">
					<div className="flex items-center gap-3">
						<span className="h-px w-5 bg-accent-500" />
						<span className="uppercase tracking-[0.3em] text-accent-500 text-[0.6rem] font-black">
							{product ? "Edit product" : "New product"}
						</span>
					</div>
					<button
						onClick={onClose}
						className="text-white/40 hover:text-white transition-colors cursor-pointer"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>

				<form action={formAction} className="p-8">
					{product && <input type="hidden" name="id" value={product.id} />}

					<div className="space-y-5">
						<label className="flex flex-col gap-1.5">
							<span className={labelCls}>Category</span>
							<select
								name="category_id"
								defaultValue={categoryId}
								className={`${inputCls} cursor-pointer`}
							>
								{categories.map((c) => (
									<option key={c.id} value={c.id} className="bg-deep">
										{c.name}
									</option>
								))}
							</select>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className={labelCls}>Product name</span>
							<input
								name="name"
								defaultValue={product?.name}
								required
								placeholder="e.g. Polyaluminium Chloride"
								className={inputCls}
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className={labelCls}>Description</span>
							<textarea
								name="description"
								defaultValue={product?.description}
								rows={4}
								placeholder="Product description…"
								className={`${inputCls} resize-none`}
							/>
						</label>

						<div className="flex flex-col gap-1.5">
							<span className={labelCls}>Image</span>
							{imageUrl ? (
								<div className="relative overflow-hidden rounded-sm border border-white/10">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img
										src={imageUrl}
										alt=""
										className="h-40 w-full object-cover"
									/>
									<button
										type="button"
										onClick={() => setImageUrl("")}
										className="absolute right-2 top-2 rounded-sm bg-black/70 p-1 text-white/80 transition-colors hover:text-white cursor-pointer"
										aria-label="Remove image"
									>
										<X size={14} />
									</button>
								</div>
							) : (
								<label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-white/15 py-6 text-white/50 text-xs transition-colors hover:border-accent-500 hover:text-accent-500">
									<Upload size={14} />
									{uploading ? "Uploading…" : "Upload image (PNG/JPG, ≤5MB)"}
									<input
										type="file"
										accept="image/*"
										onChange={onUpload}
										disabled={uploading}
										className="hidden"
									/>
								</label>
							)}
							{imgErr && <span className="text-red-400 text-xs">{imgErr}</span>}
						</div>
					</div>

					<input type="hidden" name="image_url" value={imageUrl} />

					<div className="mt-8 mb-4 flex items-center gap-3">
						<span className="h-px w-5 bg-accent-500/60" />
						<span className="uppercase tracking-[0.3em] text-white/60 text-[0.6rem] font-black">
							Specifications
						</span>
					</div>
					<div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
						{SPEC_FIELDS.map(({ key, label }) => (
							<label key={key} className="flex flex-col gap-1.5">
								<span className={labelCls}>{label}</span>
								<input
									name={key}
									defaultValue={product?.spec[key] ?? ""}
									className={inputCls}
								/>
							</label>
						))}
					</div>

					<div className="mt-8 flex items-center gap-4">
						<button type="submit" disabled={pending} className={btnPrimary}>
							{pending ? "Saving…" : product ? "Save product" : "Add product"}
						</button>
						{state.error && (
							<span className="text-red-400 text-xs">{state.error}</span>
						)}
					</div>
				</form>
			</div>
		</div>
	);
}
