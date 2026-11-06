import {ContactHero} from "@/components/contactpage-components/contact-hero";
import {getPublishedContact} from "@/lib/cms/snapshots";
import type {Metadata} from "next";

export const metadata: Metadata = {
    title: "Contact",
    description:
        "Get in touch with SM Chemicals to request a quote, ask about a product, or find our Hyderabad location and direct line.",
    alternates: {canonical: "/contact"},
};

export default async function ContactPage() {
    const contact = await getPublishedContact();
    return (
        <>
            <ContactHero contact={contact}/>
        </>
    );
}
