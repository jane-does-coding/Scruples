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

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const drop = (shown: boolean, ms = 800, easing = LABEL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

export default function Page1({ nextPage, curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);

	// Controls whether the "Hi" response/buttons have appeared
	const [saidHi, setSaidHi] = useState(false);

	// The doll: idle and blinking every 1-3s, except while it's doing the
	// "moving" animation after "Say Hi"
	const blinkSrc = useBlinkingDoll();
	const [moving, setMoving] = useState(false);
	const movingTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[200, 2],
			[500, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	const handleSayHi = () => {
		// Show the "Hi" response and buttons
		setSaidHi(true);

		// Play moving animation
		setMoving(true);

		// Return to idle (and blinking) after 2 seconds
		clearTimeout(movingTimer.current);
		movingTimer.current = setTimeout(() => setMoving(false), 2000);
	};

	return (
		<div className="h-full flex flex-col items-center justify-center relative">
			{/* Title */}
			<h1
				className="text-[4vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute top-0 right-[10vw] bg-white border-2 border-black px-[2vw] py-[1vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 2),
					transform: step >= 2 ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15vh] top-[-15vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15vh] top-[-15vh] right-0 absolute"></span>
				This is Zhenya
			</h1>

			{/* Say Hi button */}
			<div
				className="absolute right-[18vw] drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 3),
					top: step >= 3 ? "22.5vh" : "-60vh",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[40vh] top-[-40vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[40vh] top-[-40vh] right-0 absolute"></span>

				<button
					onClick={handleSayHi}
					className="text-[4vh] pt-serif text-center scribbler relative bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] z-20 cursor-pointer"
				>
					Say &quot;Hi&quot; to Zhenya!
				</button>
			</div>

			{/* Hi response */}
			<h3
				className="text-[4vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute right-[22vw] bg-white border-2 border-black px-[2vw] py-[1vh] z-0 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(saidHi),
					top: saidHi ? "35vh" : "-60vh",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[50vh] top-[-50vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[50vh] top-[-50vh] right-0 absolute"></span>
				&quot;Hi&quot;
			</h3>

			{/* Doll */}
			<img
				src={moving ? asset("/imgs/moving.webp") : blinkSrc}
				className="h-[100vh] absolute top-[-30vh] left-[-5vw] test-shadow"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<PopsicleButton
				onClick={nextPage}
				style={{
					...drop(saidHi, 900, BUTTON_DROP),
					transitionDelay: saidHi ? "400ms" : "0ms",
					transform: saidHi ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
