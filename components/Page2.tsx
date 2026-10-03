import PopsicleButton from "@/components/PopsicleButton";
import { useEffect, useRef, useState } from "react";

// Extra-wide is sized so it's the same height as a wide frame
// (frame4 is 1018×762, wide frames are 762×705)
const FRAME_SIZES = {
	// Squashed to 90% height (1229 × 0.9 ≈ 1106) - aspect-ratio rather than
	// scale-y, so the layout box matches and labels sit right under it
	tall: "w-[17vw] aspect-[800/1106]",
	wide: "w-[20vw] mt-[0vh]",
	"extra-wide": "w-[21vw] mt-[0vh]",
};

// Tall frames alternate with wide ones. `label` is shown under each frame
const FRAMES: {
	src: string;
	size: keyof typeof FRAME_SIZES;
	label: string;
}[] = [
	{ src: "/imgs/frame1.png", size: "tall", label: "Scream • 1893" },
	{
		src: "/imgs/frame3.png",
		size: "wide",
		label: "Sunflowers • 1887",
	},
	{
		src: "/imgs/frame2.png",
		size: "tall",
		label: "Girl with a Pearl Earring • 1665",
	},
	{
		src: "/imgs/frame4.png",
		size: "extra-wide",
		label: "The Starry Night • 1889",
	},
	{
		src: "/imgs/frame5.png",
		size: "tall",
		label: "The Persistence of Memory • 1931",
	},
	{
		src: "/imgs/frame6.png",
		size: "wide",
		label: "The Water Lily Pond • 1899",
	},
];

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

export default function Page2({
	nextPage,
	previousPage,
	curtainsOpen,
}: PageProps) {
	const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
	const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
	const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

	const drop = (shown: boolean, ms = 800, easing = LABEL_DROP) => ({
		transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
		visibility: shown ? ("visible" as const) : ("hidden" as const),
	});
	const [step, setStep] = useState(0);

	// Drop the doll, then the labels, in once the curtains have opened,
	// then raise the Continue button
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[600, 3],
			[2000, 4],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	// While the marquee is hovered the doll stops wiggling and idles like on
	// Page 1, blinking every 3 seconds
	const [hoveringArt, setHoveringArt] = useState(false);
	const [blinking, setBlinking] = useState(false);
	useEffect(() => {
		if (!hoveringArt) return;

		let blinkEnd: ReturnType<typeof setTimeout>;
		const interval = setInterval(() => {
			setBlinking(true);
			blinkEnd = setTimeout(() => setBlinking(false), 1000);
		}, 3000);

		return () => {
			clearInterval(interval);
			clearTimeout(blinkEnd);
			// Next hover starts on the idle frame, not mid-blink
			setBlinking(false);
		};
	}, [hoveringArt]);
	const dollImage = !hoveringArt
		? "/imgs/wiggle.gif"
		: blinking
			? "/imgs/blink.gif"
			: "/imgs/doll3.png";

	// Marquee eases down to 30% speed on hover. playbackRate is changed
	// rather than the CSS duration, so the strip keeps its place instead of jumping
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

	return (
		<div className="h-full flex flex-col items-center justify-center">
			{/* Doll */}
			<img
				src={dollImage}
				className="h-[100vh] absolute top-[-27vh] left-[-8vw] test-shadow-darker z-5"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}}
				alt=""
			/>

			<h1
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute top-[-7vh] right-[25vw] bg-white border-2 border-black px-[2vw] py-[1vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 2),
					transform: step >= 2 ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15vh] top-[-15vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15vh] top-[-15vh] right-0 absolute"></span>
				Zhenya likes art
			</h1>
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute top-[1vh] right-[13vw] bg-white border-2 border-black px-[2vw] py-[1vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 3),
					transform: step >= 3 ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15vh] top-[-15vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15vh] top-[-15vh] right-0 absolute"></span>
				Click on some pieces
			</h2>

			{/* Picture frames - two copies of the set slide left by one set's width
			    (-50%), so the loop is seamless */}
			<div
				ref={marqueeRef}
				className="absolute top-[15vh] left-0 flex w-max marquee"
				onMouseEnter={() => {
					easeMarqueeTo(0.3);
					setHoveringArt(true);
				}}
				onMouseLeave={() => {
					easeMarqueeTo(1);
					setHoveringArt(false);
				}}
			>
				{[0, 1].map((copy) => (
					<div
						key={copy}
						className="flex items-center justify-center gap-[5vw] pr-[4vw] test-shadow"
						aria-hidden={copy === 1}
					>
						{FRAMES.map(({ src, size, label }) => (
							<div className="relative" key={src}>
								<img
									src="/imgs/popsicle.png"
									className="absolute top-[30%] left-[50%] -translate-x-[50%] h-[80vh] min-w-[22vw] z-1"
									alt=""
								/>
								<img
									src={src}
									className={`${FRAME_SIZES[size]} relative z-2`}
									alt=""
								/>
								{/* Label - sits right under the frame image */}
								<p className="border-[0.2vh] bg-white px-[1vw] py-[1vh] text-[2vh] left-[50%] -translate-x-[50%] absolute top-full mt-[1vh] z-5 w-max max-w-[22vw] text-center">
									{label}
								</p>
							</div>
						))}
					</div>
				))}
			</div>

			{/* <div className="z-10">
				<PopsicleButton onClick={previousPage} side="left">
					{"<-"} Back
				</PopsicleButton>
			</div>
 */}
			{/* <img
				src="/imgs/popsicle.png"
				alt=""
				className="absolute w-[15vw] mx-auto bottom-[-13vh] z-[-5]"
			/>
			<button
				onClick={nextPage}
				className="absolute bottom-[3vh] cursor-pointer mx-auto border-2 border-black px-6 py-2 z-20 bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] text-[2.5vh]"
			>
				Inventory
			</button> */}

			<PopsicleButton
				onClick={nextPage}
				style={{
					...drop(step >= 4, 900, BUTTON_DROP),
					// Inline so it beats the component's right-0
					right: "-5vw",
					transform: step >= 4 ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
