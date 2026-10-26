import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

// Daphne's "hehe": she giggles, a hand up to her mouth. playHehe() plays it
// once, then holds the giggle (hehe-idle); playHeheReverse() plays it
// backwards, then hands back. `src` is the image to show, or null when her
// usual (blinking) self should show instead
export default function useHeheDoll() {
	const { src, play, playReverse } = useReaction({
		forward: asset("/imgs/daphne/hehe.webp"),
		reverse: asset("/imgs/daphne/hehe-reverse.webp"),
		pose: asset("/imgs/daphne/hehe-idle.webp"),
		// hehe.webp and hehe-reverse.webp are both 13 frames × 70ms
		ms: HEHE_MS,
	});
	return { src, playHehe: play, playHeheReverse: playReverse };
}

export const HEHE_MS = 910;
