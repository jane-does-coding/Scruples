import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import { asset } from "@/lib/asset";
import usePortrait from "@/components/usePortrait";
import Zhenya from "@/components/Zhenya";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
// How long the labels take to lift away after "So what?" (their 800ms
// transition) - the posts only start sliding over once they're gone
const LABELS_UP_MS = 800;

const drop = (shown: boolean, ms = 800, easing = DOLL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

// Each post opens `href` in a new tab - replace the "#" placeholders
const POSTS = [
	{
		src: asset("/imgs/social/insta1.webp"),
		href: "https://www.instagram.com/p/Ddq5HoOCRNT/",
	},
	{
		src: asset("/imgs/social/insta2.webp"),
		href: "https://www.instagram.com/p/Dcb_GJZt2tD",
	},
	{
		src: asset("/imgs/social/insta3.webp"),
		href: "https://www.instagram.com/p/DRXYq8PiGAC/",
	},
	{
		src: asset("/imgs/social/insta4.webp"),
		href: "https://www.instagram.com/p/Dd6tuMIEWhr/",
	},
	{
		src: asset("/imgs/social/insta5.webp"),
		href: "https://www.instagram.com/p/DZLF-KpEytA/",
	},
];

export default function Page4({ nextPage, curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);
	// Phones held upright: the posts are smaller, so they slide further left
	const portrait = usePortrait();
	// Idle doll, blinking every 1-3s like on Page 1
	const dollSrc = useBlinkingDoll();

	// Clicking "Wow Cool!" drops it and the first label down low, and the
	// "digital and traditional art" label drops in up high
	const [wowed, setWowed] = useState(false);

	// Clicking "So what?" sends every label back up, slides the posts to the
	// left, and drops in the "It opens a way…" label on the right
	const [soWhat, setSoWhat] = useState(false);

	// The Continue button rises once the last label ("It opens a way…") has
	// dropped in (the second one starts 1.8s after "So what?" and takes 0.8s)
	const [showContinue, setShowContinue] = useState(false);
	useEffect(() => {
		if (!soWhat) return;
		const timer = setTimeout(
			() => setShowContinue(true),
			// after the second "opens" label (0.4s behind the first) lands
			LABELS_UP_MS + 1000 + 800,
		);
		return () => clearTimeout(timer);
	}, [soWhat]);

	// Marquee eases down to 30% speed on hover (without stopping) and back up
	// when the pointer leaves. playbackRate is changed rather than the CSS
	// duration, so the posts keep their place instead of jumping
	const marqueeRef = useRef<HTMLDivElement>(null);
	const speedFrame = useRef(0);
	const easeMarqueeTo = (target: number) => {
		const animation = marqueeRef.current?.getAnimations()[0];
		if (!animation) return; // e.g. reduced motion turns the animation off

		cancelAnimationFrame(speedFrame.current);
		const tick = () => {
			const rate =
				animation.playbackRate + (target - animation.playbackRate) * 0.08;
			if (Math.abs(target - rate) < 0.01) {
				animation.playbackRate = target;
				return;
			}
			animation.playbackRate = rate;
			speedFrame.current = requestAnimationFrame(tick);
		};
		tick();
	};
	useEffect(() => () => cancelAnimationFrame(speedFrame.current), []);

	// Once the curtains have opened: the doll drops in, then "Now people post
	// their art…", then "Wow Cool!"
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[800, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	return (
		<div className="h-full flex flex-col items-center justify-center">
			{/* Doll - on the left */}
			<Zhenya
				src={dollSrc}
				className="h-[97svh] absolute top-[-27svh] left-[-9vw] portrait:h-[55svh] portrait:top-[-10svh] portrait:left-[-16vw] max-w-none test-shadow-darker z-5"
				style={{
					...drop(step >= 1, 900),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<h1
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[18vw] mx-auto text-center scribbler absolute bottom-[67svh] left-[17vw] portrait:bottom-[42svh] portrait:left-[6vw] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-5 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Drops in at 0.4s. Once "Wow Cool!" is clicked it drops 48svh lower
					// with it (bottom-[67svh] → 19svh from the bottom)
					...drop(step >= 2, 800, LABEL_DROP),
					// …and lifts off the top once "So what?" is clicked
					transform: soWhat
						? "translateY(-100svh)"
						: wowed
							? "translateY(25svh)"
							: step >= 2
								? "translateY(0)"
								: "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Now people post their art on social medias
			</h1>

			{/* "Wow Cool!" - drops in at 0.8s; clicking it drops it and the label
			    above down low */}
			<button
				onClick={() => setWowed(true)}
				disabled={wowed}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[18vw] mx-auto text-center scribbler absolute bottom-[58svh] left-[25vw] portrait:bottom-[36svh] portrait:left-[14vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-1 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					// Once clicked it drops 48svh lower: bottom-[58svh] → 10svh from the
					// bottom of the page
					...drop(step >= 3, 800, LABEL_DROP),
					// …and lifts off the top once "So what?" is clicked
					transform: soWhat
						? "translateY(-100svh)"
						: wowed
							? "translateY(25svh)"
							: step >= 3
								? "translateY(0)"
								: "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Wow Cool!
			</button>

			{/* "So what?" - drops in just after the "digital and traditional art"
			    label (0.8s after "Wow Cool!"); clicking it sends every label back up */}
			<button
				onClick={() => setSoWhat(true)}
				disabled={!wowed || soWhat}
				// Off screen (and out of the Tab order) until it has dropped in
				tabIndex={wowed && !soWhat ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[18vw] mx-auto text-center scribbler absolute bottom-[22svh] left-[27vw] portrait:bottom-[4svh] portrait:left-[12vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(wowed, 800, LABEL_DROP),
					transitionDelay: wowed && !soWhat ? "800ms" : "0ms",
					transform: wowed && !soWhat ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				So what?
			</button>

			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[17vw] mx-auto text-center scribbler absolute bottom-[60svh] left-[20vw] portrait:bottom-[42svh] portrait:left-[6vw] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Drops in from above 0.4s after "Wow Cool!" is clicked. Starts
					// 100svh up so its long strings are off screen too
					// …and lifts back off the top once "So what?" is clicked
					...drop(wowed),
					transitionDelay: wowed && !soWhat ? "400ms" : "0ms",
					transform: wowed && !soWhat ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[70svh] top-[-70svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[70svh] top-[-70svh] right-0 absolute"></span>
				There is digital and traditional art, that people post.
			</p>

			{/* "It opens a way…" - drops in on the right, 0.6s after the posts
			    start sliding over (1.4s after "So what?" is clicked), and
			    "…while also opening a huge portal…" follows 0.4s later */}
			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[18vw] mx-auto text-center scribbler absolute bottom-[49svh] right-0 portrait:bottom-[46svh] portrait:right-[6vw] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					...drop(soWhat, 800, LABEL_DROP),
					transitionDelay: soWhat ? `${LABELS_UP_MS + 600}ms` : "0ms",
					transform: soWhat ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				It opens a way for people to share their work with the whole world
			</p>
			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[22vw] mx-auto text-center scribbler absolute bottom-[30svh] right-[-3vw] portrait:bottom-[22svh] portrait:right-[6vw] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					...drop(soWhat, 800, LABEL_DROP),
					transitionDelay: soWhat ? `${LABELS_UP_MS + 1000}ms` : "0ms",
					transform: soWhat ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				while also opening a huge portal for comparison to other artists
			</p>

			{/* Posts - a vertical marquee on the right that scrolls up forever.
			    It starts at the top of the screen (the content area starts 25svh
			    down). Two copies of the set slide up by one set's height (-50%),
			    so the loop is seamless - the gap below each copy (pb) must match
			    the gap between posts */}
			{/* The two lines - outside the marquee so they stay still (anything
			    inside it moves with it, even "fixed"), and before it so they sit
			    behind the posts. Same spot and width as a post (60svh tall at
			    944×1302 is 60 × 944 / 1302 ≈ 43.5svh wide) */}
			{/* Slides the posts (and their two lines) to the left once "So what?"
			    is clicked. A wrapper, because the marquee's own transform is busy
			    scrolling it. pointer-events-none so the empty part of it doesn't
			    block clicks; the lines and posts turn them back on */}
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					transition: `transform 900ms ${DOLL_DROP}`,
					// Waits for the labels to finish lifting away (0.8s) first
					transitionDelay: soWhat ? `${LABELS_UP_MS}ms` : "0ms",
					transform: soWhat
						? `translateX(${portrait ? "-50vw" : "-21vw"})`
						: "translateX(0)",
				}}
			>
				<div className="absolute top-[-25svh] right-0 h-svh w-[43.5svh] portrait:top-[-20svh] portrait:right-[3vw] portrait:w-[21.75svh] test-shadow-darker pointer-events-auto">
					<span className="w-[0.1vw] bg-black/60 h-full top-0 left-[2vw] absolute"></span>
					<span className="w-[0.1vw] bg-black/60 h-full top-0 right-[2vw] absolute"></span>
				</div>

				<div
					ref={marqueeRef}
					className="absolute top-[-25svh] right-0 portrait:top-[-20svh] portrait:right-[3vw] flex flex-col marquee-up test-shadow-darker pointer-events-auto"
					onMouseEnter={() => easeMarqueeTo(0.3)}
					onMouseLeave={() => easeMarqueeTo(1)}
				>
					{[0, 1].map((copy) => (
						<div
							key={copy}
							className="flex flex-col gap-[4svh] pb-[4svh]"
							aria-hidden={copy === 1}
						>
							{POSTS.map(({ src, href }, i) => (
								<a
									key={src}
									href={href}
									target="_blank"
									rel="noopener noreferrer"
									// The second copy is only there for the loop
									tabIndex={copy === 1 ? -1 : undefined}
								>
									<img
										src={src}
										className="h-[60svh] portrait:h-[30svh] w-auto max-w-none"
										alt={`Instagram-style art post ${i + 1}`}
										// Only its drawn part counts (see opaqueAt)
										data-hit
									/>
								</a>
							))}
						</div>
					))}
				</div>
			</div>

			{/* Continue - rises in once the last label has dropped in. After the
			    marquee in the code so it sits in front of the posts */}
			<PopsicleButton
				onClick={nextPage}
				href="/meet-daphne"
				style={{
					...drop(showContinue, 900, BUTTON_DROP),
					transform: showContinue ? "translateY(0)" : "translateY(100svh)",
					// Inline so these beat the component's right-0, bottom-0 and
					// test-shadow-darker: further right, lower, and a darker shadow
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
