import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

export default function useHeheDoll() {
	const { src, play, playReverse } = useReaction({
		forward: asset("/imgs/daphne/hehe.webp"),
		reverse: asset("/imgs/daphne/hehe-reverse.webp"),
		pose: asset("/imgs/daphne/hehe-idle.webp"),
		ms: HEHE_MS,
	});
	return { src, playHehe: play, playHeheReverse: playReverse };
}

export const HEHE_MS = 910;
