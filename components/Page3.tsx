import PopsicleButton from "@/components/PopsicleButton";
import { useEffect, useState } from "react";

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

export default function Page3({
	nextPage,
	previousPage,
	curtainsOpen,
}: PageProps) {
	const [step, setStep] = useState(0);

	// Clicking the souvenir or "Click to enter" swaps the souvenir for the
	// button pins: souvenir down, label up, then the pins rise in and the
	// "Next item" and "Exit" labels drop in
	const [entered, setEntered] = useState(false);
	// Stays true after the first click, so leaving (Exit) slides things off
	// screen instead of hiding them instantly
	const [opened, setOpened] = useState(false);
	// Which item is up while in the shop: 0 = button pins, 1 = pens,
	// 2 = notebook, 3 = Mona Lisa.
	// "Next item" and "Prev item" cycle through them
	const [item, setItem] = useState(0);
	const ITEM_COUNT = 4;
	const enter = () => {
		setEntered(true);
		setOpened(true);
		setItem(0);
	};
	const pinsUp = entered && item === 0;
	const pensUp = entered && item === 1;
	const notebookUp = entered && item === 2;
	const monaUp = entered && item === 3;
	// When leaving, the souvenir and "Click to enter" come back after the pins
	// and labels have started moving away (the entrance in reverse)
	const leaving = opened && !entered;

	// Once the curtains have opened: the doll drops in and the souvenir rises
	// in, then "Click to enter", then the Continue button (same timing as Page 2)
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			// Doll takes 900ms to drop, so this is 0.3s after it lands
			[1200, 2],
			[2000, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	return (
		<div className="h-full flex flex-col items-center justify-center">
			<img
				src={"/imgs/blink.webp"}
				className="h-[100vh] absolute top-[-32.5vh] right-[-5vw] test-shadow-darker z-5 -scale-x-[1]"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			{/* "Click to enter" - lifts back up once clicked */}
			<button
				onClick={enter}
				disabled={entered}
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[59vh] left-[28vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(step >= 2),
					transitionDelay: leaving ? "900ms" : "0ms",
					transform:
						step >= 2 && !entered ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Click to enter
			</button>

			{/* Souvenir - rises in from the bottom with its sticks, and sinks back
			    down once clicked */}
			<button
				onClick={enter}
				disabled={entered}
				aria-label="Enter the souvenir shop"
				className="absolute bottom-[5vh] left-[-3vw] test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transitionDelay: leaving ? "400ms" : "0ms",
					transform:
						step >= 1 && !entered ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				<img
					src="/imgs/souvenir.webp"
					className="h-[70vh] z-5 relative"
					alt="Souvenir shop"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] left-[-8vw] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the souvenir"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] right-[-10vw] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the souvenir"
				/>
			</button>

			{/* Button pins - rise in where the souvenir was, 0.4s after the click
			    (or after "Next item"), and sink when another item comes up */}
			<div
				className="absolute bottom-[5vh] left-[4vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pinsUp ? "400ms" : "0ms",
					transform: pinsUp ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				<img
					src="/imgs/buttons.webp"
					className="h-[60vh] z-5 relative"
					alt="Art Gallery card of four button pins"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] left-[-10vw] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the button pins"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] right-[-10vw] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the button pins"
				/>
			</div>

			{/* Pens - same as the pins: rise in 0.4s after "Next item", and sink
			    when another item comes up */}
			<div
				className="absolute bottom-[5vh] left-[10vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pensUp ? "400ms" : "0ms",
					transform: pensUp ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				<img
					src="/imgs/pens.webp"
					className="h-[70vh] z-5 relative"
					alt="Pack of six Micron pens"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] left-[50%] -translate-x-[50%] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the pens"
				/>
			</div>

			{/* Mona Lisa - same as the pins and pens */}
			<div
				className="absolute bottom-[5vh] left-[5vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: monaUp ? "400ms" : "0ms",
					transform: monaUp ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				<img
					src="/imgs/mona_lisa.webp"
					className="h-[60vh] z-5 relative"
					alt="The Mona Lisa in a picture frame"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] left-[50%] -translate-x-[50%] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the Mona Lisa"
				/>
			</div>

			{/* Notebook - same as the pins and pens */}
			<div
				className="absolute bottom-[1vh] left-[9vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: notebookUp ? "400ms" : "0ms",
					transform: notebookUp ? "translateY(0)" : "translateY(100vh)",
				}}
			>
				<img
					src="/imgs/notebook.webp"
					className="h-[60vh] z-5 relative"
					alt="Ruled notebook"
				/>
				<img
					src="/imgs/popsicle.webp"
					className="absolute top-[50%] left-[50%] -translate-x-[50%] h-[60vh] min-w-[22vw] z-1"
					alt="Wooden popsicle stick holding up the notebook"
				/>
			</div>

			{/* "Next item" - drops in 0.9s after the click */}
			<h2
				onClick={() => setItem((i) => (i + 1) % ITEM_COUNT)}
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[59vh] left-[28vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer"
				style={{
					...drop(opened),
					transitionDelay: entered ? "900ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Next item
			</h2>
			{/* "Buy the buttons" - down while the pins are up, lifts away when
			    another item comes up - moves in time with the pins */}
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[67vh] left-[22vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Same timing as the item: 0.4s delay, then the same 900ms drop
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pinsUp ? "400ms" : "0ms",
					transform: pinsUp ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Buy the buttons for $10
			</h2>

			{/* "Buy the pens" - same, for the pens */}
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[67vh] left-[22vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Same timing as the item: 0.4s delay, then the same 900ms drop
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pensUp ? "400ms" : "0ms",
					transform: pensUp ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Buy the pens for $15
			</h2>

			{/* "Buy the Mona Lisa" - same, for the Mona Lisa */}
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[67vh] left-[17vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Same timing as the item: 0.4s delay, then the same 900ms drop
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: monaUp ? "400ms" : "0ms",
					transform: monaUp ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Buy the Mona Lisa for $1,000,000,000
			</h2>

			{/* "Buy the notebook" - same, for the notebook */}
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[67vh] left-[17vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					// Same timing as the item: 0.4s delay, then the same 900ms drop
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: notebookUp ? "400ms" : "0ms",
					transform: notebookUp ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Buy the notebook for $7
			</h2>

			{/* "Exit" - drops in on the left, 1.1s after the click */}
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[59vh] left-[2vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				onClick={() => setEntered(!entered)}
				style={{
					...drop(opened),
					transitionDelay: entered ? "1100ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Exit
			</h2>

			{/* "Prev item" - under "Exit", drops in 1.3s after the click */}
			<h2
				className="text-[3vh] pt-serif max-w-[70%] mx-auto text-center scribbler absolute bottom-[51vh] left-[-1vw] bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer"
				onClick={() => setItem((i) => (i - 1 + ITEM_COUNT) % ITEM_COUNT)}
				style={{
					...drop(opened),
					transitionDelay: entered ? "1300ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(-60vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[25vh] top-[-25vh] right-0 absolute"></span>
				Prev item
			</h2>

			<div className="z-10">
				<PopsicleButton
					onClick={nextPage}
					style={{
						...drop(step >= 3, 900, BUTTON_DROP),
						// Inline so it beats the component's right-0
						right: "-5vw",
						transform: step >= 3 ? "translateY(0)" : "translateY(100vh)",
					}}
				>
					Continue {"->"}
				</PopsicleButton>
			</div>

			{/* 	<PopsicleButton onClick={previousPage} side="left">
				{"<-"} Back
			</PopsicleButton> */}
		</div>
	);
}
