export interface JobOpening {
	id: string;
	title: string;
	department: string;
	type: string;
	location: string;
	description: string;
}

export interface CareersValue {
	title: string;
	detail: string;
}

export interface CareersIntro {
	eyebrow: string;
	heading: string;
	headingAccent: string;
	body: string;
	values: CareersValue[];
}

export interface CareersContent {
	intro: CareersIntro;
	openings: JobOpening[];
}

export const defaultCareers: CareersContent = {
	intro: {
		eyebrow: "Life at SM Chemicals",
		heading: "Engineer a career",
		headingAccent: "with us.",
		body: "We build the high-precision formulations that keep India's industry running. Our people work across the lab bench, the plant floor and the field, solving real problems for real customers, with the autonomy to do it well.",
		values: [
			{
				title: "Hands-on Growth",
				detail: "Work directly with senior chemists and plant engineers from day one.",
			},
			{
				title: "Safety First",
				detail: "A culture built on rigorous standards and ISO-certified processes.",
			},
			{
				title: "Real Impact",
				detail: "Your work ships to 500+ clients across 20+ industrial sectors.",
			},
		],
	},
	openings: [
		{
			id: "process-chemist",
			title: "Process Chemist",
			department: "Research & Development",
			type: "Full-time",
			location: "Hyderabad",
			description:
				"Develop and optimise industrial formulations, run trials, and scale promising chemistries from bench to production.",
		},
		{
			id: "sales-engineer",
			title: "Technical Sales Engineer",
			department: "Sales",
			type: "Full-time",
			location: "Pan-India",
			description:
				"Partner with industrial clients to specify the right chemical solutions and grow long-term accounts across sectors.",
		},
		{
			id: "qc-analyst",
			title: "Quality Control Analyst",
			department: "Quality Assurance",
			type: "Full-time",
			location: "Hyderabad",
			description:
				"Run analytical testing across incoming raw materials and finished batches to uphold our purity standards.",
		},
		{
			id: "production-supervisor",
			title: "Production Supervisor",
			department: "Operations",
			type: "Full-time",
			location: "Hyderabad",
			description:
				"Oversee day-to-day plant operations, batch scheduling, safety compliance and the production team.",
		},
	],
};

export const careersIntro = defaultCareers.intro;
export const openings = defaultCareers.openings;

export const CAREERS_KEY = "careers" as const;
