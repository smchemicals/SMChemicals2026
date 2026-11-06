export interface AboutValueCard {
	title: string;
	body: string;
}

export interface AboutValuesSection {
	eyebrow: string;
	heading: string;
	cards: AboutValueCard[];
}

export interface TimelineItem {
	year: string;
	title: string;
	description: string;
}

export interface AboutTimelineSection {
	eyebrow: string;
	heading: string;
	headingAccent: string;
	items: TimelineItem[];
}

export interface CertSpec {
	title: string;
	detail: string;
}

export interface AboutCertsSection {
	eyebrow: string;
	heading: string;
	headingAccent: string;
	body: string;
	specs: CertSpec[];
}

export interface AboutContent {
	values: AboutValuesSection;
	timeline: AboutTimelineSection;
	certifications: AboutCertsSection;
}

export const defaultAbout: AboutContent = {
	values: {
		eyebrow: "Core Pillars",
		heading: "Purpose & Direction",
		cards: [
			{
				title: "Mission",
				body: "Making high-precision chemicals that keep industry across India running.",
			},
			{
				title: "Vision",
				body: "To lead the industry through molecular engineering and high-purity industrial formulations.",
			},
		],
	},
	timeline: {
		eyebrow: "Our Journey",
		heading: "Milestones",
		headingAccent: "of Excellence.",
		items: [
			{
				year: "2008",
				title: "Company Founded",
				description:
					"SM Chemicals established in Hyderabad with a vision to provide quality chemicals to industries across India.",
			},
			{
				year: "2012",
				title: "Expanded Product Range",
				description:
					"Added water treatment, ETP chemicals, and construction chemicals to our growing portfolio.",
			},
			{
				year: "2020",
				title: "ISO Certification",
				description:
					"Achieved ISO 9001:2015 certification, reinforcing our commitment to quality management systems.",
			},
			{
				year: "2024",
				title: "Industry Leader",
				description:
					"Now serving 500+ clients across 20+ industries, recognized as a trusted chemical solutions partner.",
			},
		],
	},
	certifications: {
		eyebrow: "Quality Assurance",
		heading: "Verified",
		headingAccent: "Standards.",
		body: "Our commitment to quality is backed by internationally recognized certifications and rigorous quality control processes.",
		specs: [
			{ title: "ISO 9001:2015", detail: "Quality Management" },
			{ title: "15+ Years", detail: "Industry Experience" },
			{ title: "Certified", detail: "Safety Standards" },
			{ title: "Reliable", detail: "Pan-India Delivery" },
		],
	},
};

export const ABOUT_KEY = "about" as const;
