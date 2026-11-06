/* A value passed from one page to the next within the site, held in memory (so nothing is stored in the browser). */
let category: string | null = null;

export const setScrollCategory = (id: string) => {
	category = id;
};
export const takeScrollCategory = () => {
	const c = category;
	category = null;
	return c;
};
