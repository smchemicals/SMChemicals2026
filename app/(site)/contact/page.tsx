import {ContactHero} from "@/components/contactpage-components/contact-hero";
import {ContactGrid} from "@/components/contactpage-components/contact-grid";
import {ContactInquiry} from "@/components/contactpage-components/contact-inquiry";
import {getPublishedContact} from "@/lib/cms/snapshots";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Contact",
    description:
        "Get in touch with SM Chemicals — request a quote, ask about a product, or find our Hyderabad location and direct line.",
    alternates: {canonical: "/contact"},
};

export default async function ContactPage() {
    const contact = await getPublishedContact();
    return (
        <>
            <ContactHero/>
            <ContactGrid contact={contact}/>
            <ContactInquiry/>
        </>
    );
}
