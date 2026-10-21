// What was filled in on Page 7's competition form, and which painting was
// submitted - kept in this browser (localStorage), so the form's filled in
// next time and Page 8 knows how the competition went

export type Competitor = {
	age: number;
	gender: string;
	aiArt: string;
	// The painting submitted to the competition
	entry?: "magic" | "yours";
};

const STORAGE_KEY = "scruples-competitor";

// The youngest and oldest age, and each written answer's shortest and
// longest length
export const LIMITS = {
	age: { min: 1, max: 120 },
	gender: { min: 1, max: 30 },
	aiArt: { min: 2, max: 200 },
} as const;

export const loadCompetitor = (): Partial<Competitor> => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
		if (saved && typeof saved === "object") return saved;
	} catch {}
	return {};
};

export const saveCompetitor = (changes: Partial<Competitor>) => {
	try {
		localStorage.setItem(
			STORAGE_KEY,
			JSON.stringify({ ...loadCompetitor(), ...changes }),
		);
	} catch {}
};
