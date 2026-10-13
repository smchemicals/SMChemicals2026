"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import { Table } from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableHeader from "@tiptap/extension-table-header";
import TableCell from "@tiptap/extension-table-cell";
import {
	Bold,
	Italic,
	Underline as UnderlineIcon,
	Strikethrough,
	Code,
	SquareCode,
	Heading1,
	Heading2,
	Heading3,
	List,
	ListOrdered,
	Quote,
	Minus,
	Link as LinkIcon,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Highlighter,
	Table as TableIcon,
	Eraser,
	Undo2,
	Redo2,
} from "lucide-react";

function Btn({
	on,
	active,
	disabled,
	label,
	children,
}: {
	on: () => void;
	active?: boolean;
	disabled?: boolean;
	label: string;
	children: React.ReactNode;
}) {
	return (
		<button
			type="button"
			onMouseDown={(e) => e.preventDefault()}
			onClick={on}
			disabled={disabled}
			aria-label={label}
			title={label}
			className={`flex h-8 w-8 items-center justify-center rounded-sm transition-colors disabled:opacity-30 cursor-pointer ${
				active
					? "bg-cta text-white"
					: "text-white/75 hover:bg-white/10 hover:text-white"
			}`}
		>
			{children}
		</button>
	);
}

function Divider() {
	return <span className="mx-1 h-5 w-px bg-white/10" />;
}

