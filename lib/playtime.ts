import { useEffect } from "react";

// How long has been spent on the site, in seconds, over every visit (kept
// in this browser). Counted while the page is open and on screen, for the
// stats at the curtain call

const STORAGE_KEY = "scruples-time";
// Added up this often
const TICK_S = 5;

export const loadPlaytime = () => {
	try {
		return Number(localStorage.getItem(STORAGE_KEY)) || 0;
	} catch {
		return 0;
	}
};

// Keeps the count going while the site is open (used once, in Stage)
export const usePlaytimeCounter = () => {
	useEffect(() => {
		const timer = setInterval(() => {
			if (document.hidden) return;
			try {
				localStorage.setItem(STORAGE_KEY, String(loadPlaytime() + TICK_S));
			} catch {}
		}, TICK_S * 1000);
		return () => clearInterval(timer);
	}, []);
};

// e.g. "40 sec", "12 min", "1 h 5 min"
export const formatPlaytime = (seconds: number) => {
	if (seconds < 60) return `${seconds} sec`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};
