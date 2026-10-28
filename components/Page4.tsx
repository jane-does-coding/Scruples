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
const LABELS_UP_MS = 800;

const drop = (shown: boolean, ms = 800, easing = DOLL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

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
	const portrait = usePortrait();
	const dollSrc = useBlinkingDoll();

	const [wowed, setWowed] = useState(false);

	const [soWhat, setSoWhat] = useState(false);

	const [showContinue, setShowContinue] = useState(false);
	useEffect(() => {
		if (!soWhat) return;
		const timer = setTimeout(
			() => setShowContinue(true),
			LABELS_UP_MS + 1000 + 800,
		);
		return () => clearTimeout(timer);
	}, [soWhat]);

	const marqueeRef = useRef<HTMLDivElement>(null);
	const speedFrame = useRef(0);
	const easeMarqueeTo = (target: number) => {
		const animation = marqueeRef.current?.getAnimations()[0];
		if (!animation) return;

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
					...drop(step >= 2, 800, LABEL_DROP),
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

			<button
				onClick={() => setWowed(true)}
				disabled={wowed}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 portrait:max-w-[44vw] portrait:px-[2.5vw] max-w-[18vw] mx-auto text-center scribbler absolute bottom-[58svh] left-[25vw] portrait:bottom-[36svh] portrait:left-[14vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-1 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(step >= 3, 800, LABEL_DROP),
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

			<button
				onClick={() => setSoWhat(true)}
				disabled={!wowed || soWhat}
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
					...drop(wowed),
					transitionDelay: wowed && !soWhat ? "400ms" : "0ms",
					transform: wowed && !soWhat ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[70svh] top-[-70svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[70svh] top-[-70svh] right-0 absolute"></span>
				There is digital and traditional art, that people post.
			</p>

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

			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					transition: `transform 900ms ${DOLL_DROP}`,
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
									tabIndex={copy === 1 ? -1 : undefined}
								>
									<img
										src={src}
										className="h-[60svh] portrait:h-[30svh] w-auto max-w-none"
										alt={`Instagram-style art post ${i + 1}`}
										data-hit
									/>
								</a>
							))}
						</div>
					))}
				</div>
			</div>

			<PopsicleButton
				onClick={nextPage}
				href="/meet-daphne"
				style={{
					...drop(showContinue, 900, BUTTON_DROP),
					transform: showContinue ? "translateY(0)" : "translateY(100svh)",
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
