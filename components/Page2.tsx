import PopsicleButton from "@/components/PopsicleButton";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useStage } from "@/components/Stage";
import { FRAMES, type FrameSize } from "@/lib/frames";
import { asset } from "@/lib/asset";
import Zhenya from "@/components/Zhenya";

// Extra-wide is sized so it's the same height as a wide frame
// (frame4 is 1018×762, wide frames are 762×705)
const FRAME_SIZES: Record<FrameSize, string> = {
	// Squashed to 90% height (1229 × 0.9 ≈ 1106) - aspect-ratio rather than
	// scale-y, so the layout box matches and labels sit right under it
	// (On portrait screens they're sized by height instead, as vw is tiny)
	tall: "w-[17vw] portrait:w-[19svh] aspect-[800/1106]",
	wide: "w-[20vw] portrait:w-[25svh] mt-[0svh]",
	"extra-wide": "w-[21vw] portrait:w-[27svh] mt-[0svh]",
};

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

// Where the marquee was when you left this page (e.g. to open a painting),
// so it carries on from there when you come back instead of starting over
let marqueeTime: CSSNumberish | null = null;

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

	// Clicking a frame closes the curtains and opens its page
	const { goTo } = useStage();

	// Drop the doll, then the labels, in once the curtains have opened,
	// then raise the Continue button
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[800, 3],
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
		? asset("/imgs/wiggle.webp")
		: blinking
			? asset("/imgs/blink.webp")
			: asset("/imgs/doll3.webp");

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
	// Pick up where it left off, and remember where it is when leaving. A
	// layout effect, so on the way out the strip is still on the page (and
	// its animation still running) when its position is read
	useLayoutEffect(() => {
		const el = marqueeRef.current;
		const animation = el?.getAnimations()[0];
		if (animation && marqueeTime !== null) animation.currentTime = marqueeTime;
		return () => {
			const leaving = el?.getAnimations()[0];
			if (leaving?.currentTime != null) marqueeTime = leaving.currentTime;
		};
	}, []);

	// Only slows down once the pointer has stayed on the marquee for 1s
	const slowDownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(
		() => () => {
			cancelAnimationFrame(speedFrame.current);
			clearTimeout(slowDownTimer.current);
		},
		[],
	);

	return (
		<div className="h-full flex flex-col items-center justify-center">
			{/* Doll */}
			<Zhenya
				src={dollImage}
				className="h-svh absolute top-[-27svh] left-[-8vw] portrait:h-[62svh] portrait:top-[-10svh] portrait:left-[-22vw] max-w-none test-shadow-darker z-5"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<h1
				className="text-[3svh] portrait:text-[2.3svh] max-w-[70%] mx-auto text-center scribbler absolute top-[-7svh] right-[25vw] portrait:top-0 portrait:right-[12vw] bg-white border-[0.2svh] border-black px-[2vw] py-[1svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 2),
					transform: step >= 2 ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] right-0 absolute"></span>
				Zhenya likes art
			</h1>
			<p
				className="text-[3svh] portrait:text-[2.3svh] max-w-[70%] mx-auto text-center scribbler absolute top-[1svh] right-[13vw] portrait:top-[8svh] portrait:right-[16vw] bg-white border-[0.2svh] border-black px-[2vw] py-[1svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 3),
					transform: step >= 3 ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] right-0 absolute"></span>
				Click on some pieces
			</p>

			{/* Picture frames - two copies of the set slide left by one set's width
			    (-50%), so the loop is seamless */}
			<div
				ref={marqueeRef}
				className="absolute top-[12svh] portrait:top-[21svh] left-0 flex w-max marquee"
				onMouseEnter={() => {
					slowDownTimer.current = setTimeout(() => easeMarqueeTo(0.3), 1000);
					setHoveringArt(true);
				}}
				onMouseLeave={() => {
					clearTimeout(slowDownTimer.current);
					easeMarqueeTo(1);
					setHoveringArt(false);
				}}
			>
				{[0, 1].map((copy) => (
					<div
						key={copy}
						className="flex items-center justify-center gap-[5vw] pr-[4vw] portrait:gap-[6svh] portrait:pr-[5svh] test-shadow"
						aria-hidden={copy === 1}
					>
						{FRAMES.map(({ slug, src, size, label }) => (
							// A real link, so search engines can follow it and it can be
							// opened in a new tab; a plain click still goes through the
							// curtains instead of jumping straight there
							<a
								className="relative cursor-pointer text-center"
								key={src}
								href={`/art-piece/${slug}`}
								onClick={(e) => {
									if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
										return;
									e.preventDefault();
									goTo(`/art-piece/${slug}`);
								}}
								aria-label={label}
								// The second copy is only there for the loop
								tabIndex={copy === 1 ? -1 : undefined}
							>
								<img
									src={asset("/imgs/popsicle.webp")}
									className="absolute top-[30%] left-[50%] translate-x-[-50%] h-[80svh] min-w-[22vw] portrait:min-w-[22svh] z-1"
									alt="Wooden popsicle stick holding up the frame"
								/>
								<img
									src={src}
									className={`${FRAME_SIZES[size]} relative z-2`}
									alt={`${label}, painting in a picture frame`}
								/>
								{/* Label - sits right under the frame image */}
								<span className="border-[0.2svh] border-black bg-white px-[1vw] portrait:px-[3vw] py-[0.5svh] text-[3svh] portrait:text-[2.3svh] left-[50%] translate-x-[-50%] absolute top-full mt-[1svh] z-5 w-max whitespace-nowrap portrait:whitespace-normal portrait:max-w-[24svh] text-center">
									{/* Just the title - the year is on its page */}
									{label.split(" • ")[0]}
								</span>
							</a>
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
				src={asset("/imgs/popsicle.webp")}
				alt=""
				className="absolute w-[15vw] mx-auto bottom-[-13svh] z-[-5]"
			/>
			<button
				onClick={nextPage}
				className="absolute bottom-[3svh] cursor-pointer mx-auto border-[0.3svh] border-black px-6 py-2 z-20 bg-white border-[0.3svh] border-black border-dashed px-[2vw] py-[1svh] text-[2.5svh]"
			>
				Inventory
			</button> */}

			<PopsicleButton
				onClick={nextPage}
				href="/page3"
				style={{
					...drop(step >= 4, 900, BUTTON_DROP),
					// Inline so it beats the component's right-0
					right: "-5vw",
					transform: step >= 4 ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
