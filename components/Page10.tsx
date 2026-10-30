import { useEffect, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import * as sound from "@/lib/sound";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const TURN_EASE = "cubic-bezier(0.45, 0, 0.2, 1)";
const TURN_MS = 900;

const COUNT = 8;
const STEP_DEG = 360 / COUNT;
const W = 130;
const H = 100;
const CX = W / 2;
const R = 70;
const HOLE_Y = H / 2;
const HOLE_R = 10;

const hang = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform 900ms ${DROP} ${shown ? delay : 0}ms`,
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-110svh" : "110svh"})`,
});

const CIRCLES =
	"absolute left-[50%] translate-x-[-50%] top-[-17svh] portrait:top-[-12svh] h-svh w-[130svh] max-w-none overflow-visible test-shadow-darker";

const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-[1vw] absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-[1vw] absolute"></span>
	</>
);

const BUTTON =
	"absolute top-[35svh] portrait:top-[40svh] z-9 scribbler bg-white border-[0.3svh] border-black border-dashed px-[2vw] portrait:px-[2.5svh] py-[1svh] text-[4svh] portrait:text-[2.8svh] whitespace-nowrap cursor-pointer drop-shadow-md drop-shadow-black/40 test-shadow-darker";

export default function Page10({ previousPage, curtainsOpen }: PageProps) {
	const { goTo } = useStage();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const [step, setStep] = useState(0);

	const last = step === COUNT - 1;
	const next = () => {
		if (last) return;
		sound.click();
		setStep(step + 1);
	};
	const back = () => {
		if (step === 0) return previousPage();
		sound.click();
		setStep(step - 1);
	};

	return (
		<div className="h-full relative">
			<h1 className="sr-only">The wheel</h1>
			<p role="status" aria-live="polite" className="sr-only">
				{step + 1}
			</p>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				className={CIRCLES}
				style={hang(shown, "top")}
				aria-hidden
			>
				<g
					style={{
						transformOrigin: `${CX}px 0px`,
						transform: `rotate(${-step * STEP_DEG}deg)`,
						transition: `transform ${TURN_MS}ms ${TURN_EASE}`,
					}}
				>
					<circle
						cx={CX}
						cy={0}
						r={R}
						fill="#8fbfe6"
						stroke="black"
						strokeWidth="0.4"
					/>
					{Array.from({ length: COUNT }, (_, i) => (
						<text
							key={i}
							x={CX}
							y={HOLE_Y}
							transform={`rotate(${i * STEP_DEG} ${CX} 0)`}
							textAnchor="middle"
							dominantBaseline="central"
							className="scribbler"
							fontSize="13"
						>
							{i + 1}
						</text>
					))}
				</g>
			</svg>

			<svg
				viewBox={`0 0 ${W} ${H}`}
				className={CIRCLES}
				style={hang(shown, "bottom", 300)}
				aria-hidden
			>
				<path
					d={`M ${CX - R} ${H} A ${R} ${R} 0 1 0 ${CX + R} ${H} A ${R} ${R} 0 1 0 ${CX - R} ${H} Z
						M ${CX - HOLE_R} ${HOLE_Y} A ${HOLE_R} ${HOLE_R} 0 1 0 ${CX + HOLE_R} ${HOLE_Y} A ${HOLE_R} ${HOLE_R} 0 1 0 ${CX - HOLE_R} ${HOLE_Y} Z`}
					fillRule="evenodd"
					fill="white"
					stroke="black"
					strokeWidth="0.4"
				/>
			</svg>

			<button
				onClick={back}
				className={`${BUTTON} left-[-4vw] portrait:left-[3vw]`}
				style={hang(shown, "top", 400)}
			>
				<Strings />
				{"<-"} Back
			</button>

			<button
				onClick={next}
				disabled={last}
				tabIndex={last ? -1 : undefined}
				className={`${BUTTON} right-[-4vw] portrait:right-[3vw]`}
				style={hang(shown && !last, "top", 400)}
			>
				<Strings />
				Next {"->"}
			</button>

			<PopsicleButton
				onClick={() => goTo("/lastpage")}
				href="/lastpage"
				style={{
					...hang(shown && last, "bottom", TURN_MS),
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					zIndex: 20,
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
