import { useEffect, useState } from "react";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

// "Dropped on a string" easings - the 2nd number is how far past the
// landing spot it overshoots (1 = no bounce)
const LABEL_DROP = "cubic-bezier(0.34, 1.15, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.03, 0.64, 1)";

const drop = (shown: boolean, ms = 900, easing = LABEL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

export default function Page1({ nextPage, curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);
	const [saidHi, setSaidHi] = useState(false);

	// Once the curtains are open: doll falls, then the title, then the prompt
	useEffect(() => {
		if (!curtainsOpen) return;
		const timers = [
			[0, 1],
			[700, 2],
			[1700, 3],
			[1700, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));
		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	return (
		<div className="h-full flex flex-col items-center justify-center relative">
			<h1
				className="text-[4vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute top-0 right-[10vw] bg-white border-2 border-black px-[2vw] py-[1vh] z-2"
				style={{
					...drop(step >= 2),
					transform: step >= 2 ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black h-[15vh] top-[-15vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black h-[15vh] top-[-15vh] right-0 absolute"></span>
				This is Zhenya
			</h1>

			{/* Animated with `top`, not transform: a transform would trap the
			    button in its own layer, under the curtains */}
			<div
				className="absolute right-[20vw]"
				style={{ ...drop(step >= 3), top: step >= 3 ? "15vh" : "-60vh" }}
			>
				<span className="w-[0.1vw] bg-black h-[40vh] top-[-40vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black h-[40vh] top-[-40vh] right-0 absolute"></span>
				<button
					onClick={() => setSaidHi(true)}
					className="text-[3vh] pt-serif text-center scribbler relative bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] z-20 cursor-pointer"
				>
					Say &quot;Hi&quot; to Zhenya!
				</button>
			</div>

			<h3
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute right-[24vw] bg-white border-2 border-black px-[2vw] py-[1vh] z-0"
				style={{ ...drop(saidHi), top: saidHi ? "25vh" : "-60vh" }}
			>
				<span className="w-[0.1vw] bg-black/60 h-[40vh] top-[-40vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[40vh] top-[-40vh] right-0 absolute"></span>
				&quot;Hi&quot;
			</h3>

			<img
				src="/imgs/doll.png"
				className="h-[70vh] absolute top-[-10vh] left-[-7vw]"
				style={{
					...drop(step >= 1, 1100, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}}
				alt=""
			/>

			{/* Drops in once "Hi" has landed */}
			<button
				onClick={nextPage}
				className="absolute bottom-[8vh] cursor-pointer right-6 border-2 border-black px-6 py-2 z-20 bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] text-[3vh]"
				style={{
					...drop(saidHi),
					transitionDelay: saidHi ? "700ms" : "0ms",
					transform: saidHi ? "translateY(0)" : "translateY(-100vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black h-[80vh] top-[-80vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black h-[80vh] top-[-80vh] right-0 absolute"></span>
				Continue →
			</button>
		</div>
	);
}
