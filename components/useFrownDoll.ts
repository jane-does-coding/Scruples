import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

export default function useFrownDoll() {
	const { src, play, playReverse } = useReaction({
		forward: asset("/imgs/daphne/frown-enter.webp"),
		reverse: asset("/imgs/daphne/frown-exit.webp"),
		pose: asset("/imgs/daphne/frown.webp"),
		ms: FROWN_MS,
	});
	return { src, playFrown: play, playFrownReverse: playReverse };
}

export const FROWN_MS = 400;
