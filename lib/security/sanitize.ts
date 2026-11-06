import sanitizeHtml from "sanitize-html";

/*
 * Blog posts are rich text written in the admin and shown as HTML. They are cleaned on the way out, so a script or an
 * event handler in a post (from a compromised account, or a bad paste) never reaches a visitor. Only what the editor
 * can make is kept: text, headings, lists, quotes, code, links and images.
 */
export function sanitizeBody(html: string): string {
	return sanitizeHtml(html, {
		allowedTags: [
			"p", "br", "hr", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "mark", "code", "pre",
			"blockquote", "ul", "ol", "li", "a", "img", "figure", "figcaption", "span", "div", "sub", "sup",
		],
		allowedAttributes: {
			a: ["href", "title", "target", "rel"],
			img: ["src", "alt", "title", "width", "height", "loading"],
			"*": ["class"],
		},
		allowedSchemes: ["http", "https", "mailto", "tel"],
		allowedSchemesByTag: { img: ["http", "https"] },
		allowProtocolRelative: false,
		transformTags: {
			// Links to other sites open safely.
			a: (tag, attribs) => ({
				tagName: "a",
				attribs: { ...attribs, ...(attribs.target === "_blank" ? { rel: "noopener noreferrer" } : {}) },
			}),
		},
	});
}
