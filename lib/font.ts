import { useEffect, useState } from "react";

import {
	FONT_CLASS as CLASS,
	FONT_STORAGE_KEY as STORAGE_KEY,
} from "@/lib/fontScript";

const listeners = new Set<(readable: boolean) => void>();

export const isReadable = () =>
	document.documentElement.classList.contains(CLASS);

export const setReadable = (readable: boolean) => {
	document.documentElement.classList.toggle(CLASS, readable);
	try {
		localStorage.setItem(STORAGE_KEY, readable ? "readable" : "handwritten");
	} catch {}
	listeners.forEach((listener) => listener(readable));
};

export const useReadableFont = () => {
	const [readable, setState] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setState(isReadable()), 0);
		listeners.add(setState);
		return () => {
			clearTimeout(timer);
			listeners.delete(setState);
		};
	}, []);
	return readable;
};
