import { useEffect, useRef, useState } from "react";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import usePortrait from "@/components/usePortrait";
import Zhenya from "@/components/Zhenya";
import { asset } from "@/lib/asset";
import {
	LIMITS,
	loadCompetitor,
	saveCompetitor,
	type Competitor,
} from "@/lib/competitor";
import { useDrawings } from "@/lib/drawings";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

// The frame's words drop in this long after the frame, this far apart
const WORDS_DELAY_MS = 700;
const WORD_STAGGER_MS = 100;
// After "Sign up here": Zhenya turns round and walks over to the right,
// then "Competitor Information" drops in and the form slides up
const TITLE_DELAY_MS = 1200;
const FORM_DELAY_MS = 1500;
// After "Join NOW": Zhenya walks to the middle, then the question and the
// two paintings drop in
const PICK_DELAY_MS = 900;

// Hangs something in from the top (or up from the bottom) once shown, and
// takes it away again once it's gone
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
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
	</>
);

const FrameStrings = () => (
	<>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-90svh] left-[5svw] absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-90svh] right-[5svw] absolute"></span>
	</>
);

const LABEL =
	"text-[3svh] portrait:text-[2svh] max-w-[70%] mx-auto text-center scribbler absolute portrait:max-w-[50vw] bg-white border-black px-[2vw] portrait:px-[3vw] py-[1svh] portrait:py-[0.7svh] drop-shadow-md drop-shadow-black/40 test-shadow";

// The form's questions: which answer, the question, and what's written in
// grey until something's typed. All of them have to be answered, within
// LIMITS
const QUESTIONS = [
	{
		key: "name",
		question: "Your Name",
		placeholder: "Zhenya",
		autoComplete: "given-name",
	},
	{
		key: "gender",
		question: "What's your gender?",
		placeholder: "Your gender",
		autoComplete: "off",
	},
	{
		key: "aiArt",
		question: "What do you think about AI art?",
		placeholder: "Your awesome thoughts",
		autoComplete: "off",
	},
] as const;
type Answers = Pick<Competitor, "name" | "gender" | "aiArt">;

// The two paintings to choose between at step 3
const CHOICES = [
	{
		entry: "magic",
		label: "Magic Button's",
		side: "left-0 portrait:left-[2vw]",
	},
	{
		entry: "yours",
		label: "Your Own",
		side: "right-0 portrait:right-[2vw]",
	},
] as const;
const CHOICE_LABEL =
	"w-max text-[3.5svh] portrait:text-[2.2svh] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1.5vw] portrait:px-[3vw] py-[0.7svh] drop-shadow-md drop-shadow-black/40 test-shadow";

