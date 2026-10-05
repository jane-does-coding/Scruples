import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import { asset } from "@/lib/asset";

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

const drop = (shown: boolean, ms = 800, easing = DOLL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

// Each post opens `href` in a new tab - replace the "#" placeholders
const POSTS = [
	{
		src: asset("/imgs/insta1.webp"),
		href: "https://www.instagram.com/p/Ddq5HoOCRNT/",
	},
	{
		src: asset("/imgs/insta2.webp"),
		href: "https://www.instagram.com/p/Dcb_GJZt2tD",
	},
	{
		src: asset("/imgs/insta3.webp"),
		href: "https://www.instagram.com/p/DRXYq8PiGAC/",
	},
	{
		src: asset("/imgs/insta4.webp"),
		href: "https://www.instagram.com/p/Dd6tuMIEWhr/",
	},
	{
		src: asset("/imgs/insta5.webp"),
		href: "https://www.instagram.com/p/DZLF-KpEytA/",
	},
];

export default function Page4({ nextPage, curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);
	// Idle doll, blinking every 1-3s like on Page 1
	const dollSrc = useBlinkingDoll();

	// Clicking "Wow Cool!" drops it and the first label down low, and the
	// "digital and traditional art" label drops in up high
	const [wowed, setWowed] = useState(false);

	// The Continue button rises once the "digital and traditional art" label
	// has dropped in (it starts 0.4s after the click and takes 0.8s)
	const [showContinue, setShowContinue] = useState(false);
	useEffect(() => {
		if (!wowed) return;
		const timer = setTimeout(() => setShowContinue(true), 1200);
		return () => clearTimeout(timer);
	}, [wowed]);

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
			<img
				src={dollSrc}
				className="h-[97vh] absolute top-[-27vh] left-[-9vw] test-shadow-darker z-5"
				style={{
					...drop(step >= 1, 900),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<h1
				className="text-[3vh] pt-serif max-w-[18vw] mx-auto text-center scribbler absolute bottom-[67vh] left-[17vw] bg-white border-2 border-black px-[1vw] py-[0.5vh] z-5 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Drops in at 0.4s. Once "Wow Cool!" is clicked it drops 48vh lower
					// with it (bottom-[67vh] → 19vh from the bottom)
					...drop(step >= 2, 800, LABEL_DROP),
					transform: wowed
						? "translateY(25vh)"
						: step >= 2
							? "translateY(0)"
							: "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] right-0 absolute"></span>
				Now people post their art on social medias
			</h1>

			{/* "Wow Cool!" - drops in at 0.8s; clicking it drops it and the label
			    above down low */}
			<button
				onClick={() => setWowed(true)}
				disabled={wowed}
				className="text-[3vh] pt-serif max-w-[18vw] mx-auto text-center scribbler absolute bottom-[58vh] left-[25vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-1 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					// Once clicked it drops 48vh lower: bottom-[58vh] → 10vh from the
					// bottom of the page
					...drop(step >= 3, 800, LABEL_DROP),
					transform: wowed
						? "translateY(25vh)"
						: step >= 3
							? "translateY(0)"
							: "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] right-0 absolute"></span>
				Wow Cool!
			</button>

			<button
				onClick={() => setWowed(true)}
				disabled={wowed}
				className="text-[3vh] pt-serif max-w-[18vw] mx-auto text-center scribbler absolute bottom-[58vh] left-[25vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-1 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					// Once clicked it drops 48vh lower: bottom-[58vh] → 10vh from the
					// bottom of the page
					...drop(step >= 3, 800, LABEL_DROP),
					transform: wowed
						? "translateY(25vh)"
						: step >= 3
							? "translateY(0)"
							: "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] right-0 absolute"></span>
				Wow Cool!
			</button>

			<h2
				className="text-[3vh] pt-serif max-w-[17vw] mx-auto text-center scribbler absolute bottom-[60vh] left-[20vw] bg-white border-2 border-black px-[1vw] py-[0.5vh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Drops in from above 0.4s after "Wow Cool!" is clicked. Starts
					// 100vh up so its long strings are off screen too
					...drop(wowed),
					transitionDelay: wowed ? "400ms" : "0ms",
					transform: wowed ? "translateY(0)" : "translateY(-100vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[70vh] top-[-70vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[70vh] top-[-70vh] right-0 absolute"></span>
				There is digital and traditional art, that people post.
			</h2>

			{/* Posts - a vertical marquee on the right that scrolls up forever.
			    It starts at the top of the screen (the content area starts 25vh
			    down). Two copies of the set slide up by one set's height (-50%),
			    so the loop is seamless - the gap below each copy (pb) must match
			    the gap between posts */}
			{/* The two lines - outside the marquee so they stay still (anything
			    inside it moves with it, even "fixed"), and before it so they sit
			    behind the posts. Same spot and width as a post (60vh tall at
			    944×1302 is 60 × 944 / 1302 ≈ 43.5vh wide) */}
			<div className="absolute top-[-25vh] right-[0vw] h-[100vh] w-[43.5vh] test-shadow-darker">
				<span className="w-[0.1vw] bg-black/60 h-full top-0 left-[2vw] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-full top-0 right-[2vw] absolute"></span>
			</div>

			<div
				ref={marqueeRef}
				className="absolute top-[-25vh] right-[0vw] flex flex-col marquee-up test-shadow-darker"
				onMouseEnter={() => easeMarqueeTo(0.3)}
				onMouseLeave={() => easeMarqueeTo(1)}
			>
				{[0, 1].map((copy) => (
					<div
						key={copy}
						className="flex flex-col gap-[4vh] pb-[4vh]"
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
									className="h-[60vh] w-auto max-w-none"
									alt={`Instagram-style art post ${i + 1}`}
								/>
							</a>
						))}
					</div>
				))}
			</div>

			{/* Continue - rises in once the last label has dropped in. After the
			    marquee in the code so it sits in front of the posts */}
			<PopsicleButton
				onClick={nextPage}
				style={{
					...drop(showContinue, 900, BUTTON_DROP),
					transform: showContinue ? "translateY(0)" : "translateY(100vh)",
					// Inline so these beat the component's right-0, bottom-0 and
					// test-shadow-darker: further right, lower, and a darker shadow
					right: "-5vw",
					bottom: "-2vh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
