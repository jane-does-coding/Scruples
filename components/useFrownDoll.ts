import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

const DAPHNE_FROWN = {
	forward: asset("/imgs/daphne/frown-enter.webp"),
	reverse: asset("/imgs/daphne/frown-exit.webp"),
	pose: asset("/imgs/daphne/frown.webp"),
};

export const ZHENYA_FROWN = {
	forward: asset("/imgs/zhenya/frown-enter.webp"),
	reverse: asset("/imgs/zhenya/frown-exit.webp"),
	pose: asset("/imgs/zhenya/frown.webp"),
};

export default function useFrownDoll(doll = DAPHNE_FROWN) {
	const { src, play, playReverse } = useReaction({ ...doll, ms: FROWN_MS });
	return { src, playFrown: play, playFrownReverse: playReverse };
}

export const FROWN_MS = 400;
