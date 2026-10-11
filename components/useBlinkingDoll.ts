import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

// Zhenya by default. blink.webp is one 700ms blink (it loops, so it's
// swapped out after one)
const ZHENYA = {
	idle: asset("/imgs/doll3.webp"),
	blink: asset("/imgs/blink.webp"),
	blinkMs: 700,
};

// Daphne: daphne-blinking2.webp is one 450ms blink (the source GIF had two
// blinks back to back, so only its first 5 frames were kept)
export const DAPHNE = {
	idle: asset("/imgs/daphne3.webp"),
	blink: asset("/imgs/daphne-blinking2.webp"),
	blinkMs: 450,
};
// Each blink comes a random 1-3s after the last one
const MIN_GAP_MS = 1000;
const MAX_GAP_MS = 3000;

// A doll's idle image, blinking once at random every 1-3 seconds - Zhenya
// unless another doll is passed in (e.g. DAPHNE). Returns the image to show. A browser won't restart an animated image whose URL it has already
// shown, so blink.webp is loaded once as a blob and gets a fresh object URL
// for every blink - that way each blink starts from its first frame
export default function useBlinkingDoll(doll = ZHENYA) {
	const { idle: IDLE, blink: BLINK, blinkMs: BLINK_MS } = doll;
	const [src, setSrc] = useState(IDLE);

	useEffect(() => {
		let blob: Blob | undefined;
		let url: string | undefined;
		let timer: ReturnType<typeof setTimeout>;

		// Low priority - the first blink is at least 1s away, and until this
		// arrives it just uses the plain URL
		fetch(BLINK, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (blob = b));

		const scheduleBlink = () => {
			const gap = MIN_GAP_MS + Math.random() * (MAX_GAP_MS - MIN_GAP_MS);
			timer = setTimeout(() => {
				if (url) URL.revokeObjectURL(url);
				url = blob ? URL.createObjectURL(blob) : undefined;
				setSrc(url ?? BLINK);

				timer = setTimeout(() => {
					setSrc(IDLE);
					scheduleBlink();
				}, BLINK_MS);
			}, gap);
		};
		scheduleBlink();

		return () => {
			clearTimeout(timer);
			if (url) URL.revokeObjectURL(url);
		};
		// The doll's images are fixed for the life of the component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return src;
}
