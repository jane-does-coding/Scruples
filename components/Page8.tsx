import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import usePortrait from "@/components/usePortrait";
import useWowDoll from "@/components/useWowDoll";
import Zhenya from "@/components/Zhenya";
import { asset } from "@/lib/asset";
import { loadCompetitor, type Competitor } from "@/lib/competitor";
import { useDrawings } from "@/lib/drawings";
import * as sound from "@/lib/sound";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const TITLE_MS = 400;
const REVEAL_MS = 1800;
const REACTION_DELAY_MS = 1300;
const COMPLAINT_GAP_MS = 200;

const hang = (
	shown: boolean,
	here: boolean,
	from: "top" | "bottom",
	{ ms = 800, easing = LABEL_DROP, delay = 0 } = {},
) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform ${ms}ms ${easing} ${here ? delay : 0}ms`,
	transform: here
		? "translateY(0)"
		: `translateY(${from === "top" ? "-120svh" : "120svh"})`,
});

const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
	</>
);

const TEXT =
	"text-center scribbler bg-white border-black px-[1.2vw] portrait:px-[3vw] py-[0.7svh] drop-shadow-md drop-shadow-black/40 test-shadow";
const LABEL = `${TEXT} border-[0.2svh]`;
const BUTTON = `${TEXT} border-[0.3svh] border-dashed cursor-pointer disabled:cursor-default`;

const COMPLAINTS = [
	{ by: "Mia", line: "I spent 60 hours on my painting." },
	{ by: "Theo", line: "I went to art school for four years for this." },
	{ by: "Ana", line: "I put my whole soul into mine." },
	{ by: "Sam", line: "And we all lost to a magic button. One click." },
];
const AFTER_WINNING = "…somehow it doesn't feel like I won anything.";

const TALK = [
	{
		question: "How does it make you feel, losing to a magic button?",
		answers: [
			{
				answer: "Sad",
				reply: "That's okay. Losing hurts most when you really tried.",
			},
			{
				answer: "Angry",
				reply: "That makes sense. You made yours yourself - they didn't.",
			},
			{
				answer: "It's not fair",
				reply: "You're right. One click isn't the same as hours of work.",
			},
			{
				answer: "I'm proud of mine anyway",
				reply: "You should be. Yours is the one with you in it.",
			},
		],
	},
	{
		question: "Will you keep drawing?",
		answers: [
			{
				answer: "Yes!",
				reply: "Good. A magic button can't get any better - you can.",
			},
			{
				answer: "I don't know…",
				reply:
					"That's okay. Nobody can press a button to make you an artist - but nobody can take it away from you either.",
			},
		],
	},
];

export default function Page8({ nextPage, curtainsOpen }: PageProps) {
	const [entry, setEntry] = useState<Competitor["entry"]>("yours");
	useEffect(() => {
		const saved = loadCompetitor();
		const timer = setTimeout(() => setEntry(saved.entry ?? "yours"), 0);
		return () => clearTimeout(timer);
	}, []);
	const won = entry === "magic";

	const { myDrawing } = useStage();
	const saved = useDrawings().find((d) => !d.id.startsWith("sample"));
	const yours = myDrawing ?? saved?.image ?? null;

	const blinkSrc = useBlinkingDoll();
	const wow = useWowDoll();

	const [step, setStep] = useState(0);
	const [complaints, setComplaints] = useState(0);
	const [picks, setPicks] = useState<number[]>([]);
	const [replied, setReplied] = useState(0);
	const [cleared, setCleared] = useState(0);
	const [showContinue, setShowContinue] = useState(false);

	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const later = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));
	useEffect(() => () => timers.current.forEach(clearTimeout), []);

	useEffect(() => {
		if (!curtainsOpen) return;
		const t = [
			setTimeout(() => setStep(1), 0),
			setTimeout(
				() => sound.drumroll(REVEAL_MS - TITLE_MS - 300),
				TITLE_MS + 300,
			),
			setTimeout(() => setStep(2), REVEAL_MS),
		];
		return () => t.forEach(clearTimeout);
	}, [curtainsOpen]);

	useEffect(() => {
		if (step !== 2) return;
		const t = setTimeout(
			() => (won ? sound.fanfare() : sound.sadTrombone()),
			500,
		);
		return () => clearTimeout(t);
	}, [step, won]);

	useEffect(() => {
		if (!won) return;
		if (step === 2) {
			const t = setTimeout(() => wow.playWow(), 600);
			return () => clearTimeout(t);
		}
		if (step !== 3) return;
		const lastComplaint = 400 + (COMPLAINTS.length - 1) * COMPLAINT_GAP_MS;
		const t = [
			setTimeout(() => wow.playWowReverse(), 0),
			...COMPLAINTS.map((_, i) =>
				setTimeout(() => setComplaints(i + 1), 400 + i * COMPLAINT_GAP_MS),
			),
			setTimeout(
				() => setComplaints(COMPLAINTS.length + 1),
				lastComplaint + 2000,
			),
			setTimeout(() => setShowContinue(true), lastComplaint + 3500),
		];
		return () => t.forEach(clearTimeout);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [won, step]);

	const answer = (q: number, a: number) => {
		if (picks.length !== q) return;
		setPicks((p) => [...p, a]);
		later(700, () => setReplied(q + 1));
		if (q !== TALK.length - 1) return;
		setCleared(q);
		later(2200, () => setShowContinue(true));
	};

	const revealed = step >= 2;
	const talking = step >= 3;

	const winnerCaption = won
		? "1st place - Zhenya!"
		: "1st place - Rob (magic button)";
	const latestLine = (() => {
		if (!revealed) return "";
		if (!talking) return winnerCaption;
		if (won) {
			if (complaints > COMPLAINTS.length) return AFTER_WINNING;
			const c = COMPLAINTS[complaints - 1];
			return c ? `"${c.line}" - ${c.by}, another competitor` : "";
		}
		const reply =
			replied > 0 ? TALK[replied - 1].answers[picks[replied - 1]]?.reply : "";
		const next = TALK[replied]?.question ?? "";
		return [reply, next].filter(Boolean).join(" ");
	})();
	const portrait = usePortrait();

	return (
		<div className="h-full relative">
			<h1 className="sr-only">The results of the art competition</h1>
			<p role="status" aria-live="polite" className="sr-only">
				{latestLine}
			</p>

			<Zhenya
				src={wow.src ?? blinkSrc}
				className="h-svh absolute top-[-30svh] left-[-9vw] portrait:h-[66svh] portrait:top-[-10svh] portrait:left-[-16vw] max-w-none test-shadow"
				style={{
					...hang(step >= 1, step >= 1, "top", {
						ms: 900,
						easing: DOLL_DROP,
					}),
					transition: `transform 900ms ${DOLL_DROP}, translate 1600ms ease-in-out 700ms`,
					translate: revealed && !won ? "0 4svh" : "0 0",
				}}
				alt={
					revealed && !won
						? "Zhenya, a marionette doll on strings, sinking a little"
						: "Zhenya, a marionette doll on strings"
				}
			/>

			<h2
				className={`${LABEL} absolute top-[0svh] right-[4vw] portrait:right-[3vw] portrait:top-[1svh] w-max max-w-[40vw] portrait:max-w-[62vw] text-[3.5svh] portrait:text-[2.4svh] z-9`}
				style={hang(step >= 1, step >= 1 && !talking, "top", {
					delay: TITLE_MS,
				})}
			>
				<Strings />
				And the BEST artist Award goes to…
			</h2>

			<figure
				className="absolute top-[10svh] left-[19vw] portrait:left-auto portrait:right-[4vw] portrait:top-[9svh] z-5 flex flex-col items-center gap-[1.5svh] portrait:gap-[1svh]"
				style={hang(revealed, revealed && !(portrait && talking), "top", {
					ms: 900,
					easing: DOLL_DROP,
				})}
			>
				<span className="w-[0.1vw] min-w-px bg-black/60 h-svh bottom-[85%] left-[25%] absolute z-2"></span>
				<span className="w-[0.1vw] min-w-px bg-black/60 h-svh bottom-[85%] right-[25%] absolute z-2"></span>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={asset("/imgs/art/drawing-lilies.webp")}
					className="relative z-2 h-[32svh] portrait:h-[20svh] w-auto max-w-none test-shadow-darker"
					alt="The magic button's drawing of lilies, in a picture frame"
				/>
				<figcaption
					className={`${LABEL} relative z-1 w-max max-w-[19vw] portrait:max-w-[52vw] text-[3svh] portrait:text-[2svh]`}
				>
					<Strings />
					{winnerCaption}
				</figcaption>
			</figure>

			{!won && (
				<figure
					className="absolute top-[14svh] right-[1vw] portrait:right-auto portrait:left-[4vw] portrait:top-[42svh] z-4 flex flex-col items-center gap-[1.5svh] portrait:gap-[1svh]"
					style={hang(revealed, revealed && !talking, "top", {
						ms: 900,
						easing: DOLL_DROP,
						delay: 300,
					})}
				>
					<span className="w-[0.1vw] min-w-px bg-black/60 h-svh bottom-[85%] left-[25%] absolute z-2"></span>
					<span className="w-[0.1vw] min-w-px bg-black/60 h-svh bottom-[85%] right-[25%] absolute z-2"></span>
					{/* eslint-disable-next-line @next/next/no-img-element */}
					<img
						src={yours ?? asset("/imgs/art/empty_square_frame.webp")}
						className="relative z-2 h-[26svh] portrait:h-[16svh] w-auto max-w-none test-shadow-darker"
						alt={
							yours
								? "Zhenya's drawing from Page 6, in a picture frame"
								: "An empty picture frame"
						}
					/>
					<figcaption
						className={`${LABEL} relative z-1 w-max max-w-[20vw] portrait:max-w-[44vw] text-[2.6svh] portrait:text-[1.8svh]`}
					>
						<Strings />
						No place - Zhenya
					</figcaption>
				</figure>
			)}

			{won && (
				<p
					className={`${LABEL} absolute top-[47svh] left-[38vw] portrait:left-[4vw] portrait:top-[auto] portrait:bottom-[20svh] w-max max-w-[19vw] portrait:max-w-[60vw] text-[2.8svh] portrait:text-[2svh] z-5`}
					style={hang(
						complaints > COMPLAINTS.length,
						complaints > COMPLAINTS.length,
						"top",
					)}
				>
					<Strings />
					{AFTER_WINNING}
				</p>
			)}

			<button
				onClick={() => setStep(3)}
				disabled={!revealed || talking}
				tabIndex={revealed && !talking ? undefined : -1}
				className={`${BUTTON} absolute top-[52svh] right-[8vw] portrait:right-[6vw] portrait:top-[66svh] w-max text-[3.5svh] portrait:text-[2.6svh] z-6`}
				style={hang(revealed, revealed && !talking, "top", {
					delay: REACTION_DELAY_MS,
				})}
			>
				<Strings />
				{won ? "Yayy!" : "Oh.."}
			</button>

			<div className="absolute top-[1svh] right-[2vw] w-[25vw] portrait:top-[2svh] portrait:left-[4vw] portrait:right-[4vw] portrait:w-auto flex flex-col items-stretch gap-[0.9svh] portrait:gap-[1svh]">
				{won ? (
					<>
						{COMPLAINTS.map(({ by, line }, i) => (
							<p
								key={by}
								className={`${LABEL} relative text-[2.5svh] portrait:text-[1.9svh]`}
								style={{
									...hang(complaints > i, complaints > i, "top"),
									zIndex: 9 - i,
								}}
							>
								<Strings />
								&ldquo;{line}&rdquo;
								<span className="block italic text-[1.9svh] portrait:text-[1.5svh] text-black/60">
									- {by}, another competitor
								</span>
							</p>
						))}
					</>
				) : (
					TALK.map(({ question, answers }, q) => {
						const up = talking && replied >= q;
						const picked = picks[q];
						return (
							<div
								key={question}
								className="grid"
								style={{
									zIndex: 9 - q,
									gridTemplateRows: q < cleared ? "0fr" : "1fr",
									transition: "grid-template-rows 600ms ease-out",
								}}
							>
								<div
									className="min-h-0 flex flex-col items-stretch gap-[1svh] portrait:gap-[0.8svh]"
									style={{
										transition: `transform 800ms ${LABEL_DROP}`,
										transform:
											q < cleared ? "translateY(-120svh)" : "translateY(0)",
									}}
								>
									<p
										className={`${LABEL} relative text-[2.6svh] portrait:text-[2svh]`}
										style={{ ...hang(up, up, "top"), zIndex: 9 }}
									>
										<Strings />
										{question}
									</p>
									<div className="flex flex-wrap justify-center gap-[0.8vw] portrait:gap-[2vw]">
										{answers.map(({ answer: text }, a) => {
											const showing =
												up && (picked === undefined || picked === a);
											return (
												<button
													key={text}
													onClick={() => answer(q, a)}
													disabled={!showing || picked !== undefined}
													tabIndex={
														showing && picked === undefined ? undefined : -1
													}
													aria-pressed={picked === a}
													className={`${BUTTON} relative text-[2.3svh] portrait:text-[1.8svh] ${picked !== undefined && picked !== a ? "hidden" : ""} ${picked === a ? "border-solid" : ""}`}
													style={{
														...hang(up, up, "top", { delay: 300 + a * 100 }),
														zIndex: 8 - a,
													}}
												>
													<Strings />
													{text}
												</button>
											);
										})}
									</div>
									{picked !== undefined && (
										<p
											className={`${LABEL} relative text-[2.4svh] portrait:text-[1.9svh]`}
											style={{
												...hang(replied > q, replied > q, "top"),
												zIndex: 4,
											}}
										>
											<Strings />
											{answers[picked].reply}
										</p>
									)}
								</div>
							</div>
						);
					})
				)}
			</div>

			<PopsicleButton
				onClick={nextPage}
				href="/in-the-spotlight"
				style={{
					visibility: showContinue ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}`,
					transform: showContinue ? "translateY(0)" : "translateY(100svh)",
					right: "-5vw",
					bottom: "-4svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