// Page 7 - the art competition. Step 1: Zhenya drops in on the left, the
// empty frame drops in on the right, then its words one by one. "Sign up
// here" is step 2: the frame lifts away, Zhenya turns round and goes to the
// right, "Competitor Information" drops in and the form slides up. "Join
// NOW" is step 3: the form goes, Zhenya walks to the middle, and the magic
// button's painting hangs on her left and yours on her right - she looks
// whichever way the pointer is
export default function Page7({ nextPage, curtainsOpen }: PageProps) {
	const portrait = usePortrait();
	const [step, setStep] = useState(0);

	// Zhenya, idle and blinking every 1-3s
	const blinkSrc = useBlinkingDoll();

	// Once the curtains have opened: the doll and the frame drop in, then
	// the frame's words
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setStep((s) => Math.max(s, 1)), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	// The form's answers - filled in from last time, if there was one
	const [answers, setAnswers] = useState<Answers>({
		name: "",
		gender: "",
		aiArt: "",
	});
	useEffect(() => {
		const saved = loadCompetitor();
		const timer = setTimeout(
			() =>
				setAnswers({
					name: saved.name ?? "",
					gender: saved.gender ?? "",
					aiArt: saved.aiArt ?? "",
				}),
			0,
		);
		return () => clearTimeout(timer);
	}, []);

	// "Sign up here" → step 2; "Join NOW" (once everything's answered) saves
	// the answers → step 3; picking a painting saves which and goes on
	// Once the form is up, the cursor goes to its first field (not on
	// touch screens, where that would pop the keyboard up)
	const firstField = useRef<HTMLInputElement>(null);
	const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(focusTimer.current), []);
	const signUp = () => {
		setStep(2);
		if (window.matchMedia("(pointer: fine)").matches)
			focusTimer.current = setTimeout(
				() => firstField.current?.focus({ preventScroll: true }),
				FORM_DELAY_MS + 900,
			);
	};
	const join = () => {
		saveCompetitor({
			name: answers.name.trim(),
			gender: answers.gender.trim(),
			aiArt: answers.aiArt.trim(),
		});
		setStep(3);
	};
	const picked = useRef(false);
	const pick = (entry: Competitor["entry"]) => {
		if (picked.current) return;
		picked.current = true;
		saveCompetitor({ entry });
		nextPage();
	};

	const framed = step === 1;
	const signedUp = step >= 2;
	const filling = step === 2;
	const picking = step >= 3;

	// Your drawing from Page 6 - this visit's, or else the last one kept in
	// this browser, or else an empty frame
	const { myDrawing } = useStage();
	const saved = useDrawings().find((d) => !d.id.startsWith("sample"));
	const yours = myDrawing ?? saved?.image ?? null;

	// While picking, Zhenya looks towards whichever side the pointer is on
	// (she's in the middle of the screen)
	const [lookLeft, setLookLeft] = useState(true);
	useEffect(() => {
		if (!picking) return;
		const onMove = (e: PointerEvent) =>
			setLookLeft(e.clientX < window.innerWidth / 2);
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, [picking]);
	// The frame's words, top to bottom, each a little after the last
	const word = (i: number) => ({
		...hang(step >= 1, framed, "top", {
			delay: WORDS_DELAY_MS + i * WORD_STAGGER_MS,
		}),
		// Higher ones in front, so the strings of the ones below run behind
		zIndex: 9 - i,
	});

	return (
		<div className="h-full flex flex-col items-center justify-center relative">
			{/* Step 1: the empty frame, and the competition's words in it */}
			<div
				className="absolute top-[-3svh] right-[0vw] portrait:top-[1svh] portrait:right-[3vw] z-5 test-shadow-darker"
				style={hang(step >= 1, framed, "top", { ms: 900, easing: DOLL_DROP })}
			>
				<FrameStrings />
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<img
					src={asset("/imgs/empty_square_frame.webp")}
					className="h-[55svh] w-[45svw] portrait:h-[30svh] portrait:w-[58vw] max-w-none relative z-1"
					alt="An empty picture frame"
				/>
			</div>

			<h2
				className={`${LABEL} border-[0.2svh] top-[10svh] right-[10vw] portrait:right-[9vw] portrait:top-[7svh]`}
				style={word(0)}
			>
				<Strings />
				Annual Art Competition
			</h2>
			<p
				className={`${LABEL} border-[0.2svh] top-[20svh] right-[12vw] portrait:right-[10vw] portrait:top-[13svh]`}
				style={word(1)}
			>
				<Strings />
				Get the BEST artist Award
			</p>
			<button
				onClick={signUp}
				disabled={!framed}
				tabIndex={framed ? undefined : -1}
				className={`${LABEL} border-[0.3svh] border-dashed top-[30svh] right-[13vw] portrait:right-[14vw] portrait:top-[21.5svh] cursor-pointer disabled:cursor-default`}
				style={word(2)}
			>
				<Strings />
				Sign up here
			</button>

			{/* Zhenya - drops in on the left; at step 2 she turns round (the
			    scale flips through 0, like a cut-out) and goes over to the
			    right, a little higher; at step 3 she goes to the middle and
			    turns to face the pointer. Facing right is her own way round */}
			<Zhenya
				src={blinkSrc}
				className="h-svh absolute portrait:h-[66svh] max-w-none test-shadow"
				style={{
					visibility: step >= 1 ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}, top 900ms ease-in-out 300ms, left 1200ms ease-in-out 300ms, scale ${picking ? 350 : 600}ms ease-in-out`,
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
					top: portrait ? "-10svh" : filling ? "-35svh" : "-28svh",
					// The doll is 56svh wide (896 x 1600 at the full height),
					// or 37svh on portrait screens
					left: picking
						? portrait
							? "calc(50% - 18.5svh)"
							: "calc(50% - 28svh)"
						: signedUp
							? portrait
								? "calc(100% - 37svh + 6vw)"
								: "calc(100% - 56svh)"
							: portrait
								? "-16vw"
								: "-10vw",
					// In front of the paintings while picking
					zIndex: picking ? 6 : undefined,
					scale: picking
						? lookLeft
							? "-1 1"
							: "1 1"
						: signedUp
							? "-1 1"
							: "1 1",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			{/* Step 2: "Competitor Information", and the form sliding up */}
			<h2
				className={`${LABEL} text-[4svh] border-[0.2svh] top-[5svh] left-[5vw] portrait:top-[24svh] portrait:left-[4vw] z-3`}
				style={hang(signedUp, filling, "top", { delay: TITLE_DELAY_MS })}
			>
				<Strings />
				Competitor Information
			</h2>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					join();
				}}
				className="bottom-0 left-0 w-[35vw] h-[55svh] portrait:w-[92vw] portrait:h-auto portrait:left-[4vw] portrait:bottom-[2svh] absolute z-6 test-shadow px-[2vw] portrait:px-[4vw] py-[2svh] bg-cover bg-center"
				style={{
					backgroundImage: `url(${asset("/imgs/paper-form2.webp")})`,
					...hang(signedUp, filling, "bottom", {
						ms: 900,
						easing: DOLL_DROP,
						delay: FORM_DELAY_MS,
					}),
				}}
			>
				{QUESTIONS.map(({ key, question, placeholder, autoComplete }, i) => (
					<label key={key} className="block">
						<span
							className={`block text-[3svh] portrait:text-[2.2svh] ${i ? "mt-[3svh] portrait:mt-[2svh]" : ""}`}
						>
							{question}
						</span>
						<input
							type="text"
							name={key}
							required
							minLength={LIMITS[key].min}
							maxLength={LIMITS[key].max}
							value={answers[key]}
							onChange={(e) =>
								setAnswers((a) => ({ ...a, [key]: e.target.value }))
							}
							// Just spaces don't count as an answer
							pattern=".*\S.*"
							placeholder={placeholder}
							autoComplete={autoComplete}
							ref={i === 0 ? firstField : undefined}
							tabIndex={filling ? undefined : -1}
							className="no-focus-ring border-b-[0.3svh] w-full text-[3svh] portrait:text-[2.2svh] bg-transparent outline-none px-[0.5vw] pb-[1svh] border-black border-dashed"
						/>
						{/* The long answer shows how much room is left */}
						{key === "aiArt" && (
							<span
								aria-hidden
								className="block text-right text-[1.8svh] portrait:text-[1.5svh] text-black/50 mt-[0.4svh]"
							>
								{answers.aiArt.length}/{LIMITS.aiArt.max}
							</span>
						)}
					</label>
				))}

				<button
					type="submit"
					tabIndex={filling ? undefined : -1}
					className="block text-[3svh] portrait:text-[2.2svh] border-dashed max-w-[70%] mx-auto text-center scribbler mt-[1svh] portrait:mt-[2.5svh] bg-white border-[0.3svh] border-black px-[2vw] portrait:px-[3vw] py-[1svh] drop-shadow-md drop-shadow-black/40 test-shadow cursor-pointer"
				>
					Join NOW
				</button>
			</form>

			{/* Step 3: the question, and the two paintings to choose from -
			    the magic button's on the left, yours on the right */}
			<h2
				className={`${LABEL} text-[3.5svh] border-[0.2svh] top-[-1svh] left-[50%] translate-x-[-50%] w-max max-w-[60vw] portrait:max-w-[90vw] portrait:top-[2svh] z-9`}
				style={hang(picking, picking, "top", { delay: PICK_DELAY_MS })}
			>
				<Strings />
				Which painting do you want to submit to the competition?
			</h2>
			{/* The two paintings, each hanging with its label under it -
			    picking either one (the frame or the label) submits it and goes
			    on to the next page. The magic button's on the left, yours on
			    the right; each a moment after the last */}
			{CHOICES.map(({ entry, label, side }, i) => (
				<div
					key={entry}
					className={`absolute top-[10svh] portrait:top-[40svh] ${side} z-4 flex flex-col items-center gap-[1.5svh] portrait:gap-[1svh]`}
					style={hang(picking, picking, "top", {
						ms: 900,
						easing: DOLL_DROP,
						delay: PICK_DELAY_MS + 200 + i * 150,
					})}
				>
					{/* The frame - the label under it is the same button for
					    screen readers and keyboards */}
					<button
						onClick={() => pick(entry)}
						disabled={!picking}
						tabIndex={-1}
						aria-hidden
						className="relative z-2 test-shadow-darker cursor-pointer disabled:cursor-default"
					>
						<span className="w-[0.1vw] min-w-px bg-black/60 h-svh bottom-[85%] left-[25%] absolute"></span>
						<span className="w-[0.1vw] min-w-px bg-black/60 h-svh bottom-[85%] right-[25%] absolute"></span>
						{/* eslint-disable-next-line @next/next/no-img-element */}
						<img
							src={
								entry === "magic"
									? asset("/imgs/drawing-lilies.webp")
									: (yours ?? asset("/imgs/empty_square_frame.webp"))
							}
							className="h-[38svh] portrait:h-[20svh] w-auto max-w-none relative"
							alt=""
						/>
					</button>
					<button
						onClick={() => pick(entry)}
						disabled={!picking}
						tabIndex={picking ? undefined : -1}
						aria-label={
							entry === "magic"
								? "Submit the magic button's painting of lilies"
								: yours
									? "Submit your own drawing"
									: "Submit your own (empty) frame"
						}
						className={`${CHOICE_LABEL} relative z-1 cursor-pointer disabled:cursor-default`}
					>
						<Strings />
						{label}
					</button>
				</div>
			))}
		</div>
	);
}
