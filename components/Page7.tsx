import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import usePortrait from "@/components/usePortrait";
import * as sound from "@/lib/sound";

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

// Once the curtains have opened: Zhenya drops in, then the spotlight
// switches on
const SPOTLIGHT_MS = 900;

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const hang = (
	everShown: boolean,
	inPlace: boolean,
	from: "top" | "bottom",
	{ ms = 800, easing = LABEL_DROP, delay = 0, exitDelay = 0 } = {},
) => ({
	visibility: everShown ? ("visible" as const) : ("hidden" as const),
	transition: `transform ${ms}ms ${easing} ${inPlace ? delay : exitDelay}ms`,
	transform: inPlace
		? "translateY(0)"
		: `translateY(${from === "top" ? "-100svh" : "100svh"})`,
});

// A label's face, without its shadow (the shadow goes on the whole hanging
// label, so it doesn't flip with it)
const FACE =
	"text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh]";

const LABEL =
	" text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darkest";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer disabled:cursor-default`;

// A label's two hanging strings
const Strings = () => (
	<>
		<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] right-0 absolute"></span>
	</>
);

// The labels around Zhenya, in the order they drop in (and leave)
const LABELS = [
	{ text: "Magic Button is Horrible!", top: "-2svh", left: "20%" },
	{ text: "Did YOU ever use it?", top: "3.5svh", left: "80%" },
	{ text: "It DESTROYS creativity", top: "17svh", left: "7%" },
	{ text: "Magic Button isn't real art!", top: "19svh", left: "92%" },
	{ text: "F*ck Magic Button!", top: "34svh", left: "7%" },
	{ text: "Art is human.", top: "33svh", left: "92%" },
	{ text: "Magic button is Soulless", top: "48svh", left: "90%" },
	{ text: "Human art is REAL art", top: "52svh", left: "15%" },
];
// How far apart they drop in, and lift away
const LABEL_STAGGER_MS = 250;
const LABEL_EXIT_STAGGER_MS = 50;
// After the spotlight comes on (ms): the last label has landed (each drop
// takes 800ms), and "Whaaa-" rises 0.5s later
const LABELS_IN_MS = (LABELS.length - 1) * LABEL_STAGGER_MS + 800;
const WHAAA_MS = LABELS_IN_MS + 500;
// Clicking "Whaaa-" flips every label over to "But why?" (FLIP_MS long);
// 2s after the flip, the labels lift away
const FLIP_MS = 700;
const LABELS_OUT_MS = FLIP_MS + 2000;
// After "Whaaa-", the spotlight goes off once the last label has lifted away
// (each takes 800ms)
const SPOTLIGHT_OFF_MS = (LABELS.length - 1) * LABEL_EXIT_STAGGER_MS + 800;

export default function Page7({ curtainsOpen }: PageProps) {
	// For Continue, which goes on to the last page (for now - more pages are
	// coming before it)
	const { goTo } = useStage();
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

	const [stage, setStage] = useState(0);

	// A thunderclap as the spotlight switches on
	useEffect(() => {
		if (step === 2) sound.thunder();
	}, [step]);

	// The labels all flip over to "But why?" together when "Whaaa-" is
	// clicked
	const [flipped, setFlipped] = useState(false);
	// Phones held upright: a smaller Zhenya and spotlight, and the labels in
	// two columns either side of her (left, right, left, right…) instead of
	// scattered around
	const portrait = usePortrait();
	const labelPlace = (i: number, top: string, left: string) =>
		portrait
			? {
					top: `${-1 + Math.floor(i / 2) * 12 + (i % 2) * 4}svh`,
					left: i % 2 ? "81%" : "19%",
				}
			: { top, left };
	// "Whaaa-": it sinks away and the labels flip to "But why?"; 2s after
	// the flip they lift away one by one, then the spotlight goes off (and
	// Zhenya turns and goes right)
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);
	const whaaa = () => {
		if (flipped) return;
		setFlipped(true);
		timers.current.push(
			setTimeout(() => setStage(1), LABELS_OUT_MS),
			setTimeout(() => setStage(2), LABELS_OUT_MS + SPOTLIGHT_OFF_MS),
		);
	};

	return (
		<div className="h-full flex flex-col items-center justify-center">
			{/* The page's title, for screen readers and search engines */}
			<h1 className="sr-only">Zhenya in the spotlight</h1>

			{/* The spotlight - switches on all at once. Covers the whole screen,
			    above the curtains (z-10): clear in a circle around Zhenya, dark
			    outside it */}
			<div
				aria-hidden
				className="fixed inset-0 z-[11] pointer-events-none"
				style={{
					// Switches on quickly (a quarter of a second, not instantly),
					// and off the same way after "Whaaa-", once the labels have
					// gone
					opacity: step >= 2 && stage < 2 ? 1 : 0,
					transition: "opacity 250ms ease-out",
					background:
						portrait
							? "radial-gradient(circle at 50% 52%, transparent 0, transparent min(30svh, 46vw), rgba(0, 0, 0, 0.72) calc(min(30svh, 46vw) + 1svh))"
							: "radial-gradient(circle at 50% 60%, transparent 0, transparent 33svh, rgba(0, 0, 0, 0.72) 34svh)",
				}}
			/>

			{/* The labels - drop in one by one once the spotlight is on; lift
			    away one by one, in the same order, after "Whaaa-" */}
			{/* When "Whaaa-" is clicked they all flip over together (like
			    cards on their strings) - the backs say "But why?" */}
			{LABELS.map(({ text, top, left }, i) => (
				<div
					key={text}
					className="absolute -translate-x-[50%] text-[4svh] portrait:text-[2.3svh] w-max portrait:max-w-[35vw] z-20 drop-shadow-md drop-shadow-black/40 test-shadow-darkest perspective-[100svh]"
					style={{
						...labelPlace(i, top, left),
						// Earlier (higher up) labels in front, so the strings of the
						// ones below run behind them
						zIndex: 20 + LABELS.length - i,
						...hang(step >= 2, step >= 2 && stage < 1, "top", {
							delay: i * LABEL_STAGGER_MS,
							exitDelay: i * LABEL_EXIT_STAGGER_MS,
						}),
					}}
				>
					<Strings />
					<div
						className="relative transform-3d"
						style={{
							transition: `transform ${FLIP_MS}ms cubic-bezier(0.34, 1.2, 0.64, 1)`,
							transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
						}}
					>
						<p className={`${FACE} backface-hidden`}>{text}</p>
						<p
							aria-hidden={!flipped}
							className={`${FACE} backface-hidden absolute inset-0 flex items-center justify-center rotate-y-180`}
						>
							But why?
						</p>
					</div>
				</div>
			))}

			{/* "Whaaa-" - on a popsicle like Continue, but lower and a little
			    smaller. Rises 0.5s after the last label lands; clicking it sinks
			    it, flips the labels to "But why?", and 2s later sends them away
			    and turns the spotlight off */}
			<PopsicleButton
				onClick={whaaa}
				style={{
					...hang(step >= 2, step >= 2 && !flipped, "bottom", {
						ms: 900,
						easing: BUTTON_DROP,
						delay: WHAAA_MS,
					}),
					right: "-4vw",
					bottom: "-4svh",
					scale: "0.85",
					transformOrigin: "100% 100%",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					// Above the spotlight's dark (z-11)
					zIndex: 20,
				}}
			>
				Whaaa-
			</PopsicleButton>

			{/* Continue - rises once Zhenya has turned and walked off to the
			    right after the spotlight goes out; on to the last page */}
			<PopsicleButton
				onClick={() => goTo("/lastpage")}
				href="/lastpage"
				style={{
					...hang(stage >= 2, stage >= 2, "bottom", {
						ms: 900,
						easing: BUTTON_DROP,
						delay: 2200,
					}),
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					zIndex: 20,
				}}
			>
				Continue {"->"}
			</PopsicleButton>

			{/* Zhenya - drops into the middle, under the curtains (z-10) like on
			    the other pages, with an extra dark shadow. Whatever of her is
			    outside the spotlight (the strings at the top) is in the dark */}
			<img
				src={blinkSrc}
				className="h-[100svh] w-auto max-w-none absolute top-[-28svh] portrait:h-[60svh] portrait:top-[-8svh] -translate-x-[50%] z-[9]"
				style={{
					// Once the spotlight is off: her shadow goes back to the usual
					// one, she's pulled up a little, turns round (the scale flips
					// through 0, like a cut-out) and goes over to the right
					filter:
						stage >= 2
							? "drop-shadow(12px 12px 2px #28282857)"
							: "drop-shadow(20px 30px 3px #000000e6)",
					visibility: step >= 1 ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}, filter 600ms ease, scale 600ms ease-in-out 300ms, left 1200ms ease-in-out 600ms`,
					transform:
						step < 1
							? "translateY(-120svh)"
							: stage >= 2
								? "translateY(-4svh)"
								: "translateY(0)",
					scale: stage >= 2 ? "-1 1" : "1 1",
					left: stage >= 2 ? (portrait ? "70%" : "78%") : "50%",
				}}
				alt="Zhenya, a marionette doll on strings, standing in a spotlight"
			/>
		</div>
	);
}
