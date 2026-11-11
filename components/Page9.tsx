import { useEffect, useEffectEvent, useRef, useState } from "react";
import Strings from "@/components/Strings";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import usePortrait from "@/components/usePortrait";
import { asset } from "@/lib/asset";
import * as sound from "@/lib/sound";
import Zhenya from "@/components/Zhenya";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const SPOTLIGHT_MS = 900;

const TWEAK_ENTER = asset("/imgs/zhenya/tweaking-enter.webp");
const TWEAK_EXIT = asset("/imgs/zhenya/tweaking-exit.webp");
const TWEAK_LOOP = asset("/imgs/zhenya/tweaking.webp");
const TWEAK_MS = 900;

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

const FACE =
	"text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh]";

const LABEL =
	" text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darkest";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer disabled:cursor-default`;

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
const LABEL_STAGGER_MS = 250;
const LABEL_EXIT_STAGGER_MS = 50;
const LABELS_IN_MS = (LABELS.length - 1) * LABEL_STAGGER_MS + 800;
const WHAAA_MS = LABELS_IN_MS + 500;
const FLIP_MS = 700;
const LABELS_OUT_MS = FLIP_MS + 2000;
const SPOTLIGHT_OFF_MS = (LABELS.length - 1) * LABEL_EXIT_STAGGER_MS + 800;

type Ending = "talk" | "there" | "dunno";
type Question = "root" | "real" | "steals" | "easy" | "matter";
type Answer = { text: string; next: Question | Ending; back?: string };

const QUESTIONS: Record<Question, { ask: string; answers: Answer[] }> = {
	root: {
		ask: "So... why is the Magic Button bad?",
		answers: [
			{ text: "It isn't real art.", next: "real" },
			{ text: "It steals from artists.", next: "steals" },
			{ text: "It's way too easy.", next: "easy" },
		],
	},
	real: {
		ask: "But why isn't it real?",
		answers: [
			{ text: "Nobody actually made it.", next: "matter" },
			{ text: "It has no mistakes in it.", next: "matter" },
			{ text: "It doesn't mean anything.", next: "matter" },
		],
	},
	steals: {
		ask: "But why is that so bad?",
		answers: [
			{ text: "Nobody asked them first.", next: "matter" },
			{ text: "It copies their hands.", next: "matter" },
			{ text: "They never get paid.", next: "matter" },
		],
	},
	easy: {
		ask: "But why is easy bad?",
		answers: [
			{ text: "You skip all the learning.", next: "matter" },
			{ text: "There's nothing to be proud of.", next: "matter" },
			{ text: "Everything looks the same.", next: "matter" },
		],
	},
	matter: {
		ask: "But why does any of that matter?",
		answers: [
			{ text: "Art is how people talk.", next: "talk", back: "Yes!" },
			{ text: "Because someone was there.", next: "there", back: "Yes." },
			{ text: "...I don't know.", next: "dunno", back: "Okay." },
		],
	},
};

const OUTRO = [
	"A drawing is a little piece of whoever made it.",
	"Even the wobbly ones. Especially the wobbly ones.",
	"Come on. I'll show you where I make mine.",
];
const ENDINGS: Record<Ending, string[]> = {
	talk: ["And a Magic Button has nothing to say.", ...OUTRO],
	there: ["Someone sat there, and tried, and cared.", ...OUTRO],
	dunno: ["That's okay. I only just figured it out.", ...OUTRO],
};
const INTRO = "Everyone's shouting. Nobody's saying why.";

const isQuestion = (id: Question | Ending): id is Question => id in QUESTIONS;

const TALK_AT_MS = TWEAK_MS + 1800;
const LINE_MS = 2800;
const SAY_SWAP_MS = 450;
const PICK_FLIP_MS = 700;
const PICK_HOLD_MS = 900;
const ANSWERS_OUT_MS = 700;

const ANSWER_LEFT = "calc(40% - 3vw)";
const ANSWER_TOPS = ["24svh", "36svh", "48svh"];
const BOUNCE_MS = 220;

export default function Page9({ curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);
	const { goTo } = useStage();
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

	useEffect(() => {
		if (step !== 2) return;
		sound.thunder();
		sound.pauseMusic(true);
		sound.startStorm();
	}, [step]);
	useEffect(
		() => () => {
			sound.stopStorm();
			sound.pauseMusic(false);
		},
		[],
	);

	const [tweakSrc, setTweakSrc] = useState<string | null>(null);
	const tweakBlobs = useRef<{ enter?: Blob; exit?: Blob }>({});
	const tweakUrl = useRef<string | null>(null);
	useEffect(() => {
		fetch(TWEAK_ENTER, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (tweakBlobs.current.enter = b));
		fetch(TWEAK_EXIT, { priority: "low" })
			.then((res) => res.blob())
			.then((b) => (tweakBlobs.current.exit = b));
		new Image().src = TWEAK_LOOP;
		return () => {
			if (tweakUrl.current) URL.revokeObjectURL(tweakUrl.current);
		};
	}, []);
	const playOnce = (blob: Blob | undefined, fallback: string) => {
		if (tweakUrl.current) URL.revokeObjectURL(tweakUrl.current);
		tweakUrl.current = blob ? URL.createObjectURL(blob) : null;
		setTweakSrc(tweakUrl.current ?? fallback);
	};
	useEffect(() => {
		if (step !== 2) return;
		const timers = [
			setTimeout(() => playOnce(tweakBlobs.current.enter, TWEAK_ENTER), 0),
			setTimeout(() => setTweakSrc(TWEAK_LOOP), TWEAK_MS),
		];
		return () => timers.forEach(clearTimeout);
	}, [step]);

	const spotClass = step >= 2 ? (stage < 2 ? "spot-on" : "spot-off") : "";
	const spotOpacity = step >= 2 && stage < 2 ? 1 : 0;
	useEffect(() => {
		const root = document.documentElement;
		root.classList.toggle("dim-controls", step >= 2 && stage < 2);
		return () => root.classList.remove("dim-controls");
	}, [step, stage]);

	const [flipped, setFlipped] = useState(false);
	const portrait = usePortrait();
	const labelPlace = (i: number, top: string, left: string) =>
		portrait
			? {
					top: `${-1 + Math.floor(i / 2) * 12 + (i % 2) * 4}svh`,
					left: i % 2 ? "81%" : "19%",
				}
			: { top, left };
	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);
	const later = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));

	const [said, setSaid] = useState<string | null>(null);
	const [saying, setSaying] = useState(false);
	const [question, setQuestion] = useState<Question>("root");
	const [answersEver, setAnswersEver] = useState(false);
	const [answersIn, setAnswersIn] = useState(false);
	const [picked, setPicked] = useState<number | null>(null);
	const [lean, setLean] = useState(false);
	const [done, setDone] = useState(false);

	const say = (text: string) => {
		setSaying(false);
		later(SAY_SWAP_MS, () => {
			setSaid(text);
			setSaying(true);
		});
	};
	const ask = (id: Question) => {
		setQuestion(id);
		setPicked(null);
		say(QUESTIONS[id].ask);
		later(SAY_SWAP_MS + 500, () => {
			setAnswersEver(true);
			setAnswersIn(true);
		});
	};
	const finish = (id: Ending) => {
		ENDINGS[id].forEach((line, k) => later(k * LINE_MS, () => say(line)));
		later((ENDINGS[id].length - 1) * LINE_MS + 900, () => {
			setDone(true);
			sound.chime();
		});
	};
	const pick = (i: number) => {
		if (picked !== null || !answersIn) return;
		const { next } = QUESTIONS[question].answers[i];
		sound.click();
		setPicked(i);
		setLean(true);
		later(BOUNCE_MS, () => setLean(false));
		later(PICK_FLIP_MS + PICK_HOLD_MS, () => {
			setAnswersIn(false);
			setSaying(false);
		});
		later(PICK_FLIP_MS + PICK_HOLD_MS + ANSWERS_OUT_MS, () =>
			isQuestion(next) ? ask(next) : finish(next),
		);
	};

	useEffect(() => {
		if (stage < 2) return;
		const t = setTimeout(() => {
			setSaid(INTRO);
			setSaying(true);
		}, TALK_AT_MS);
		return () => clearTimeout(t);
	}, [stage]);
	const startAsking = useEffectEvent(() => ask("root"));
	useEffect(() => {
		if (said !== INTRO) return;
		const t = setTimeout(startAsking, LINE_MS);
		return () => clearTimeout(t);
	}, [said]);

	const whaaa = () => {
		if (flipped) return;
		setFlipped(true);
		timers.current.push(
			setTimeout(() => setStage(1), LABELS_OUT_MS),
			setTimeout(() => {
				setStage(2);
				sound.stopStorm();
				sound.pauseMusic(false);
				playOnce(tweakBlobs.current.exit, TWEAK_EXIT);
			}, LABELS_OUT_MS + SPOTLIGHT_OFF_MS),
			setTimeout(
				() => setTweakSrc(null),
				LABELS_OUT_MS + SPOTLIGHT_OFF_MS + TWEAK_MS,
			),
		);
	};

	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="sr-only">Zhenya in the spotlight</h1>

			<div
				aria-hidden
				className={`fixed inset-0 z-11 pointer-events-none ${spotClass}`}
				style={{
					opacity: spotOpacity,
					background: portrait
						? "radial-gradient(circle at 50% 52%, transparent 0, transparent min(30svh, 46vw), rgba(0, 0, 0, 0.72) calc(min(30svh, 46vw) + 1svh))"
						: "radial-gradient(circle at 50% 60%, transparent 0, transparent 33svh, rgba(0, 0, 0, 0.72) 34svh)",
				}}
			/>

			{LABELS.map(({ text, top, left }, i) => (
				<div
					key={text}
					className="absolute translate-x-[-50%] text-[4svh] portrait:text-[2.3svh] w-max portrait:max-w-[35vw] z-20 drop-shadow-md drop-shadow-black/40 test-shadow-darkest perspective-[100svh]"
					style={{
						...labelPlace(i, top, left),
						zIndex: 12 + LABELS.length - i,
						...hang(step >= 2, step >= 2 && stage < 1, "top", {
							delay: i * LABEL_STAGGER_MS,
							exitDelay: i * LABEL_EXIT_STAGGER_MS,
						}),
					}}
				>
					<div
						className="relative transform-3d"
						style={{
							transition: `transform ${FLIP_MS}ms cubic-bezier(0.34, 1.2, 0.64, 1)`,
							transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
						}}
					>
						<Strings />
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
					zIndex: 20,
				}}
			>
				Whaaa-
			</PopsicleButton>

			<p
				role="status"
				aria-live="polite"
				className={`absolute top-[6svh] left-[calc(40%-3vw)] portrait:top-[1svh] portrait:left-[42%] translate-x-[-50%] w-max max-w-[26vw] portrait:max-w-[52vw] text-[3.4svh] portrait:text-[2.2svh] z-8 ${LABEL.replace("test-shadow-darkest", "test-shadow-darker")}`}
				style={hang(said !== null, saying, "top")}
			>
				<Strings />
				{said}
			</p>

			{QUESTIONS[question].answers.map((answer, i) => {
				const flipped = picked === i;
				return (
					<button
						key={i}
						onClick={() => pick(i)}
						disabled={!answersIn || picked !== null}
						aria-hidden={!answersIn}
						tabIndex={answersIn ? 0 : -1}
						className="absolute translate-x-[-50%] w-max max-w-[24vw] portrait:max-w-[70vw] text-[3svh] portrait:text-[2.2svh] cursor-pointer disabled:cursor-default drop-shadow-md drop-shadow-black/40 test-shadow-darker perspective-[100svh] left-(--left) portrait:left-[42%] top-(--top) portrait:top-(--ptop)"
						style={
							{
								"--top": ANSWER_TOPS[i],
								"--ptop": `${50 + i * 7.5}svh`,
								"--left": ANSWER_LEFT,
								zIndex: 8 - i,
								...hang(answersEver, answersIn, "top", {
									delay: i * 150,
									exitDelay: flipped ? 250 : i * 60,
								}),
							} as React.CSSProperties
						}
					>
						<span
							className="relative block transform-3d"
							style={{
								transition: `transform ${PICK_FLIP_MS}ms cubic-bezier(0.34, 1.2, 0.64, 1)`,
								transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
							}}
						>
							<Strings />
							<span
								className={`${FACE} border-dashed border-[0.3svh] block backface-hidden`}
							>
								{answer.text}
							</span>
							<span
								aria-hidden
								className={`${FACE} border-[0.3svh] backface-hidden absolute inset-0 flex items-center justify-center rotate-y-180`}
							>
								{isQuestion(answer.next) ? "But why?" : answer.back}
							</span>
						</span>
					</button>
				);
			})}

			<PopsicleButton
				onClick={() => goTo("/backstage")}
				href="/backstage"
				style={{
					...hang(done, done, "bottom", {
						ms: 900,
						easing: BUTTON_DROP,
					}),
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					zIndex: 20,
				}}
			>
				Continue {"->"}
			</PopsicleButton>

			<Zhenya
				src={tweakSrc ?? blinkSrc}
				className="h-svh w-auto max-w-none absolute top-[-28svh] portrait:h-[60svh] portrait:top-[-8svh] translate-x-[-50%] z-9"
				style={{
					filter:
						stage >= 2
							? "drop-shadow(12px 12px 2px #28282857)"
							: "drop-shadow(20px 30px 3px #000000e6)",
					visibility: step >= 1 ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}, filter 600ms ease, scale 600ms ease-in-out ${TWEAK_MS}ms, left 1200ms ease-in-out ${TWEAK_MS + 300}ms, ${lean ? `margin-top ${BOUNCE_MS}ms ease-out` : "margin-top 450ms cubic-bezier(0.34, 1.8, 0.64, 1)"}`,
					marginTop: lean ? "-1.5svh" : "0",
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
