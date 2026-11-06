// Editable site content. These defaults mirror the current hardcoded copy and
// are the fallback whenever Supabase isn't configured / a key isn't set yet.

export interface StatItem {
	label: string;
	value: number;
	suffix: string;
	decimals?: number;
}

export interface HomeContent {
	/** The paragraph under the hero headline. */
	heroText: string;
	/** The sectors we supply. One list: the words that take turns after "High-precision chemistry for" in the hero,
	 *  and the "We supply chemicals for ..." line above the figures. */
	sectors: string[];
	stats: StatItem[];
}

export const defaultHome: HomeContent = {
	heroText:
		"We make water treatment, construction, textile and process chemicals in Hyderabad, and supply them to industry across India.",
	sectors: ["wastewater", "construction", "textiles", "laundry care", "aquaculture", "paper & pulp"],
	stats: [
		{ label: "Experience", value: 15, suffix: "Yrs" },
		{ label: "Sectors", value: 20, suffix: "+" },
		{ label: "Portfolio", value: 100, suffix: "+" },
		{ label: "Global", value: 500, suffix: "+" },
		{ label: "Purity", value: 99.99, suffix: "%", decimals: 2 },
	],
};

export interface ContactContent {
	addressLines: string[];
	phone: string;
	email: string;
	hours: string;
	/** Optional. Empty means the map link is built from the address, so the two can never disagree. */
	mapsUrl: string;
}

export const defaultContact: ContactContent = {
	addressLines: ["2-2-1137, 5/B, Shivam Rd", "New Nallakunta, Hyderabad", "Telangana, India"],
	phone: "+91 98765 43210",
	email: "info@smchemicals.co.in",
	hours: "Mon - Sat: 09:00 - 18:00",
	mapsUrl: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x3bcb99bab873583f:0x83559a538cdc44b0",
};

/** A Google Maps search for an address: the link the Contact page uses unless a specific place link is saved. */
export const mapsSearchUrl = (addressLines: string[]) =>
	`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLines.join(", "))}`;

/** Where the Contact page's address link goes: the saved place link when there is one, otherwise the address itself. */
export const mapsLink = (c: Pick<ContactContent, "mapsUrl" | "addressLines">) =>
	/^https:\/\//i.test(c.mapsUrl.trim()) ? c.mapsUrl.trim() : mapsSearchUrl(c.addressLines);

export const CONTENT_KEYS = {
	home: "home",
	contact: "contact",
} as const;
