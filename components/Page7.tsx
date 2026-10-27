import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
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
// How far the one not picked moves out (as it shrinks), and how far Zhenya
// and the picked one then move over into the room it leaves (the shrinking
// and the move out free up about this much)
const OUT = "3vw";
const MAKE_ROOM = { wide: "5vw", portrait: "6vw" };

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
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-90svh] left-[5vw] absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-90svh] right-[5vw] absolute"></span>
	</>
);

const LABEL =
	"text-[3svh] portrait:text-[2svh] max-w-[70%] mx-auto text-center scribbler absolute portrait:max-w-[50vw] bg-white border-black px-[2vw] portrait:px-[3vw] py-[1svh] portrait:py-[0.7svh] drop-shadow-md drop-shadow-black/40 test-shadow";

// "Sign up here" (and the invisible copy of it its strings hang from)
const SIGN_UP = `${LABEL} border-[0.3svh] border-dashed top-[39svh] right-[13vw] portrait:right-[14vw] portrait:top-[21.5svh]`;

// The form's questions: which answer, the question, and what's written in
// grey until something's typed. All of them have to be answered, within
// LIMITS - the age as a whole number, the others as words
const QUESTIONS = [
	{
		key: "age",
		question: "How old are you?",
		placeholder: "Your age",
		autoComplete: "off",
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
// As typed (the age is saved as a number)
type Answers = Record<"age" | "gender" | "aiArt", string>;
type Field = keyof Answers;
// What gender is filled in as with "Prefer not to say"
const NOT_SAYING = "Prefer not to say";

// What's wrong with each answer, if anything - shown under the field in
// place of the browser's own messages
const problems = (answers: Answers) => {
	const found: Partial<Record<Field, string>> = {};
	const age = Number(answers.age);
	if (!answers.age.trim()) found.age = "Please fill this in";
	else if (
		!Number.isInteger(age) ||
		age < LIMITS.age.min ||
		age > LIMITS.age.max
	)
		found.age = `A whole number from ${LIMITS.age.min} to ${LIMITS.age.max}`;
	if (!answers.gender.trim()) found.gender = "Please fill this in";
	const thoughts = answers.aiArt.trim();
	if (!thoughts) found.aiArt = "Please fill this in";
	else if (thoughts.length < LIMITS.aiArt.min)
		found.aiArt = `At least ${LIMITS.aiArt.min} characters`;
	return found;
};

// The two paintings to choose between at step 3
const CHOICES = [
	{
		entry: "magic",
		label: "Magic Button's",
		side: "left-[-2vw] portrait:left-[2vw]",
	},
	{
		entry: "yours",
		label: "Your Own",
		side: "right-[-2vw] portrait:right-[2vw]",
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
		age: "",
		gender: "",
		aiArt: "",
	});
	useEffect(() => {
		const saved = loadCompetitor();
		const timer = setTimeout(
			() =>
				setAnswers({
					age: saved.age ? String(saved.age) : "",
					gender: saved.gender ?? "",
					aiArt: saved.aiArt ?? "",
				}),
			0,
		);
		return () => clearTimeout(timer);
	}, []);

	// "Sign up here" → step 2; "Join NOW" (once everything's answered) saves
	// the answers → step 3; picking a painting saves which and goes on.
	// Once the form is up, the cursor goes to its first field (not on
	// touch screens, where that would pop the keyboard up)
	const fields = useRef<Partial<Record<Field, HTMLInputElement | null>>>({});
	const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
	const setAnswer = (key: Field, value: string) => {
		setAnswers((a) => ({ ...a, [key]: value }));
		// Fixing a field clears its note
		setErrors((e) => ({ ...e, [key]: undefined }));
	};
	const focusTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(focusTimer.current), []);
	const signUp = () => {
		setStep(2);
		if (window.matchMedia("(pointer: fine)").matches)
			focusTimer.current = setTimeout(
				() => fields.current.age?.focus({ preventScroll: true }),
				FORM_DELAY_MS + 900,
			);
	};
	const join = () => {
		// Anything missing or wrong: a note under each, and the cursor goes
		// to the first one
		const found = problems(answers);
		setErrors(found);
		const firstWrong = QUESTIONS.find(({ key }) => found[key]);
		if (firstWrong) {
			fields.current[firstWrong.key]?.focus({ preventScroll: true });
			return;
		}
		saveCompetitor({
			age: Number(answers.age),
			gender: answers.gender.trim(),
			aiArt: answers.aiArt.trim(),
		});
		setStep(3);
	};
	// Picking a painting selects it (it can be changed) and saves it;
	// Continue then goes on
	const [chosen, setChosen] = useState<Competitor["entry"] | null>(null);
	const pick = (entry: Competitor["entry"]) => {
		if (entry !== chosen) sound.click();
		setChosen(entry);
		setLookLeft(entry === "magic");
		saveCompetitor({ entry });
	};
	// How far things move over for a picked painting, and which way a
	// painting moves (the magic button's is on the left)
	const room = portrait ? MAKE_ROOM.portrait : MAKE_ROOM.wide;
	const toward = (entry: Competitor["entry"], way: "in" | "out") =>
		(entry === "magic") === (way === "out") ? "-" : "";
	const leaving = useRef(false);
	const goOn = () => {
		if (leaving.current) return;
		leaving.current = true;
		nextPage();
	};

	const framed = step === 1;
	const signedUp = step >= 2;
	const filling = step === 2;
	const picking = step >= 3;

	// Your drawing from Page 6 - this visit's, or else the last one kept in
	// this browser, or else an empty frame
	const { myDrawing, goTo } = useStage();
	const saved = useDrawings().find((d) => !d.id.startsWith("sample"));
	const yours = myDrawing ?? saved?.image ?? null;

	// While picking, Zhenya looks towards whichever side the pointer is on
	// (she's in the middle of the screen) - and once one's picked, at it
	const [lookLeft, setLookLeft] = useState(true);
	useEffect(() => {
		if (!picking || chosen) return;
		const onMove = (e: PointerEvent) =>
			setLookLeft(e.clientX < window.innerWidth / 2);
		window.addEventListener("pointermove", onMove);
		return () => window.removeEventListener("pointermove", onMove);
	}, [picking, chosen]);
	// The frame's words, top to bottom, each a little after the last
	// They hang behind the frame (z-5), higher ones in front of lower ones;
	// "Sign up here" is in front of the frame so it can be clicked
	const word = (i: number, zIndex: number) => ({
		...hang(step >= 1, framed, "top", {
			delay: WORDS_DELAY_MS + i * WORD_STAGGER_MS,
		}),
		zIndex,
	});

	return (
		<div className="h-full flex flex-col items-center justify-center relative">
			{/* Step 1: the TV on its popsicle sticks, rising up from the bottom
			    (and sinking back down after), and the competition's words in it */}
			<div
				className="absolute top-[10svh] right-[0vw] portrait:top-[1svh] portrait:right-[3vw] z-5 test-shadow-darker"
				style={hang(step >= 1, framed, "bottom", {
					ms: 900,
					easing: DOLL_DROP,
				})}
			>
				{/* eslint-disable-next-line @next/next/no-img-element */}
				<div
					className={`absolute bottom-[-38svh] left-[-7vw] z-[-5] drop-shadow-md drop-shadow-black/40`}
				>
					<img
						src={asset("/imgs/stage/popsicle.webp")}
						alt="Wooden popsicle stick holding up the sign"
						className="w-[30vw] portrait:w-[24svh] max-w-none"
					/>
				</div>
				<div
					className={`absolute bottom-[-38svh] right-[-7vw] z-[-5] drop-shadow-md drop-shadow-black/40`}
				>
					<img
						src={asset("/imgs/stage/popsicle.webp")}
						alt="Wooden popsicle stick holding up the sign"
						className="w-[30vw] portrait:w-[24svh] max-w-none"
					/>
				</div>

				<img
					src={asset("/imgs/stage/tv.webp")}
					className="h-[50svh] w-[40svw] portrait:h-[30svh] portrait:w-[58vw] max-w-none relative z-1"
					alt="A TV on two popsicle sticks"
				/>
			</div>

			<h2
				className={`${LABEL} border-[0.2svh] top-[20svh] right-[11vw] portrait:right-[9vw] portrait:top-[7svh]`}
				style={word(0, 4)}
			>
				<Strings />
				Annual Art Competition
			</h2>
			<p
				className={`${LABEL} border-[0.2svh] top-[28svh] right-[11vw] portrait:right-[10vw] portrait:top-[13svh]`}
				style={word(1, 3)}
			>
				<Strings />
				Get the BEST artist Award
			</p>
			{/* "Sign up here" is in front of the frame, but its strings run
			    behind it like the others': they hang from an invisible copy of
			    it behind the frame, which moves exactly with it */}
			<span
				id="sign-up-strings"
				aria-hidden
				className={`${SIGN_UP} border-transparent bg-transparent text-transparent drop-shadow-none pointer-events-none`}
				style={word(2, 2)}
			>
				<Strings />
				Sign up here
			</span>
			<button
				onClick={signUp}
				disabled={!framed}
				tabIndex={framed ? undefined : -1}
				// Its strings get the click's little tug too
				data-tug-with="sign-up-strings"
				className={`${SIGN_UP} cursor-pointer disabled:cursor-default`}
				style={word(2, 9)}
			>
				Sign up here
			</button>

			{/* Zhenya - drops in on the left; at step 2 she turns round (the
			    scale flips through 0, like a cut-out) and goes over to the
			    right, a little higher; at step 3 she goes to the middle and
			    turns to face the pointer.  */}
			<Zhenya
				src={blinkSrc}
				className="h-svh absolute portrait:h-[66svh] max-w-none test-shadow"
				style={{
					visibility: step >= 1 ? "visible" : "hidden",
					// Moving over for a picked painting is quicker than walking
					transition: `transform 900ms ${DOLL_DROP}, top 900ms ease-in-out 300ms, ${chosen ? "left 500ms ease-out" : "left 1200ms ease-in-out 300ms"}, scale ${picking ? 350 : 600}ms ease-in-out`,
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
					top: portrait ? "-10svh" : filling ? "-35svh" : "-28svh",
					left: picking
						? `calc(50% - ${portrait ? "18.5svh" : "28svh"} ${chosen === "yours" ? "-" : "+"} ${chosen ? room : "0px"})`
						: signedUp
							? portrait
								? "calc(100% - 37svh + 6vw)"
								: "calc(100% - 56svh)"
							: portrait
								? "-16vw"
								: "-9vw",
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
				// Its own notes instead of the browser's
				noValidate
				onSubmit={(e) => {
					e.preventDefault();
					join();
				}}
				className="bottom-0 left-0 w-[35vw] h-[55svh] portrait:w-[92vw] portrait:h-auto portrait:left-[4vw] portrait:bottom-[2svh] absolute z-6 test-shadow px-[2vw] portrait:px-[4vw] py-[2svh] bg-cover bg-center"
				style={{
					backgroundImage: `url(${asset("/imgs/stage/paper-form2.webp")})`,
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
							className={`flex items-baseline justify-between gap-[1vw] text-[3svh] portrait:text-[2.2svh] ${i ? "mt-[2.2svh] portrait:mt-[1.6svh]" : ""}`}
						>
							{question}
							{/* Gender can be left unsaid */}
							{key === "gender" && (
								<button
									type="button"
									onClick={() => setAnswer("gender", NOT_SAYING)}
									tabIndex={filling ? undefined : -1}
									aria-pressed={answers.gender === NOT_SAYING}
									className="shrink-0 text-[1.9svh] portrait:text-[1.5svh] bg-white border-[0.2svh] border-black border-dashed px-[0.6vw] portrait:px-[2vw] cursor-pointer"
								>
									{NOT_SAYING}
								</button>
							)}
						</span>
						<input
							name={key}
							required
							{...(key === "age"
								? {
										// A whole number, with no up/down arrows
										type: "number",
										inputMode: "numeric" as const,
										min: LIMITS.age.min,
										max: LIMITS.age.max,
										step: 1,
									}
								: {
										type: "text",
										minLength: LIMITS[key].min,
										maxLength: LIMITS[key].max,
										// Just spaces don't count as an answer
										pattern: ".*\\S.*",
									})}
							value={answers[key]}
							onChange={(e) => setAnswer(key, e.target.value)}
							aria-invalid={errors[key] ? true : undefined}
							aria-describedby={errors[key] ? `${key}-problem` : undefined}
							placeholder={placeholder}
							autoComplete={autoComplete}
							ref={(el) => {
								fields.current[key] = el;
							}}
							tabIndex={filling ? undefined : -1}
							className="no-focus-ring [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none border-b-[0.3svh] w-full text-[3svh] portrait:text-[2.2svh] bg-transparent outline-none px-[0.5vw] pb-[1svh] border-black border-dashed"
						/>
						{/* What's wrong, if anything - and the long answer shows
						    how much room is left */}
						{(errors[key] || key === "aiArt") && (
							<span className="flex justify-between gap-[1vw] text-[1.8svh] portrait:text-[1.5svh] mt-[0.4svh]">
								<span id={`${key}-problem`}>
									{errors[key] && (
										<>
											{"-> "}
											{errors[key]}
										</>
									)}
								</span>
								{key === "aiArt" && (
									<span aria-hidden className="text-black/50">
										{answers.aiArt.length}/{LIMITS.aiArt.max}
									</span>
								)}
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
			{CHOICES.map(({ entry, label, side }, i) => {
				const dropIn = hang(picking, picking, "top", {
					ms: 900,
					easing: DOLL_DROP,
					delay: PICK_DELAY_MS + 200 + i * 150,
				});
				// The picked one grows (and moves up a little); the other shrinks
				// and moves a little out to its side
				const selected = chosen === entry;
				const other = chosen !== null && !selected;
				return (
					<div
						key={entry}
						className={`absolute top-[10svh] portrait:top-[40svh] ${side} z-4 flex flex-col items-center gap-[1.5svh] portrait:gap-[1svh] origin-top`}
						style={{
							...dropIn,
							// Growing and shrinking both just ease, with no bounce
							transition: `${dropIn.transition}, scale 500ms ease-out, translate 500ms ease-out`,
							scale: selected ? "1.12" : other ? "0.82" : "1",
							// The one not picked moves out to its side; the picked one
							// moves in, into the room Zhenya leaves
							translate: other
								? `${toward(entry, "out")}${OUT} 0`
								: selected
									? `${toward(entry, "in")}${room} -2svh`
									: "0 0",
						}}
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
										? asset("/imgs/art/drawing-lilies.webp")
										: (yours ?? asset("/imgs/art/empty_square_frame.webp"))
								}
								className="h-[38svh] portrait:h-[20svh] w-auto max-w-none relative"
								alt=""
								// Only the drawn frame counts (see opaqueAt)
								data-hit
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
							aria-pressed={selected}
							className={`${CHOICE_LABEL} relative z-1 cursor-pointer disabled:cursor-default ${selected ? "border-solid" : ""}`}
						>
							<Strings />
							{label}
						</button>
						{/* Nothing drawn yet: a way to go and draw something */}
						{entry === "yours" && !yours && (
							<a
								href="/page6"
								onClick={(e) => {
									if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
										return;
									e.preventDefault();
									goTo("/page6");
								}}
								tabIndex={picking ? undefined : -1}
								className="relative z-0 w-max max-w-[22vw] portrait:max-w-[44vw] text-[2.2svh] portrait:text-[1.6svh] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[2vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow cursor-pointer"
							>
								<Strings />
								You haven&apos;t drawn anything yet - Page 6 {"->"}
							</a>
						)}
					</div>
				);
			})}

			<PopsicleButton
				onClick={goOn}
				href="/page8"
				style={{
					visibility: chosen ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}`,
					transform: chosen ? "translateY(0)" : "translateY(100svh)",
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
