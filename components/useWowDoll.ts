import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

const WOW = asset("/imgs/wow.webp");
const WOW_REVERSE = asset("/imgs/wow-reverse.webp");
const WOW_IDLE = asset("/imgs/wow-idle.webp");
// wow.webp and wow-reverse.webp are both 18 frames × 60ms
const WOW_MS = 1080;
const WOW_REVERSE_MS = 1080;

// The doll's "wow" reaction, like on the Mona Lisa in the souvenir shop.
// playWow() plays wow once, then holds wow-idle; playWowReverse() plays
// wow-reverse once, then hands back. `src` is the image to show, or null when
// the page's own doll (e.g. the blinking one) should show instead.
//
// A browser won't restart an animated image whose URL it has already shown,
// so wow and wow-reverse are loaded once as blobs and get a fresh object URL
// each time they play
export default function useWowDoll() {
	const [src, setSrc] = useState<string | null>(null);
	const blobs = useRef<{ wow?: Blob; reverse?: Blob }>({});
	const playingUrl = useRef<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		fetch(WOW, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (blobs.current.wow = b));
		fetch(WOW_REVERSE, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (blobs.current.reverse = b));
		new Image().src = WOW_IDLE;
		return () => {
			clearTimeout(timer.current);
			if (playingUrl.current) URL.revokeObjectURL(playingUrl.current);
		};
	}, []);

	const freshUrl = (blob: Blob | undefined, fallback: string) => {
		if (playingUrl.current) URL.revokeObjectURL(playingUrl.current);
		playingUrl.current = blob ? URL.createObjectURL(blob) : null;
		return playingUrl.current ?? fallback;
	};

	const playWow = () => {
		clearTimeout(timer.current);
		setSrc(freshUrl(blobs.current.wow, WOW));
		timer.current = setTimeout(() => setSrc(WOW_IDLE), WOW_MS);
	};

	const playWowReverse = () => {
		clearTimeout(timer.current);
		setSrc(freshUrl(blobs.current.reverse, WOW_REVERSE));
		timer.current = setTimeout(() => setSrc(null), WOW_REVERSE_MS);
	};

	return { src, playWow, playWowReverse };
}
