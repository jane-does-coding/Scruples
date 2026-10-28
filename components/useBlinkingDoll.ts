import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";

const ZHENYA = {
	idle: asset("/imgs/zhenya/doll3.webp"),
	blink: asset("/imgs/zhenya/blink2.webp"),
	blinkMs: 700,
};

export const DAPHNE = {
	idle: asset("/imgs/daphne/daphne3.webp"),
	blink: asset("/imgs/daphne/daphne-blinking2.webp"),
	blinkMs: 450,
};
const MIN_GAP_MS = 1000;
const MAX_GAP_MS = 3000;

export default function useBlinkingDoll(doll = ZHENYA) {
	const { idle: IDLE, blink: BLINK, blinkMs: BLINK_MS } = doll;
	const [src, setSrc] = useState(IDLE);

	useEffect(() => {
		let blob: Blob | undefined;
		let url: string | undefined;
		let timer: ReturnType<typeof setTimeout>;

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
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return src;
}
