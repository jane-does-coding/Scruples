import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import { useCompetitorName } from "@/lib/competitor";

// Everyone's drawings from Page 6, for the last page's marquee and the
// /gallery page.
//
// For now they're kept in this browser only (localStorage), so you see the
// drawings made here, plus Daphne's as a sample. Everything goes through
// loadDrawings / saveDrawing / useDrawings, so switching to shared online
// storage later only means changing this file

export type Drawing = {
	id: string;
	// The framed drawing, as an image (a data URL, or a file's URL)
	image: string;
	// When it was made (ms since 1970)
	madeAt: number;
	by: string;
};

const STORAGE_KEY = "scruples-drawings";
// Each is ~50-100KB; browsers allow ~5MB, so the oldest go past this many
const MAX_KEPT = 30;
const CHANGE_EVENT = "scruples-drawings-changed";
// Who a drawing made here is by, before a name's been given (on Page 7)
const NO_NAME = "A visitor";

// Shown even before anyone has drawn anything
export const SAMPLE_DRAWINGS: Drawing[] = [
	{
		id: "sample-daphne",
		image: asset("/imgs/drawing-smile.webp"),
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

// Newest first. If the browser is out of room, the oldest ones are dropped
// until it fits
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

// The drawings to show: everyone's (newest first), then the samples. Empty
// until the page is running in the browser. The ones made in this browser
// show the name given on Page 7's form, once there is one
export const useDrawings = () => {
	const name = useCompetitorName();
	const [drawings, setDrawings] = useState<Drawing[]>([]);
	useEffect(() => {
		const update = () => setDrawings([...loadDrawings(), ...SAMPLE_DRAWINGS]);
		const timer = setTimeout(update, 0);
		window.addEventListener(CHANGE_EVENT, update);
		// Drawn in another tab
		window.addEventListener("storage", update);
		return () => {
			clearTimeout(timer);
			window.removeEventListener(CHANGE_EVENT, update);
			window.removeEventListener("storage", update);
		};
	}, []);
	return name
		? drawings.map((d) => (d.by === NO_NAME ? { ...d, by: name } : d))
		: drawings;
};
