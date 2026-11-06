"use client";

import {
	useActionState,
	useEffect,
	useState,
	useTransition,
} from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, X, ArrowLeft, Eye } from "lucide-react";
import { ImageField } from "@/components/admin/ImageField";
import { RichText } from "@/components/admin/rich-text";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { savePost, deletePost, type BlogState } from "./actions";
import type { BlogPost } from "@/data/blog";
import { formatDate } from "@/lib/format-date";
import { Notice, BTN, FIELD, ICON_BTN, LABEL, LINK_BTN, ICON_DANGER, Panel, Status, SaveResult } from "@/components/admin/ui";

// The editor is a page of its own, so its fields take the surface colour.
const inputCls = FIELD;
const labelCls = LABEL;
const btnPrimary = BTN;

const fmt = (iso: string | null) => formatDate(iso);

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

	const onDelete = (p: BlogPost) =>
		start(async () => {
			const res = await deletePost(p.id);
			setMsg(res.error ? res.error : "Post deleted.");
			router.refresh();
		});

	return (
		<div>
			<div className="mb-6 flex flex-wrap items-center gap-4">
				<button type="button" onClick={() => setEditing("new")} className={btnPrimary}>
					<Plus size={16} aria-hidden /> New post
				</button>
				{msg && <span role="status" className="text-sm text-muted">{msg}</span>}
			</div>

			{posts.length === 0 ? (
				<Panel>
					<p className="text-base text-muted">No posts yet. Create your first one.</p>
				</Panel>
			) : (
				<Panel>
					<ul className="-mx-4">
						{posts.map((p) => (
							<li key={p.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 rounded-lg px-4 py-4 transition-colors hover:bg-foreground/5">
								<div className="min-w-0">
									<div className="flex flex-wrap items-center gap-3">
										<span className="truncate font-heading text-lg font-semibold tracking-[-0.02em] text-foreground">{p.title}</span>
										<Status tone={p.published ? "ok" : "info"}>{p.published ? "Published" : "Draft"}</Status>
									</div>
									<span className="text-sm text-muted">/blog/{p.slug}, {fmt(p.publishedAt)}</span>
								</div>
								<div className="flex shrink-0 items-center gap-1">
									<a href={`/preview?path=/blog/${p.slug}`} target="_blank" rel="noopener noreferrer" className={ICON_BTN} aria-label={`Preview ${p.title}`} title="Preview">
										<Eye size={18} aria-hidden />
									</a>
									<button type="button" onClick={() => setEditing(p)} className={ICON_BTN} aria-label={`Edit ${p.title}`} title="Edit">
										<Pencil size={18} aria-hidden />
									</button>
									<ConfirmAction
										disabled={pending}
										prompt={`Delete "${p.title}"?`}
										warning={p.published ? "It disappears from the live site, and this can't be undone." : "This can't be undone."}
										ariaLabel={`Delete ${p.title}`}
										className={ICON_DANGER}
										onConfirm={() => onDelete(p)}
									>
										<Trash2 size={18} aria-hidden />
									</ConfirmAction>
								</div>
							</li>
						))}
					</ul>
				</Panel>
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
	const [coverUrl, setCoverUrl] = useState(post?.coverImage ?? "");
	const [body, setBody] = useState(post?.body ?? "");
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

	if (typeof document === "undefined") return null;

	return createPortal(
		<div className="fixed inset-0 z-1100 flex flex-col bg-background">
			<div className="flex flex-none flex-wrap items-center justify-between gap-4 px-6 py-4 md:px-10">
				<div className="flex items-center gap-5">
					<button type="button" onClick={onClose} className={LINK_BTN}>
						<ArrowLeft size={18} aria-hidden />
						Back
					</button>
					<h2 className="font-heading text-xl font-semibold tracking-[-0.02em] text-foreground">{post ? "Edit post" : "New post"}</h2>
				</div>
				<div className="flex items-center gap-4">
					<span className="hidden sm:inline"><SaveResult error={state.error} /></span>
					<button type="submit" form="post-editor-form" disabled={pending} className={btnPrimary}>
						{pending ? "Saving…" : post ? "Save post" : "Create post"}
					</button>
					<button type="button" onClick={onClose} className={ICON_BTN} aria-label="Close editor">
						<X size={20} aria-hidden />
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
								<span className="font-normal text-muted/80">/blog/{slug || "…"}</span>
							</span>
							<input
								name="slug"
								value={slug}
								readOnly
								tabIndex={-1}
								placeholder="auto-filled from title"
								className={`${inputCls} cursor-default text-muted`}
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
							<ImageField
								value={coverUrl}
								onChange={setCoverUrl}
								bucket="blog-images"
								aspect={16 / 9}
							/>
						</div>

						<div className="flex flex-col gap-1.5">
							<span className={labelCls}>Body</span>
							<RichText value={post?.body ?? ""} onChange={setBody} />
							<input type="hidden" name="body" value={body} />
						</div>

						<label className="flex cursor-pointer items-center gap-3 pt-2">
							<input
								type="checkbox"
								name="published"
								defaultChecked={post?.published ?? false}
								className="h-5 w-5 cursor-pointer accent-[var(--color-accent)]"
							/>
							<span className="text-base text-foreground">Published (live on the site)</span>
						</label>
					</div>

					{state.error && <Notice tone="danger" className="mt-8">{state.error}</Notice>}
				</form>
			</div>
		</div>,
		document.body,
	);
}
