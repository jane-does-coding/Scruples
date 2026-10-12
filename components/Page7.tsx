import { useEffect, useState } from "react";
import useBlinkingDoll from "@/components/useBlinkingDoll";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

// Page 7 - Zhenya alone in the middle of the stage, under a spotlight: a
// circle of normal light around her, and everything outside it (curtains
// included) darker

const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

// Once the curtains have opened: Zhenya drops in, then the lights go down
// around her
const SPOTLIGHT_MS = 900;

export default function Page7({ curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);
	const blinkSrc = useBlinkingDoll();

	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[SPOTLIGHT_MS, 2],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	return (
		<div className="h-full flex flex-col items-center justify-center">
			{/* The page's title, for screen readers and search engines */}
			<h1 className="sr-only">Zhenya in the spotlight</h1>

			{/* The spotlight - covers the whole screen, above the curtains
			    (z-10): clear in a circle around Zhenya, dark outside it */}
			<div
				aria-hidden
				className="fixed inset-0 z-[11] pointer-events-none transition-opacity duration-[1200ms] ease-in-out"
				style={{
					opacity: step >= 2 ? 1 : 0,
					background:
						"radial-gradient(circle at 50% 52%, transparent 0, transparent 34vh, rgba(0, 0, 0, 0.72) 35vh)",
				}}
			/>

			{/* Zhenya - drops into the middle, in front of the dark, with an
			    extra dark shadow */}
			<img
				src={blinkSrc}
				className="h-[100vh] w-auto max-w-none absolute top-[-28vh] left-[50%] -translate-x-[50%] z-[12]"
				style={{
					filter: "drop-shadow(16px 16px 4px #000000e6)",
					visibility: step >= 1 ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}`,
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}}
				alt="Zhenya, a marionette doll on strings, standing in a spotlight"
			/>
		</div>
	);
}
