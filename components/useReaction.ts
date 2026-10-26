import { useEffect, useRef, useState } from "react";

// A doll's reaction: an animation that plays once into a pose, the pose
// held, and the same animation backwards out of it - like Zhenya's "wow"
// or Daphne's "hehe". play() plays it in, then holds the pose; playReverse()
// plays it out, then hands back. `src` is the image to show, or null when the
// page's own doll (e.g. the blinking one) should show instead.
//
// A browser won't restart an animated image whose URL it has already shown,
// so the two animations are loaded once as blobs and get a fresh object URL
// each time they play
export default function useReaction({
	forward,
	reverse,
	pose,
	ms,
}: {
	forward: string;
	reverse: string;
	// The held pose, between the two
	pose: string;
	// How long each animation takes
	ms: number;
}) {
	const [src, setSrc] = useState<string | null>(null);
	const blobs = useRef<{ forward?: Blob; reverse?: Blob }>({});
	const playingUrl = useRef<string | null>(null);
	const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		fetch(forward, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (blobs.current.forward = b));
		fetch(reverse, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (blobs.current.reverse = b));
		new Image().src = pose;
		return () => {
			clearTimeout(timer.current);
			if (playingUrl.current) URL.revokeObjectURL(playingUrl.current);
		};
		// The images are fixed for the life of the component
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const freshUrl = (blob: Blob | undefined, fallback: string) => {
		if (playingUrl.current) URL.revokeObjectURL(playingUrl.current);
		playingUrl.current = blob ? URL.createObjectURL(blob) : null;
		return playingUrl.current ?? fallback;
	};

	const play = () => {
		clearTimeout(timer.current);
		setSrc(freshUrl(blobs.current.forward, forward));
		timer.current = setTimeout(() => setSrc(pose), ms);
	};

	const playReverse = () => {
		clearTimeout(timer.current);
		setSrc(freshUrl(blobs.current.reverse, reverse));
		timer.current = setTimeout(() => setSrc(null), ms);
	};

	return { src, play, playReverse };
}
