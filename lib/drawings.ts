import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

export type Drawing = {
	id: string;
	image: string;
	madeAt: number;
	by: string;
};

const STORAGE_KEY = "scruples-drawings";
const MAX_KEPT = 30;
const CHANGE_EVENT = "scruples-drawings-changed";
const NO_NAME = "A visitor";

export const SAMPLE_DRAWINGS: Drawing[] = [
	{
		id: "sample-daphne",
		image: asset("/imgs/art/drawing-smile.webp"),
		madeAt: 0,
		by: "Daphne",
	},
];

export const loadDrawings = (): Drawing[] => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
		if (Array.isArray(saved)) return saved;
	} catch {}
	return [];
};

export const saveDrawing = (image: string, by = NO_NAME) => {
	const drawing: Drawing = {
		id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
		image,
		madeAt: Date.now(),
		by,
	};
	let all = [drawing, ...loadDrawings()].slice(0, MAX_KEPT);
	while (all.length) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
			break;
		} catch {
			all = all.slice(0, -1);
		}
	}
	window.dispatchEvent(new Event(CHANGE_EVENT));
};

export const useDrawings = () => {
	const [drawings, setDrawings] = useState<Drawing[]>([]);
	useEffect(() => {
		const update = () => setDrawings([...loadDrawings(), ...SAMPLE_DRAWINGS]);
		const timer = setTimeout(update, 0);
		window.addEventListener(CHANGE_EVENT, update);
		window.addEventListener("storage", update);
		return () => {
			clearTimeout(timer);
			window.removeEventListener(CHANGE_EVENT, update);
			window.removeEventListener("storage", update);
		};
	}, []);
	return drawings;
};
