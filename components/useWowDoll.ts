import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

export default function useWowDoll() {
	const { src, play, playReverse } = useReaction({
		forward: asset("/imgs/zhenya/wow.webp"),
		reverse: asset("/imgs/zhenya/wow-reverse.webp"),
		pose: asset("/imgs/zhenya/wow-idle.webp"),
		ms: 1080,
	});
	return { src, playWow: play, playWowReverse: playReverse };
}
