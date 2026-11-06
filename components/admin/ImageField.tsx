"use client";

import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Cropper, { type Area, type MediaSize } from "react-easy-crop";
import { Upload, Crop, RefreshCw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { BTN, BTN_QUIET } from "@/components/admin/ui";

/*
 * Image upload with cropping, for the admin (ported from the SP Design Studio
 * admin's ImageUploader). Picking or dropping a file opens a crop dialog
 * (ratio presets, zoom) before anything uploads; an existing image can be
 * replaced, re-cropped or removed from the overlay. Cropping happens in the
 * browser on a canvas; the result is uploaded straight to Supabase Storage.
 */

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp";
const ORIGINAL = 0;

const RATIOS: { label: string; value: number }[] = [
	{ label: "Original", value: ORIGINAL },
	{ label: "16:9", value: 16 / 9 },
	{ label: "4:3", value: 4 / 3 },
	{ label: "3:2", value: 3 / 2 },
	{ label: "1:1", value: 1 },
	{ label: "4:5", value: 4 / 5 },
];

function mimeFromName(name: string): string {
	const ext = name.split("?")[0]!.split(".").pop()?.toLowerCase() ?? "";
	if (ext === "png") return "image/png";
	if (ext === "webp") return "image/webp";
	return "image/jpeg";
}

function loadImage(src: string): Promise<HTMLImageElement> {
	return new Promise((resolve, reject) => {
		const img = new window.Image();
		img.crossOrigin = "anonymous";
		img.onload = () => resolve(img);
		img.onerror = reject;
		img.src = src;
	});
}

async function cropToBlob(src: string, area: Area, mime: string, product: boolean): Promise<Blob> {
	let img: HTMLImageElement;
	try {
		img = await loadImage(src);
	} catch {
		throw new Error("load");
	}
	// Product photos are exported at a sensible size, and on white: zooming out leaves white around the product, which
	// is what the product panel shows it on, so it never meets an edge.
	const scale = product ? Math.min(1, 1200 / area.width) : 1;
	const canvas = document.createElement("canvas");
	canvas.width = Math.round(area.width * scale);
	canvas.height = Math.round(area.height * scale);
	const ctx = canvas.getContext("2d")!;
	if (product || mime === "image/jpeg") {
		ctx.fillStyle = "#fff";
		ctx.fillRect(0, 0, canvas.width, canvas.height);
	}
	// The crop may reach past the picture when zoomed out: draw only the part that exists, where it belongs.
	const sx = Math.max(0, area.x);
	const sy = Math.max(0, area.y);
	const ex = Math.min(img.naturalWidth, area.x + area.width);
	const ey = Math.min(img.naturalHeight, area.y + area.height);
	if (ex > sx && ey > sy) {
		ctx.drawImage(img, sx, sy, ex - sx, ey - sy, (sx - area.x) * scale, (sy - area.y) * scale, (ex - sx) * scale, (ey - sy) * scale);
	}
	return new Promise((resolve, reject) =>
		canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("crop"))), mime, 0.92),
	);
}

function validate(file: File): string | null {
	if (!ACCEPT.split(",").includes(file.type))
		return "Use a JPG, PNG or WebP image.";
	if (file.size > MAX_BYTES) return "Image must be under 5 MB.";
	return null;
}

const overlayBtn =
	"inline-flex h-10 w-36 cursor-pointer items-center justify-center gap-2 rounded-md bg-background px-3 text-sm font-semibold text-foreground outline-none transition-colors hover:bg-foreground hover:text-background focus-visible:ring-2 focus-visible:ring-accent";

