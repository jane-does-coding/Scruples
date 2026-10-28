export type Competitor = {
	age: number;
	gender: string;
	aiArt: string;
	entry?: "magic" | "yours";
};

const STORAGE_KEY = "scruples-competitor";

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
