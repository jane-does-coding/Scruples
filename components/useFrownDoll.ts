import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

// Daphne's frown: playFrown() frowns (frown-enter), then holds it;
// playFrownReverse() plays it backwards, then hands back. `src` is the image
// to show, or null when her usual (blinking) self should show instead
export default function useFrownDoll() {
	const { src, play, playReverse } = useReaction({
		forward: asset("/imgs/daphne/frown-enter.webp"),
		reverse: asset("/imgs/daphne/frown-exit.webp"),
		pose: asset("/imgs/daphne/frown.webp"),
		// frown-enter.webp and frown-exit.webp are both 5 frames × 80ms
		ms: FROWN_MS,
	});
	return { src, playFrown: play, playFrownReverse: playReverse };
}

export const FROWN_MS = 400;