function Toolbar({ editor }: { editor: Editor }) {
	const setLink = () => {
		const prev = editor.getAttributes("link").href as string | undefined;
		const input = window.prompt("Link URL", prev ?? "https://");
		if (input === null) return;
		const url = input.trim();
		if (url === "") {
			editor.chain().focus().extendMarkRange("link").unsetLink().run();
			return;
		}
		const href =
			/^(https?:\/\/|mailto:|tel:|\/)/i.test(url) ? url : `https://${url}`;
		if (editor.state.selection.empty && !editor.isActive("link")) {
			// No text selected — insert the URL itself as the linked text.
			editor
				.chain()
				.focus()
				.insertContent({
					type: "text",
					text: url,
					marks: [{ type: "link", attrs: { href } }],
				})
				.run();
		} else {
			editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
		}
	};

	const inTable = editor.isActive("table");

	return (
		<div className="border-b border-white/10 bg-white/[0.02]">
			<div className="flex flex-wrap items-center gap-1 p-2">
				<Btn label="Bold" on={() => editor.chain().focus().toggleBold().run()} active={editor.isActive("bold")}>
					<Bold size={15} />
				</Btn>
				<Btn label="Italic" on={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive("italic")}>
					<Italic size={15} />
				</Btn>
				<Btn label="Underline" on={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive("underline")}>
					<UnderlineIcon size={15} />
				</Btn>
				<Btn label="Strikethrough" on={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive("strike")}>
					<Strikethrough size={15} />
				</Btn>
				<Btn label="Highlight" on={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive("highlight")}>
					<Highlighter size={15} />
				</Btn>
				<Btn label="Inline code" on={() => editor.chain().focus().toggleCode().run()} active={editor.isActive("code")}>
					<Code size={15} />
				</Btn>

				<Divider />

				<Btn label="Heading 1" on={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive("heading", { level: 1 })}>
					<Heading1 size={16} />
				</Btn>
				<Btn label="Heading 2" on={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive("heading", { level: 2 })}>
					<Heading2 size={16} />
				</Btn>
				<Btn label="Heading 3" on={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive("heading", { level: 3 })}>
					<Heading3 size={16} />
				</Btn>

				<Divider />

				<Btn label="Align left" on={() => editor.chain().focus().setTextAlign("left").run()} active={editor.isActive({ textAlign: "left" })}>
					<AlignLeft size={15} />
				</Btn>
				<Btn label="Align center" on={() => editor.chain().focus().setTextAlign("center").run()} active={editor.isActive({ textAlign: "center" })}>
					<AlignCenter size={15} />
				</Btn>
				<Btn label="Align right" on={() => editor.chain().focus().setTextAlign("right").run()} active={editor.isActive({ textAlign: "right" })}>
					<AlignRight size={15} />
				</Btn>

				<Divider />

				<Btn label="Bullet list" on={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive("bulletList")}>
					<List size={16} />
				</Btn>
				<Btn label="Numbered list" on={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive("orderedList")}>
					<ListOrdered size={16} />
				</Btn>
				<Btn label="Quote" on={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive("blockquote")}>
					<Quote size={15} />
				</Btn>
				<Btn label="Code block" on={() => editor.chain().focus().toggleCodeBlock().run()} active={editor.isActive("codeBlock")}>
					<SquareCode size={16} />
				</Btn>
				<Btn label="Divider" on={() => editor.chain().focus().setHorizontalRule().run()}>
					<Minus size={16} />
				</Btn>
				<Btn label="Link" on={setLink} active={editor.isActive("link")}>
					<LinkIcon size={15} />
				</Btn>
				<Btn
					label="Insert table"
					on={() =>
						editor
							.chain()
							.focus()
							.insertTable({ rows: 3, cols: 3, withHeaderRow: true })
							.run()
					}
				>
					<TableIcon size={16} />
				</Btn>

				<Divider />

				<Btn label="Clear formatting" on={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}>
					<Eraser size={15} />
				</Btn>
				<Btn label="Undo" on={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
					<Undo2 size={15} />
				</Btn>
				<Btn label="Redo" on={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
					<Redo2 size={15} />
				</Btn>
			</div>

			{inTable && (
				<div className="type-label flex flex-wrap items-center gap-2 border-t border-white/10 px-2 py-1.5">
					<span className="text-white/50">Table</span>
					{[
						{ l: "+ Row", f: () => editor.chain().focus().addRowAfter().run() },
						{ l: "+ Col", f: () => editor.chain().focus().addColumnAfter().run() },
						{ l: "− Row", f: () => editor.chain().focus().deleteRow().run() },
						{ l: "− Col", f: () => editor.chain().focus().deleteColumn().run() },
						{ l: "Header", f: () => editor.chain().focus().toggleHeaderRow().run() },
						{ l: "Delete", f: () => editor.chain().focus().deleteTable().run() },
					].map((b) => (
						<button
							key={b.l}
							type="button"
							onMouseDown={(e) => e.preventDefault()}
							onClick={b.f}
							className="rounded-sm px-2 py-1 text-white/70 transition-colors hover:bg-white/10 hover:text-white cursor-pointer"
						>
							{b.l}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export function RichText({
	value,
	onChange,
}: {
	value: string;
	onChange: (html: string) => void;
}) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: [
			StarterKit.configure({ link: { openOnClick: false, autolink: true } }),
			TextAlign.configure({ types: ["heading", "paragraph"] }),
			Highlight,
			Table.configure({ resizable: true }),
			TableRow,
			TableHeader,
			TableCell,
		],
		content: value,
		onUpdate: ({ editor }) => onChange(editor.getHTML()),
		editorProps: {
			attributes: {
				class:
					"min-h-[280px] outline-none px-4 py-4 text-white/90 text-sm font-light leading-relaxed " +
					"[&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-white " +
					"[&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-white " +
					"[&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:text-lg [&_h3]:font-bold [&_h3]:text-white " +
					"[&_p]:mb-3 [&_strong]:font-bold [&_strong]:text-white [&_em]:italic " +
					"[&_u]:underline [&_s]:line-through [&_s]:text-white/75 " +
					"[&_mark]:rounded [&_mark]:bg-accent-500/30 [&_mark]:px-0.5 [&_mark]:text-white " +
					"[&_a]:text-accent-500 [&_a]:underline " +
					"[&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] " +
					"[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded [&_pre]:bg-black/40 [&_pre]:p-3 [&_pre]:font-mono [&_pre]:text-xs [&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
					"[&_hr]:my-4 [&_hr]:border-white/15 " +
					"[&_img]:my-3 [&_img]:max-w-full [&_img]:rounded " +
					"[&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:mb-1 " +
					"[&_blockquote]:border-l-2 [&_blockquote]:border-accent-500 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-white/70 " +
					"[&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-white/20 [&_th]:bg-white/5 [&_th]:p-2 [&_th]:text-left [&_td]:border [&_td]:border-white/15 [&_td]:p-2",
			},
		},
	});

	if (!editor) {
		return (
			<div className="min-h-[320px] rounded-sm border border-white/15 bg-transparent" />
		);
	}

	return (
		<div className="overflow-hidden rounded-sm border border-white/15 focus-within:border-accent-500 transition-colors">
			<Toolbar editor={editor} />
			<EditorContent editor={editor} />
		</div>
	);
}
