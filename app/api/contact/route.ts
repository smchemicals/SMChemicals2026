import { NextResponse } from "next/server";
import { z } from "zod";
import { SITE } from "@/lib/site";
import { inquiryNotification, acknowledgement } from "@/lib/email/templates";
import { allow, clientIp, sameOrigin } from "@/lib/security/rate-limit";
import { verifyTurnstile, turnstileEnabled } from "@/lib/security/turnstile";

const PayloadSchema = z.object({
	name: z.string().trim().min(1).max(200),
	email: z.string().trim().email().max(200),
	message: z.string().trim().min(1).max(5000),
	label: z.string().trim().max(60).optional(),
	fields: z.record(z.string().max(40), z.string().max(2000)).optional(),
	// A captcha token (when the site has one configured) and a field real visitors never fill.
	token: z.string().max(4000).optional(),
	website: z.string().max(200).optional(),
	attachment: z
		.object({
			filename: z.string().trim().min(1).max(200),
			content: z.string().min(1), // base64 (data-URL prefix stripped client-side)
		})
		.optional(),
});

const MAX_ATTACH_BYTES = 5 * 1024 * 1024; // 5 MB
const PDF_MAGIC = [0x25, 0x50, 0x44, 0x46]; // "%PDF"

function validatePdf(
	att: { filename: string; content: string },
): { error: string } | { filename: string; content: string } {
	let bytes: Buffer;
	try {
		bytes = Buffer.from(att.content, "base64");
	} catch {
		return { error: "Attachment could not be read." };
	}
	if (bytes.length === 0) return { error: "Attachment is empty." };
	if (bytes.length > MAX_ATTACH_BYTES)
		return { error: "Attachment exceeds 5 MB." };
	if (!PDF_MAGIC.every((b, i) => bytes[i] === b))
		return { error: "Only PDF files are allowed." };
	const filename = att.filename.toLowerCase().endsWith(".pdf")
		? att.filename
		: `${att.filename}.pdf`;
	return { filename, content: bytes.toString("base64") };
}

/* What the form may call itself. The subject of the email is built from this and the visitor's name; it is never taken from the request. */
const LABEL = /^(General Inquiry|Quote Request|Team Inquiry|Blog Inquiry|Career Application(: [^\r\n]{1,50})?)$/;
const clean = (v: string) => v.replace(/[\u0000-\u001f\u007f]+/g, " ").trim();

export async function POST(req: Request) {
	// Same-site only, and a limit per visitor, so the form can't be driven from elsewhere or used to flood the inbox.
	if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 403 });
	const ip = clientIp(req);
	if (!allow(`contact:${ip}`, 4, 10 * 60_000) || !allow(`contact-day:${ip}`, 12, 24 * 3_600_000)) {
		return NextResponse.json({ ok: false, error: "Too many messages from this connection. Please try again later." }, { status: 429 });
	}
	let body: unknown;
	try {
		body = await req.json();
	} catch {
		return NextResponse.json({ ok: false, error: "Bad request." }, { status: 400 });
	}

	const parsed = PayloadSchema.safeParse(body);
	if (!parsed.success) {
		return NextResponse.json(
			{ ok: false, error: "Please fill in your name, a valid email and a message." },
			{ status: 422 },
		);
	}

	const { name: rawName, email, message, label, fields, attachment, token, website } = parsed.data;
	// A bot fills the hidden field: answer as if it worked, and send nothing.
	if (website && website.trim()) return NextResponse.json({ ok: true, delivered: true });
	if (turnstileEnabled) {
		const human = await verifyTurnstile(token ?? null, ip);
		if (!human.ok) return NextResponse.json({ ok: false, error: "Please complete the check and try again." }, { status: 422 });
	}
	const name = clean(rawName);
	const heading = label && LABEL.test(label) ? label : "New Inquiry";
	const mailSubject = `${heading}: ${name}`.slice(0, 160);

	let attachments: { filename: string; content: string }[] | undefined;
	if (attachment) {
		const result = validatePdf(attachment);
		if ("error" in result)
			return NextResponse.json(
				{ ok: false, error: result.error },
				{ status: 422 },
			);
		attachments = [result];
	}

	const html = inquiryNotification(heading, {
		Name: name,
		Email: email,
		...Object.fromEntries(Object.entries(fields ?? {}).slice(0, 12)),
		...(attachments ? { Attachment: `${attachments[0].filename} (PDF)` } : {}),
		Message: message,
	});

	const apiKey = process.env.RESEND_API_KEY;
	const from = process.env.RESEND_FROM;
	const to = process.env.CONTACT_TO || SITE.email;

	// Not configured yet, so accept the submission but don't pretend it was emailed.
	if (!apiKey || !from) {
		console.warn("[contact] RESEND not configured; inquiry not emailed:", {
			heading,
			name,
			email,
		});
		return NextResponse.json({ ok: true, delivered: false });
	}

	try {
		const { Resend } = await import("resend");
		const resend = new Resend(apiKey);

		const { error: sendError } = await resend.emails.send({
			from,
			to,
			replyTo: email,
			subject: mailSubject,
			html,
			attachments,
		});
		if (sendError) {
			console.error("[contact] resend rejected the send:", sendError);
			return NextResponse.json(
				{ ok: false, error: "Email could not be sent. Please try again." },
				{ status: 502 },
			);
		}

		// The reply to the sender goes to whatever address they typed, so it is limited per address: the form can't be used to mail someone repeatedly.
		const { error: ackError } = !allow(`ack:${email.toLowerCase()}`, 2, 60 * 60_000)
			? { error: null }
			: await resend.emails.send({
			from,
			to: email,
			subject: `We received your inquiry | ${SITE.name}`,
			html: acknowledgement(name, heading),
		});
		if (ackError) console.warn("[contact] acknowledgement not sent:", ackError);

		return NextResponse.json({ ok: true, delivered: true });
	} catch (err) {
		console.error("[contact] send failed:", err);
		return NextResponse.json({ ok: false, error: "Server error." }, { status: 500 });
	}
}
