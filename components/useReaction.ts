import { useEffect, useRef, useState } from "react";

export default function useReaction({
	forward,
	reverse,
	pose,
	ms,
}: {
	forward: string;
	reverse: string;
	pose: string;
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
