"use client";

import {
	useActionState,
	useEffect,
	useMemo,
	useState,
	useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, Upload, ArrowLeft, Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { RichText } from "@/components/admin/rich-text";
import { savePost, deletePost, type BlogState } from "./actions";
import type { BlogPost } from "@/data/blog";

const inputCls =
	"w-full border-b border-white/15 bg-transparent py-2.5 text-white text-sm font-light outline-none transition-colors placeholder:text-white/20 focus:border-accent-500";
const labelCls =
	"uppercase tracking-[0.25em] text-white/40 text-[0.55rem] font-black";
const btnPrimary =
	"inline-flex items-center gap-2 bg-accent-500 px-7 py-3.5 uppercase tracking-[0.3em] text-black text-[0.65rem] font-black transition-colors hover:bg-white disabled:opacity-50 cursor-pointer";

function fmt(iso: string | null) {
	return iso ? new Date(iso).toLocaleDateString() : "—";
}

function slugify(s: string): string {
	return s
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
}

export function BlogManager({ posts }: { posts: BlogPost[] }) {
	const router = useRouter();
	const [editing, setEditing] = useState<BlogPost | "new" | null>(null);
	const [pending, start] = useTransition();
	const [msg, setMsg] = useState<string | null>(null);

	const onDelete = (p: BlogPost) => {
		if (!window.confirm(`Delete “${p.title}”? This cannot be undone.`)) return;
		start(async () => {
			const res = await deletePost(p.id);
			setMsg(res.error ? res.error : "Post deleted.");
			router.refresh();
		});
	};

	return (
		<div>
			<div className="mb-6 flex items-center justify-between gap-4">
				<button
					type="button"
					onClick={() => setEditing("new")}
					className={btnPrimary}
				>
					<Plus size={14} /> New post
				</button>
				{msg && <span className="text-white/55 text-xs">{msg}</span>}
			</div>

			{posts.length === 0 ? (
				<p className="border border-white/10 bg-white/[0.02] px-6 py-10 text-center text-white/35 text-sm font-light">
					No posts yet. Create your first one.
				</p>
			) : (
				<div className="border-t border-white/10">
					{posts.map((p) => (
						<div
							key={p.id}
							className="flex items-center justify-between gap-4 border-b border-white/10 py-4"
						>
							<div className="min-w-0">
								<div className="flex items-center gap-3">
									<span className="truncate text-white text-sm font-medium">
										{p.title}
									</span>
									<span
										className={`shrink-0 border px-2 py-0.5 uppercase tracking-[0.18em] text-[0.5rem] font-black ${
											p.published
												? "border-accent-500/40 bg-accent-500/10 text-accent-500"
												: "border-white/15 text-white/45"
										}`}
									>
										{p.published ? "Published" : "Draft"}
									</span>
								</div>
								<span className="text-white/35 text-xs font-light tracking-wide">
									/{p.slug} · {fmt(p.publishedAt)}
								</span>
							</div>
							<div className="flex shrink-0 items-center gap-2">
								<a
									href={`/preview?path=/blog/${p.slug}`}
									target="_blank"
									rel="noopener noreferrer"
									className="p-2 text-white/45 transition-colors hover:text-accent-500 cursor-pointer"
									aria-label="Preview"
									title="Preview"
								>
									<Eye size={15} />
								</a>
								<button
									type="button"
									onClick={() => setEditing(p)}
									className="p-2 text-white/45 transition-colors hover:text-accent-500 cursor-pointer"
									aria-label="Edit"
								>
									<Pencil size={15} />
								</button>
								<button
									type="button"
									disabled={pending}
									onClick={() => onDelete(p)}
									className="p-2 text-white/45 transition-colors hover:text-red-400 disabled:opacity-50 cursor-pointer"
									aria-label="Delete"
								>
									<Trash2 size={15} />
								</button>
							</div>
						</div>
					))}
				</div>
			)}

			{editing && (
				<PostEditor
					post={editing === "new" ? null : editing}
					onClose={() => setEditing(null)}
					onSaved={() => {
						setEditing(null);
						router.refresh();
					}}
				/>
			)}
		</div>
	);
}

function PostEditor({
	post,
	onClose,
	onSaved,
}: {
	post: BlogPost | null;
	onClose: () => void;
	onSaved: () => void;
}) {
	const [state, formAction, pending] = useActionState(
		savePost,
		{} as BlogState,
	);
	const supabase = useMemo(() => createClient(), []);
	const [coverUrl, setCoverUrl] = useState(post?.coverImage ?? "");
	const [body, setBody] = useState(post?.body ?? "");
	const [uploading, setUploading] = useState(false);
	const [imgErr, setImgErr] = useState<string | null>(null);
	const [title, setTitle] = useState(post?.title ?? "");
	const [slug, setSlug] = useState(post?.slug ?? "");
	const [slugTouched] = useState(Boolean(post));

	useEffect(() => {
		if (state.ok) onSaved();
	}, [state]); // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);

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
			.from("blog-images")
			.upload(path, file, { cacheControl: "3600", upsert: false });
		if (error) {
			setImgErr(error.message);
			setUploading(false);
			return;
		}
		const { data } = supabase.storage.from("blog-images").getPublicUrl(path);
		setCoverUrl(data.publicUrl);
		setUploading(false);
	};

	if (typeof document === "undefined") return null;

	return createPortal(
		<div className="fixed inset-0 z-[1100] flex flex-col bg-deep">
			<div className="flex flex-none items-center justify-between gap-4 border-b border-white/10 px-6 py-4 md:px-10">
				<div className="flex items-center gap-5">
					<button
						type="button"
						onClick={onClose}
						className="inline-flex items-center gap-2 text-white/60 transition-colors hover:text-white cursor-pointer"
					>
						<ArrowLeft size={16} />
						<span className="uppercase tracking-[0.2em] text-[0.6rem] font-black">
							Back
						</span>
					</button>
					<span className="h-4 w-px bg-white/15" />
					<span className="uppercase tracking-[0.3em] text-accent-500 text-[0.6rem] font-black">
						{post ? "Edit post" : "New post"}
					</span>
				</div>
				<div className="flex items-center gap-5">
					{state.error && (
						<span className="hidden text-red-400 text-xs sm:inline">
							{state.error}
						</span>
					)}
					<button
						type="submit"
						form="post-editor-form"
						disabled={pending}
						className={btnPrimary}
					>
						{pending ? "Saving…" : post ? "Save post" : "Create post"}
					</button>
					<button
						type="button"
						onClick={onClose}
						className="text-white/40 hover:text-white transition-colors cursor-pointer"
						aria-label="Close"
					>
						<X size={20} />
					</button>
				</div>
			</div>

			<div className="flex-1 overflow-y-auto">
				<form
					id="post-editor-form"
					action={formAction}
					className="mx-auto max-w-3xl px-6 py-10 md:px-10 md:py-12"
				>
					{post && <input type="hidden" name="id" value={post.id} />}
					<input type="hidden" name="cover_image_url" value={coverUrl} />

					<div className="space-y-5">
						<label className="flex flex-col gap-1.5">
							<span className={labelCls}>Title</span>
							<input
								name="title"
								value={title}
								onChange={(e) => {
									setTitle(e.target.value);
									if (!slugTouched) setSlug(slugify(e.target.value));
								}}
								required
								placeholder="Post title"
								className={inputCls}
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className={labelCls}>
								Slug{" "}
								<span className="text-white/25">/blog/{slug || "…"}</span>
							</span>
							<input
								name="slug"
								value={slug}
								readOnly
								tabIndex={-1}
								placeholder="auto-filled from title"
								className={`${inputCls} cursor-default text-white/50`}
							/>
						</label>
						<label className="flex flex-col gap-1.5">
							<span className={labelCls}>Excerpt</span>
							<textarea
								name="excerpt"
								defaultValue={post?.excerpt}
								rows={2}
								placeholder="Short summary shown on the blog grid…"
								className={`${inputCls} resize-none`}
							/>
						</label>

						<div className="flex flex-col gap-1.5">
							<span className={labelCls}>Cover image</span>
							{coverUrl ? (
								<div className="relative overflow-hidden rounded-sm border border-white/10">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={coverUrl} alt="" className="h-44 w-full object-cover" />
									<button
										type="button"
										onClick={() => setCoverUrl("")}
										className="absolute right-2 top-2 rounded-sm bg-black/70 p-1 text-white/80 transition-colors hover:text-white cursor-pointer"
										aria-label="Remove image"
									>
										<X size={14} />
									</button>
								</div>
							) : (
								<label className="flex cursor-pointer items-center justify-center gap-2 rounded-sm border border-dashed border-white/15 py-6 text-white/50 text-xs transition-colors hover:border-accent-500 hover:text-accent-500">
									<Upload size={14} />
									{uploading ? "Uploading…" : "Upload cover (PNG/JPG, ≤5MB)"}
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

						<div className="flex flex-col gap-1.5">
							<span className={labelCls}>Body</span>
							<RichText value={post?.body ?? ""} onChange={setBody} />
							<input type="hidden" name="body" value={body} />
						</div>

						<label className="flex items-center gap-3 pt-2 cursor-pointer">
							<input
								type="checkbox"
								name="published"
								defaultChecked={post?.published ?? false}
								className="h-4 w-4 accent-accent-500 cursor-pointer"
							/>
							<span className="uppercase tracking-[0.2em] text-white/70 text-[0.62rem] font-black">
								Published (live on the site)
							</span>
						</label>
					</div>

					{state.error && (
						<p className="mt-8 text-red-400 text-xs">{state.error}</p>
					)}
				</form>
			</div>
		</div>,
		document.body,
	);
}
