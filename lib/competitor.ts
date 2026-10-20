import { useEffect, useState } from "react";

// What was filled in on Page 7's competition form, and which painting was
// submitted - kept in this browser (localStorage), so the form's filled in
// next time and the name shows on the drawings made here

export type Competitor = {
	name: string;
	gender: string;
	aiArt: string;
	// The painting submitted to the competition
	entry?: "magic" | "yours";
};

const STORAGE_KEY = "scruples-competitor";
const CHANGE_EVENT = "scruples-competitor-changed";

// Each answer's shortest and longest length
export const LIMITS = {
	name: { min: 2, max: 30 },
	gender: { min: 1, max: 30 },
	aiArt: { min: 10, max: 200 },
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
	window.dispatchEvent(new Event(CHANGE_EVENT));
};

// The name given on the form, or null. Empty until the page is running in
// the browser
export const useCompetitorName = () => {
	const [name, setName] = useState<string | null>(null);
	useEffect(() => {
		const update = () => setName(loadCompetitor().name?.trim() || null);
		const timer = setTimeout(update, 0);
		window.addEventListener(CHANGE_EVENT, update);
		// Changed in another tab
		window.addEventListener("storage", update);
		return () => {
			clearTimeout(timer);
			window.removeEventListener(CHANGE_EVENT, update);
			window.removeEventListener("storage", update);
		};
	}, []);
	return name;
};
