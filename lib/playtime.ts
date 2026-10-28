import { useEffect } from "react";

const STORAGE_KEY = "scruples-time";
const TICK_S = 5;

export const loadPlaytime = () => {
	try {
		return Number(localStorage.getItem(STORAGE_KEY)) || 0;
	} catch {
		return 0;
	}
};

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

export const formatPlaytime = (seconds: number) => {
	if (seconds < 60) return `${seconds} sec`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} min`;
	return `${Math.floor(minutes / 60)} h ${minutes % 60} min`;
};
