import useReaction from "@/components/useReaction";
import { asset } from "@/lib/asset";

// Zhenya's "wow" reaction, like on the Mona Lisa in the souvenir shop.
// playWow() plays wow once, then holds wow-idle; playWowReverse() plays
// wow-reverse once, then hands back. `src` is the image to show, or null when
// the page's own doll (e.g. the blinking one) should show instead
export default function useWowDoll() {
	const { src, play, playReverse } = useReaction({
		forward: asset("/imgs/zhenya/wow.webp"),
		reverse: asset("/imgs/zhenya/wow-reverse.webp"),
		pose: asset("/imgs/zhenya/wow-idle.webp"),
		// wow.webp and wow-reverse.webp are both 18 frames × 60ms
		ms: 1080,
	});
	return { src, playWow: play, playWowReverse: playReverse };
}