export function ImageField({
	value,
	onChange,
	bucket,
	aspect = 16 / 9,
	hint,
	previewClassName = "h-44",
	variant = "free",
}: {
	value: string;
	onChange: (url: string) => void;
	/** Supabase Storage bucket to upload into. */
	bucket: string;
	/** The ratio the site displays this image at; preselected when cropping. */
	aspect?: number;
	hint?: string;
	previewClassName?: string;
	/**
	 * "product": the one ratio the product panel shows (the ratio is locked), room to zoom out so the whole product fits
	 * on white, exported on white at a sensible size, and previewed in the same frame the site uses.
	 */
	variant?: "free" | "product";
}) {
	const product = variant === "product";
	const supabase = useMemo(() => createClient(), []);
	const inputRef = useRef<HTMLInputElement>(null);
	const [busy, setBusy] = useState<string | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [drag, setDrag] = useState(false);

	const [cropSrc, setCropSrc] = useState<string | null>(null);
	const cropMime = useRef("image/jpeg");
	const cropIsBlob = useRef(false);
	const [crop, setCrop] = useState({ x: 0, y: 0 });
	const [zoom, setZoom] = useState(1);
	const [area, setArea] = useState<Area | null>(null);
	const [choice, setChoice] = useState(aspect);
	const [naturalRatio, setNaturalRatio] = useState(0);

	const ratio = product ? aspect : choice === ORIGINAL ? naturalRatio || aspect : choice;
	const minZoom = product ? 0.25 : 1;
	const siteLabel =
		RATIOS.find((r) => r.value !== ORIGINAL && Math.abs(r.value - aspect) < 0.02)
			?.label ?? `${aspect.toFixed(2)}:1`;

	const openCrop = (src: string, mime: string, isBlob: boolean) => {
		cropMime.current = mime;
		cropIsBlob.current = isBlob;
		setCrop({ x: 0, y: 0 });
		setZoom(1);
		setArea(null);
		setNaturalRatio(0);
		setChoice(aspect);
		setCropSrc(src);
	};

	const closeCrop = () => {
		if (cropSrc && cropIsBlob.current) URL.revokeObjectURL(cropSrc);
		setCropSrc(null);
	};

	const pick = (file?: File | null) => {
		if (!file) return;
		const problem = validate(file);
		if (problem) {
			setError(problem);
			return;
		}
		setError(null);
		openCrop(URL.createObjectURL(file), file.type, true);
	};

	const upload = async (file: File) => {
		setBusy("Uploading");
		setError(null);
		const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
		const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
		const { error: upErr } = await supabase.storage
			.from(bucket)
			.upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type });
		setBusy(null);
		if (upErr) {
			setError(upErr.message);
			return;
		}
		onChange(supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl);
	};

	const applyCrop = async () => {
		if (!cropSrc || !area) return;
		const mime = product ? "image/jpeg" : cropMime.current;
		try {
			const blob = await cropToBlob(cropSrc, area, mime, product);
			closeCrop();
			await upload(new File([blob], "image", { type: mime }));
		} catch (e) {
			closeCrop();
			setError(
				e instanceof Error && e.message === "load"
					? "Couldn't open this image for cropping, it may have been moved or deleted from storage."
					: "This image couldn't be cropped in your browser. Try uploading the original file again.",
			);
		}
	};

	const veil = busy && (
		<div
			role="status"
			aria-live="polite"
			className="absolute inset-0 z-10 flex items-center justify-center gap-2.5 bg-background/90"
		>
			<RefreshCw size={16} aria-hidden className="animate-spin text-accent-ink" />
			<span className="text-sm font-medium text-foreground">{busy}…</span>
		</div>
	);

	return (
		<div>
			{value ? (
				<div className="group relative overflow-hidden rounded-xl bg-surface">
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={value}
						alt=""
						className={product ? "aspect-4/3 w-full bg-white object-contain" : `${previewClassName} w-full object-cover`}
					/>
					{veil}
					<div
						className={`absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 ${
							busy ? "pointer-events-none" : ""
						}`}
					>
						<button type="button" onClick={() => inputRef.current?.click()} className={overlayBtn}>
							<Upload size={16} aria-hidden /> Replace
						</button>
						<button
							type="button"
							onClick={() => openCrop(value, mimeFromName(value), false)}
							className={overlayBtn}
						>
							<Crop size={16} aria-hidden /> Crop
						</button>
						<button type="button" onClick={() => onChange("")} className={`${overlayBtn} !text-danger`}>
							<X size={16} aria-hidden /> Remove
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => inputRef.current?.click()}
					onDragOver={(e) => {
						e.preventDefault();
						setDrag(true);
					}}
					onDragLeave={() => setDrag(false)}
					onDrop={(e) => {
						e.preventDefault();
						setDrag(false);
						pick(e.dataTransfer.files?.[0]);
					}}
					disabled={!!busy}
					className={`relative flex w-full cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl py-10 text-center outline-none ring-2 transition-shadow focus-visible:ring-accent ${
						drag ? "bg-accent/10 ring-accent" : "bg-surface ring-transparent hover:ring-foreground/15"
					}`}
				>
					{veil}
					<Upload size={20} aria-hidden className="text-muted" />
					<span className="text-base font-medium text-foreground">Drop a photo here, or click to choose one</span>
					<span className="max-w-xs text-sm text-muted">
						{hint ?? "JPG, PNG or WebP, up to 5 MB. You crop it before it uploads."}
					</span>
				</button>
			)}

			<input
				ref={inputRef}
				type="file"
				accept={ACCEPT}
				className="hidden"
				onChange={(e) => {
					pick(e.target.files?.[0]);
					e.target.value = "";
				}}
			/>

			{error && (
				<div role="alert" className="mt-2 flex items-start justify-between gap-3 rounded-lg bg-danger-soft px-4 py-3">
					<p className="text-sm font-medium text-danger-ink">{error}</p>
					<button
						type="button"
						onClick={() => setError(null)}
						aria-label="Dismiss"
						className="cursor-pointer rounded text-danger-ink outline-none focus-visible:ring-2 focus-visible:ring-accent"
					>
						<X size={16} aria-hidden />
					</button>
				</div>
			)}

			{cropSrc &&
				createPortal(
					<div
						role="dialog"
						aria-modal="true"
						aria-label="Crop image"
						data-lenis-prevent
						className="fixed inset-0 z-1300 flex flex-col bg-background p-4 text-foreground md:p-8"
					>
						<div className="mx-auto mb-4 flex w-full max-w-3xl flex-wrap items-center justify-between gap-3">
							<span className="font-heading text-2xl font-semibold tracking-[-0.03em]">Crop photo</span>
							<div className="flex flex-wrap items-center gap-1.5">
								{product && <span className="text-sm text-muted">4:3, as shown on the website</span>}
								{!product && RATIOS.map((r) => (
									<button
										key={r.label}
										type="button"
										onClick={() => setChoice(r.value)}
										aria-pressed={choice === r.value}
										className={`cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-accent ${
											choice === r.value ? "bg-foreground text-background" : "bg-surface text-muted hover:text-foreground"
										}`}
									>
										{r.label}
									</button>
								))}
							</div>
						</div>

						<div className="relative mx-auto w-full max-w-3xl flex-1 overflow-hidden rounded-xl bg-black/60">
							<Cropper
								image={cropSrc}
								crop={crop}
								zoom={zoom}
								minZoom={minZoom}
								restrictPosition={!product}
								aspect={ratio}
								onCropChange={setCrop}
								onZoomChange={setZoom}
								onCropComplete={(_, a) => setArea(a)}
								onMediaLoaded={(m: MediaSize) => {
									const r = m.naturalWidth / m.naturalHeight;
									setNaturalRatio(r);
									// A product photo starts zoomed out to show all of it in the frame; the person then zooms in as they like.
									if (product) setZoom(Math.max(minZoom, Math.min(r / ratio, ratio / r)));
								}}
							/>
						</div>

						<p className="mx-auto mt-3 w-full max-w-3xl text-muted text-sm">
							{product
								? "The frame is exactly how the product panel shows this photo. Drag to position, and zoom out to leave white space around the product so all of it shows."
								: `${siteLabel} matches how this image is shown on the website. Drag to position, scroll or use the slider to zoom.`}
						</p>

						<div className="mx-auto mt-4 flex w-full max-w-3xl flex-wrap items-center gap-4">
							<span className="text-sm font-medium text-muted">Zoom</span>
							<input
								type="range"
								min={minZoom}
								max={4}
								step={0.01}
								value={zoom}
								onChange={(e) => setZoom(Number(e.target.value))}
								aria-label="Zoom"
								className="min-w-40 flex-1 cursor-pointer accent-(--color-accent)"
							/>
							<button
								type="button"
								onClick={closeCrop}
								className={BTN_QUIET}
							>
								Cancel
							</button>
							<button
								type="button"
								onClick={applyCrop}
								disabled={!area}
								className={BTN}
							>
								Use crop
							</button>
						</div>
					</div>,
					document.body,
				)}
		</div>
	);
}
