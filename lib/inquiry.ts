/*
 * Open the form from anywhere: <Button onClick={() => openInquiry("quote")}>. The overlay lives in the site layout.
 * One form serves every page, so each opener says what it is for: that is the title the person sees, and the label the
 * message arrives with (the subject line of the email, and what the admin sees it was sent as).
 */
export const INQUIRY_EVENT = "smc:open-inquiry";

export const INQUIRY_TOPICS = {
	general: { title: "Write to us", label: "General Inquiry" },
	quote: { title: "Request a quote", label: "Quote Request" },
	team: { title: "Talk to our team", label: "Team Inquiry" },
	article: { title: "Ask about this article", label: "Blog Inquiry" },
} as const;

export type InquiryTopic = keyof typeof INQUIRY_TOPICS;

export type InquiryRequest = { topic: InquiryTopic; productId?: string };

/* `productId` opens the form for that chemical, already chosen (from its page). */
export function openInquiry(topic: InquiryTopic = "general", opts: { productId?: string } = {}) {
	if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent<InquiryRequest>(INQUIRY_EVENT, { detail: { topic, ...opts } }));
}
