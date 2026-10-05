import { useEffect, useState } from "react";

const IDLE = "/imgs/doll3.webp";
const BLINK = "/imgs/blink.webp";
// blink.webp is one 700ms blink (it loops, so it's swapped out after one)
const BLINK_MS = 700;
// Each blink comes a random 1-3s after the last one
const MIN_GAP_MS = 1000;
const MAX_GAP_MS = 3000;

// The idle doll, blinking once at random every 1-3 seconds. Returns the image
// to show. A browser won't restart an animated image whose URL it has already
// shown, so blink.webp is loaded once as a blob and gets a fresh object URL
// for every blink - that way each blink starts from its first frame
export default function useBlinkingDoll() {
	const [src, setSrc] = useState(IDLE);

	useEffect(() => {
		let blob: Blob | undefined;
		let url: string | undefined;
		let timer: ReturnType<typeof setTimeout>;

		fetch(BLINK)
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
	}, []);

	return src;
}
