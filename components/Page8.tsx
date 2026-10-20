import { useEffect, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import Zhenya from "@/components/Zhenya";

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

// Page 8 - still to be written. For now: Zhenya drops in on the left, the
// title hangs in, then Continue rises
export default function Page8({ nextPage, curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);

	// Zhenya, idle and blinking every 1-3s
	const blinkSrc = useBlinkingDoll();

	// Once the curtains have opened: the doll drops in, then the title,
	// then the Continue button
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[1200, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	return (
		<div className="h-full flex flex-col items-center justify-center relative">
			{/* Title */}
			<h1
				className="text-[4svh] portrait:text-[2.8svh] max-w-[70%] mx-auto text-center scribbler absolute top-0 right-[10vw] portrait:right-[12vw] portrait:top-[26svh] portrait:max-w-[50vw] bg-white border-[0.2svh] border-black px-[2vw] portrait:px-[3vw] py-[1svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 2),
					transform: step >= 2 ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] right-0 absolute"></span>
				Page 8
			</h1>

			{/* Doll */}
			<Zhenya
				src={blinkSrc}
				className="h-svh absolute top-[-30svh] left-[-5vw] portrait:h-[66svh] portrait:top-[-10svh] portrait:left-[-16vw] max-w-none test-shadow"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<PopsicleButton
				onClick={nextPage}
				href="/page9"
				style={{
					...drop(step >= 3, 900, BUTTON_DROP),
					transform: step >= 3 ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
