import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import useBlinkingDoll, { DAPHNE } from "@/components/useBlinkingDoll";
import useWowDoll from "@/components/useWowDoll";
import { asset } from "@/lib/asset";
import MoneyStick from "@/components/MoneyStick";
import usePortrait from "@/components/usePortrait";
import { useStage } from "@/components/Stage";
import useLeaving from "@/components/useLeaving";
import Zhenya from "@/components/Zhenya";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
// The magic button's tilt: it waits until its 800ms drop is almost done
// (550ms in), then swings to 6deg over 450ms with a light bounce. Used as
// "<property> ${TILT}", so the delay applies to each property it's used for
const TILT = "450ms cubic-bezier(0.34, 1.4, 0.64, 1) 550ms";

// What happens after MAGIC BUTTON is clicked (ms after the click): the
// spiral drops in (900ms) and spins for 2s, then it's pulled back up while
// the empty frame sinks; frame 3 rises in its place and the doll goes "wow";
// once the wow has played, "Aww cute!" drops in
const SPIRAL_GONE_MS = 900 + 2000;
const FRAME3_MS = SPIRAL_GONE_MS + 500;
const AWW_MS = FRAME3_MS + 1100;

// After "Aww cute!" (ms after the click): Zhenya flips (0.6s), then Daphne
// walks in from the right (WALK_MS). Half a second after she
// stops, the labels drop in between the two dolls, a second apart so each
// lands before the next one starts
const DAPHNE_WALK_START_MS = 600;
const WALK_MS = 4000;
const DAPHNE_ARRIVED_MS = DAPHNE_WALK_START_MS + WALK_MS;
const THIS_IS_DAPHNE_MS = DAPHNE_ARRIVED_MS + 500;
const LIKES_TO_DRAW_MS = THIS_IS_DAPHNE_MS + 1000;
const ASK_MS = LIKES_TO_DRAW_MS + 1000;

// After the ask button (ms after the click): each piece comes in once the
// one before has landed
const FRAME2_DELAY_MS = 300;
const MONEY_DELAY_MS = 1100;
const PRICE_DELAY_MS = 1900;
const CANCEL_DELAY_MS = 2700;
const BUY_DELAY_MS = 3100;

// After "Buy" (ms after the click): the spiral drops in (900ms, after a 0.4s
// pause for the money to start sinking), spins for 2s, then goes back up as
// the empty frame sinks, and the smile drawing rises in its place
const SPIRAL2_IN_DELAY_MS = 400;
const SPIRAL2_GONE_MS = SPIRAL2_IN_DELAY_MS + 900 + 2000;
const SMILE_MS = SPIRAL2_GONE_MS + 500;

// Daphne while she draws: paint-out brings out her palette (13 frames ×
// 70ms), then she holds it (its last frame) until the drawing is done, then
// paint-away puts it back and she returns to idle blinking
const PAINT_OUT = asset("/imgs/daphne/paint-out.webp");
const PAINT_AWAY = asset("/imgs/daphne/paint-away.webp");
const HOLDING_PALETTE = asset("/imgs/daphne/daphne-palette.webp");
const PAINT_MS = 910;

// After the drawing appears: "I love it!" / "I dislike it..." pop up near
// Zhenya once it has risen
const CHOICES_MS = SMILE_MS + 1200;

// After "Really? Why?", the chat's rows lift away one after another, top to
// bottom, this far apart; Daphne's answer starts once the last one is gone
const CHAT_EXIT_STAGGER_MS = 100;
const CHAT_ROWS = 5;
const ANSWER_START_MS = (CHAT_ROWS - 1) * CHAT_EXIT_STAGGER_MS + 800;

// Daphne's long answer, a line at a time ("next ->" swaps to the next one)
const DAPHNE_ANSWER = [
	"Well, art is not just a representation of the world,",
	"but also how I see it,",
	"and I'm able to use art to share it with others.",
	"I truly feel a connection with the world and the people who I share my art with,",
	"since I'm letting them take a peek into my mind and soul,",
	"and share a part of myself with them.",
];

// Hangs or stands something in place, or sends it off the top/bottom.
// `everShown` keeps it visible while it leaves; `delay` applies on the way in
// and `exitDelay` on the way out
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

const drop = (shown: boolean, ms = 800, easing = DOLL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

export default function Page5({ nextPage, curtainsOpen }: PageProps) {
	const [step, setStep] = useState(0);
	// Phones held upright get their own layout: smaller dolls at the top, the
	// frames and most labels below them (see the portrait: classes)
	const portrait = usePortrait();
	// Clicking "MAGIC BUTTON" drops the spiral drawing into the empty frame
	const [magic, setMagic] = useState(false);
	// …then the spiral goes back up and the empty frame sinks
	const [spiralGone, setSpiralGone] = useState(false);
	// …then frame 3 rises in its place
	const [frame3, setFrame3] = useState(false);
	// …then "Aww cute!" drops in
	const [aww, setAww] = useState(false);
	// Clicking "Aww cute!" sends everything off screen and the doll turns
	// round and walks over to the left
	const [done, setDone] = useState(false);

	// --- Daphne's scene, after "Aww cute!" ---
	// Daphne walks in from the left (bobbing while `walking`) and stops on
	// the right
	const [daphneIn, setDaphneIn] = useState(false);
	const [walking, setWalking] = useState(false);
	// 1 = "This is Daphne", 2 = "Daphne likes to draw", 3 = the ask button
	const [daphneStep, setDaphneStep] = useState(0);
	// Clicking the ask button: labels go, the empty frame, money, price and
	// Cancel / Buy come in
	const [asked, setAsked] = useState(false);
	// Clicking Buy: price and buttons go, money sinks, the spiral spins in
	// the frame…
	const [bought, setBought] = useState(false);
	// …then the spiral goes up, the empty frame sinks and the smile drawing
	// rises
	const [spiral2Gone, setSpiral2Gone] = useState(false);
	const [smile, setSmile] = useState(false);
	// Daphne's painting animation while she draws; null = idle blinking
	const [daphnePaint, setDaphnePaint] = useState<string | null>(null);

	// Paying Daphne goes through the inventory (the "?" menu): the drawing
	// costs $10 and is added to it. Too little money → a short message
	const { buy: buyItem, give, donate, money } = useStage();
	const [buyNote, setBuyNote] = useState<string | null>(null);
	// Can't pay ("poor") or clicked Cancel ("please"): Daphne asks to draw
	// anyway, for free, and asks for a donation once it's done.
	// pleaDone = her line lifts away (as she starts drawing, or once the
	// drawing is up for "poor")
	const [plea, setPlea] = useState<"poor" | "please" | null>(null);
	const [pleaDone, setPleaDone] = useState(false);
	// The donation ask after a free drawing: the amounts offered (based on
	// the money Zhenya has then), and whether one has been picked
	const [donateOptions, setDonateOptions] = useState<number[] | null>(null);
	const [donated, setDonated] = useState(false);
	const moneyRef = useRef(money);
	useEffect(() => {
		moneyRef.current = money;
	}, [money]);
	// Nothing to pick from Cancel / Buy any more
	const decided = bought || plea !== null;

	// --- The conversation after the drawing appears ---
	// It builds up like a chat, top to bottom, Zhenya on the left and Daphne
	// on the right. Zhenya's lines are buttons. zhenyaStage:
	// 1 = "I love it!" / "I dislike it..." up, 2 = answered, 3 = "Why won't
	// you just use the magic button?" up, 4 = asked, 5 = "Really? Why?" up,
	// 6 = asked - then the whole chat lifts away and Daphne's long answer
	// starts
	const [zhenyaStage, setZhenyaStage] = useState(0);
	const [choice, setChoice] = useState<"love" | "dislike" | null>(null);
	// Daphne's reply to the choice ("Thanks!" / "Oh...") is up
	const [replied, setReplied] = useState(false);
	const chatCleared = zhenyaStage >= 6;
	// Which line of DAPHNE_ANSWER is showing (after the chat has cleared)
	const [answerLine, setAnswerLine] = useState<number | null>(null);
	const daphneSays = answerLine !== null ? DAPHNE_ANSWER[answerLine] : null;
	// Daphne's previous answer line, while it lifts away
	const daphneSaid = useLeaving(daphneSays);
	const nextUp = answerLine !== null && answerLine < DAPHNE_ANSWER.length - 1;
	// Once her last line is up, the Continue button rises
	const answerDone = answerLine === DAPHNE_ANSWER.length - 1;

	// Idle doll, blinking every 1-3s like on the other pages, unless it's
	// doing its "wow"
	const blinkSrc = useBlinkingDoll();
	// Daphne idles and blinks the same way, with her own images
	const daphneBlinkSrc = useBlinkingDoll(DAPHNE);
	const daphneSrc = daphnePaint ?? daphneBlinkSrc;
	const wow = useWowDoll();
	const dollSrc = wow.src ?? blinkSrc;

	// Once the curtains have opened: the doll drops in, then "Click this
	// magic button…" (and the empty frame rises), then "MAGIC BUTTON" 0.6s
	// later, tilting near the end of its drop
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[1000, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	// The magic sequence's timers, cleared if the page goes away mid-way
	const magicTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
	useEffect(() => () => magicTimers.current.forEach(clearTimeout), []);

	const startMagic = () => {
		setMagic(true);
		magicTimers.current.push(
			setTimeout(() => setSpiralGone(true), SPIRAL_GONE_MS),
			setTimeout(() => {
				setFrame3(true);
				wow.playWow();
				// The magic button's drawing goes into the inventory
				give("magic-drawing");
			}, FRAME3_MS),
			setTimeout(() => setAww(true), AWW_MS),
		);
	};

	const later = (ms: number, fn: () => void) =>
		magicTimers.current.push(setTimeout(fn, ms));

	const finish = () => {
		setDone(true);
		wow.playWowReverse();
		later(DAPHNE_WALK_START_MS, () => {
			setDaphneIn(true);
			setWalking(true);
		});
		later(DAPHNE_ARRIVED_MS, () => setWalking(false));
		later(THIS_IS_DAPHNE_MS, () => setDaphneStep(1));
		later(LIKES_TO_DRAW_MS, () => setDaphneStep(2));
		later(ASK_MS, () => setDaphneStep(3));
	};

	const ask = () => {
		setAsked(true);
		// Get Daphne's painting animations ready, so they play straight away
		// if Buy is clicked
		for (const src of [PAINT_OUT, HOLDING_PALETTE, PAINT_AWAY])
			new Image().src = src;
	};

	const buy = () => {
		const result = buyItem("daphne-drawing");
		if (result === "not-enough-money") {
			// "Aww man, any donation would help" - then she draws anyway, with
			// it still up
			setPlea("poor");
			later(3000, () => draw(true, true));
			return;
		}
		if (result !== "bought") {
			setBuyNote("You already have one!");
			later(1500, () => setBuyNote(null));
			return;
		}
		draw(false);
	};

	// Cancel: "Pleeease can I draw for you?" - and the only answer is Yes
	const cancel = () => setPlea("please");

	// Daphne draws. `free` = she wasn't paid: the drawing is given to Zhenya
	// once it's up, and she asks for a donation before the chat starts.
	// `keepPlea` = her line stays up the whole time she draws, and lifts away
	// once the drawing is up (otherwise it goes as she starts)
	const draw = (free: boolean, keepPlea = false) => {
		if (keepPlea) later(SMILE_MS, () => setPleaDone(true));
		else setPleaDone(true);
		setBought(true);
		// Daphne gets her palette out and holds it while she draws…
		setDaphnePaint(PAINT_OUT);
		later(PAINT_MS, () => setDaphnePaint(HOLDING_PALETTE));
		later(SPIRAL2_GONE_MS, () => setSpiral2Gone(true));
		// …and once the drawing is up, puts it away and goes back to idle
		later(SMILE_MS, () => {
			setSmile(true);
			setDaphnePaint(PAINT_AWAY);
			if (free) give("daphne-drawing");
		});
		later(SMILE_MS + PAINT_MS, () => setDaphnePaint(null));
		later(CHOICES_MS, () => {
			if (!free) return setZhenyaStage(1);
			// A few amounts up to everything Zhenya has
			const m = moneyRef.current;
			const amounts = [1, 2, 5, 10].filter((a) => a < m);
			setDonateOptions(m > 0 ? [...amounts.slice(-3), m] : []);
		});
	};

	// A donation (or none): the ask lifts away, then the chat starts
	const giveDonation = (amount: number) => {
		setDonated(true);
		donate(amount);
		later(900, () => setZhenyaStage(1));
	};

	// Zhenya likes or dislikes it: the drawing leaves, Daphne answers, then
	// Zhenya asks about the magic button
	// Zhenya likes or dislikes it: the other choice lifts away, the drawing
	// leaves, Daphne replies, then Zhenya asks about the magic button
	const choose = (c: "love" | "dislike") => {
		setChoice(c);
		setZhenyaStage(2);
		later(900, () => setReplied(true));
		later(2000, () => setZhenyaStage(3));
	};

	const askMagic = () => {
		setZhenyaStage(4);
		later(1500, () => setZhenyaStage(5));
	};

	// The chat lifts away row by row, then Daphne starts her long answer
	const askWhy = () => {
		setZhenyaStage(6);
		later(ANSWER_START_MS, () => setAnswerLine(0));
	};
	// How long a chat row waits before lifting away, once it's being cleared
	const rowExit = (row: number) =>
		chatCleared ? row * CHAT_EXIT_STAGGER_MS : 0;

	return (
		<div className="h-full flex flex-col items-center justify-center">
			{/* The page's title, for screen readers and search engines */}
			<h1 className="sr-only">Zhenya</h1>

			{/* "Click this magic button…" - drops in at 0.4s; lifts away once
			    "Aww cute!" is clicked */}
			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[64svh] left-[4vw] portrait:bottom-[52svh] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					...drop(step >= 2, 800, LABEL_DROP),
					transform:
						step >= 2 && !done ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Click this magic button to get a cute drawing
			</p>

			{/* "MAGIC BUTTON" - drops in at 1.0s and, just before it lands, tilts
			    to 6deg, settling with a light bounce. The tilt uses the CSS rotate
			    property, separate from the drop's transform. Its strings turn the
			    other way (and shift) at the same time so they keep hanging
			    straight down. Lifts away once "Aww cute!" is clicked */}
			<button
				onClick={startMagic}
				disabled={step < 3 || magic}
				className="text-[4svh] portrait:text-[2.8svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[50svh] left-[2vw] portrait:bottom-[40svh] portrait:left-[4vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					visibility: step >= 3 ? "visible" : "hidden",
					transition: `transform 800ms ${LABEL_DROP}, rotate ${TILT}`,
					transform:
						step >= 3 && !done ? "translateY(0)" : "translateY(-100svh)",
					rotate: step >= 3 ? "6deg" : "0deg",
				}}
			>
				<span
					className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] absolute"
					style={{
						transition: `rotate ${TILT}, left ${TILT}`,
						rotate: step >= 3 ? "-6deg" : "0deg",
						left: step >= 3 ? "-2.8vw" : "0",
					}}
				></span>
				<span
					className="w-[0.1vw] bg-black/60 h-svh absolute"
					style={{
						transition: `rotate ${TILT}, right ${TILT}, top ${TILT}`,
						rotate: step >= 3 ? "-6deg" : "0deg",
						right: step >= 3 ? "3vw" : "0",
						top: step >= 3 ? "-99.7svh" : "-100svh",
					}}
				></span>
				MAGIC BUTTON
			</button>

			{/* Empty frame - rises from the bottom on a popsicle stick at 0.4s,
			    under MAGIC BUTTON (which sits at bottom-[50svh] left-[2vw]). Sinks
			    back down once the spiral has had its 2s. z-5 so the labels (z-6)
			    sit in front of the spiral's string */}
			<div
				className="absolute bottom-[6svh] left-[2vw] portrait:left-[4vw] z-5 test-shadow-darker"
				style={{
					...drop(step >= 2, 900),
					transform:
						step >= 2 && !spiralGone ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				{/* popsicle-stick.webp is just the stick, so w-/h- are its real size */}
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2vw] portrait:w-[2.5svh] h-[35svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0"
					alt="Wooden popsicle stick holding up the frame"
				/>
				<img
					src={asset("/imgs/art/empty_square_frame.webp")}
					className="h-[38svh] portrait:h-[28svh] w-auto max-w-none relative z-1"
					alt="An empty picture frame"
				/>
			</div>

			{/* Spiral - sits exactly over the empty frame (same spot, same size:
			    38svh tall at 705×762 is 35.2svh wide), but separate from it, so it
			    can be pulled back up while the frame sinks. Drops in from the top
			    on one string into the middle of the frame, spins for 2s, then
			    goes back up. The string ends at the centre of the drawing, drawn
			    in front so the spiral looks pinned there. Only the drawing spins
			    (.spiral-spin); the string hangs from a holder that doesn't
			    rotate */}
			<div className="absolute bottom-[6svh] left-[2vw] portrait:left-[4vw] h-[38svh] w-[35.2svh] portrait:h-[28svh] portrait:w-[25.9svh] z-5 pointer-events-none">
				<div
					className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
					style={{
						visibility: magic ? "visible" : "hidden",
						transition: `transform 900ms ${LABEL_DROP}`,
						transform:
							magic && !spiralGone ? "translateY(0)" : "translateY(-120svh)",
					}}
				>
					<span className="w-[0.1vw] bg-black/60 h-svh bottom-[50%] left-[50%] translate-x-[-50%] absolute z-1"></span>
					<img
						src={asset("/imgs/art/spiral.webp")}
						className="h-[16svh] portrait:h-[12svh] w-auto max-w-none spiral-spin"
						alt="A cute spiral drawing"
					/>
				</div>
			</div>

			{/* Frame 3 - rises on its popsicle stick where the empty frame was,
			    once the empty frame has gone; sinks again once "Aww cute!" is
			    clicked */}
			<div
				className="absolute bottom-[6svh] left-[2vw] portrait:left-[4vw] z-5 test-shadow-darker"
				style={{
					...drop(frame3, 900),
					transform: frame3 && !done ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2vw] portrait:w-[2.5svh] h-[35svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0"
					alt="Wooden popsicle stick holding up the frame"
				/>
				<img
					src={asset("/imgs/art/drawing-lilies.webp")}
					className="h-[38svh] portrait:h-[28svh] w-auto max-w-none relative z-1"
					alt="A drawing of lilies, in a picture frame"
				/>
			</div>

			{/* "Aww cute!" - drops in at the top right once the doll's "wow" has
			    played; clicking it sends everything off screen */}
			<button
				onClick={finish}
				disabled={!aww || done}
				// Off screen (and out of the Tab order) until it has dropped in
				tabIndex={aww && !done ? undefined : -1}
				className="text-[4svh] portrait:text-[2.8svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[62svh] right-[2vw] portrait:bottom-[44svh] portrait:right-[6vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(aww, 800, LABEL_DROP),
					transform: aww && !done ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Aww cute!
			</button>

			{/* Doll - mirrored (scale -1) on the right. Once "Aww cute!" is
			    clicked it turns to face the other way (the scale flips through 0,
			    like turning a cut-out round) and walks over to the left, playing
			    wow-reverse and then going back to idle blinking */}
			<Zhenya
				src={dollSrc}
				className="h-svh absolute top-[-28svh] portrait:h-[52svh] portrait:top-[-12svh] max-w-none translate-x-[-50%] test-shadow-darker z-5"
				style={{
					visibility: step >= 1 ? "visible" : "hidden",
					transition: `top 900ms ${DOLL_DROP}, transform 900ms ${DOLL_DROP}, left 1200ms ease-in-out, scale 600ms ease-in-out`,
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
					left: done ? (portrait ? "22%" : "8%") : portrait ? "62%" : "60%",
					scale: done ? "1 1" : "-1 1",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			{/* ---------- Daphne's scene, after "Aww cute!" ---------- */}

			{/* Daphne - same size as Zhenya, mirrored (-scale-x-[1]) so she faces
			    her. Walks in from off the right edge and stops on the right side
			    (her left slides from 160% to 82% over WALK_MS), stepping gently
			    (.walk-bob) until she stops */}
			<div
				className="absolute top-[-28svh] h-svh portrait:h-[52svh] portrait:top-[-12svh] translate-x-[-50%] scale-x-[-1] z-4"
				style={{
					visibility: daphneIn ? "visible" : "hidden",
					transition: `left ${WALK_MS}ms cubic-bezier(0.25, 0.1, 0.45, 1)`,
					left: daphneIn ? (portrait ? "78%" : "88%") : "160%",
				}}
			>
				<img
					src={daphneSrc}
					className={`h-full w-auto max-w-none test-shadow-darker ${walking ? "walk-bob" : ""}`}
					alt="Daphne, another marionette doll on strings"
				/>
			</div>

			{/* "This is Daphne" - drops in between the two dolls; lifts away
			    once the ask button is clicked */}
			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-max mx-auto text-center scribbler absolute bottom-[60svh] left-[57%] portrait:bottom-[30svh] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(daphneStep >= 1, daphneStep >= 1 && !asked, "top")}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				This is Daphne
			</p>

			{/* "Daphne likes to draw" - a second later */}
			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-max mx-auto text-center scribbler absolute bottom-[51svh] left-[57%] portrait:bottom-[22svh] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(daphneStep >= 2, daphneStep >= 2 && !asked, "top")}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Daphne likes to draw
			</p>

			{/* Ask button (dashed) - a second later; clicking it clears the labels
			    and brings in the frame, money, price and Cancel / Buy */}
			<button
				onClick={ask}
				disabled={daphneStep < 3 || asked}
				tabIndex={daphneStep >= 3 && !asked ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-[24vw] portrait:w-[70vw] mx-auto text-center scribbler absolute bottom-[34svh] portrait:bottom-[8svh] left-[46%] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(daphneStep >= 3, daphneStep >= 3 && !asked, "top")}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Daphne could you please draw something for me?
			</button>

			{/* Empty frame (2) - rises in the middle just after asking; sinks
			    once the spiral has had its 2s */}
			<div
				className="absolute bottom-[6svh] left-[50%] translate-x-[-50%] z-5 test-shadow-darker"
				style={hang(asked, asked && !spiral2Gone, "bottom", {
					ms: 900,
					easing: DOLL_DROP,
					delay: FRAME2_DELAY_MS,
				})}
			>
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2vw] portrait:w-[2.5svh] h-[35svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0"
					alt="Wooden popsicle stick holding up the frame"
				/>
				<img
					src={asset("/imgs/art/empty_square_frame.webp")}
					className="h-[38svh] portrait:h-[28svh] w-auto max-w-none relative z-1"
					alt="An empty picture frame"
				/>
			</div>

			{/* Spiral (2) - over the middle frame, same as the first one: drops
			    in on one string after Buy, spins for 2s, then goes back up */}
			<div className="absolute bottom-[6svh] left-[50%] translate-x-[-50%] h-[38svh] w-[35.2svh] portrait:h-[28svh] portrait:w-[25.9svh] z-5 pointer-events-none">
				<div
					className="absolute top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]"
					style={hang(bought, bought && !spiral2Gone, "top", {
						ms: 900,
						delay: SPIRAL2_IN_DELAY_MS,
					})}
				>
					<span className="w-[0.1vw] bg-black/60 h-svh bottom-[50%] left-[50%] translate-x-[-50%] absolute z-1"></span>
					<img
						src={asset("/imgs/art/spiral.webp")}
						className="h-[16svh] portrait:h-[12svh] w-auto max-w-none spiral-spin"
						alt="A spiral, Daphne drawing"
					/>
				</div>
			</div>

			{/* Smile drawing - rises in the middle frame's place once the spiral
			    has gone */}
			<div
				className="absolute bottom-[6svh] left-[50%] translate-x-[-50%] z-5 test-shadow-darker"
				// Leaves once Zhenya says whether they like it
				style={hang(smile, smile && !choice, "bottom", {
					ms: 900,
					easing: DOLL_DROP,
				})}
			>
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2vw] portrait:w-[2.5svh] h-[35svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0"
					alt="Wooden popsicle stick holding up the drawing"
				/>
				<img
					src={asset("/imgs/art/drawing-smile.webp")}
					className="h-[38svh] portrait:h-[28svh] w-auto max-w-none relative z-1"
					alt="Daphne's drawing of a smiley face on an easel, in a picture frame"
				/>
			</div>

			{/* Money - the popsicle with money from the souvenir shop. Rises next
			    to the frame once it has landed; sinks once Buy is clicked */}
			<div
				className="absolute left-[20%] bottom-[12svh] portrait:left-[4vw] portrait:bottom-[10svh] z-6 test-shadow-darker"
				style={hang(asked, asked && !decided, "bottom", {
					ms: 900,
					easing: DOLL_DROP,
					delay: MONEY_DELAY_MS,
				})}
			>
				<MoneyStick />
			</div>

			{/* "Daphne charges $10 per drawing" - after the money; lifts away
			    once Buy is clicked */}
			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[60svh] portrait:bottom-[44svh] left-[50%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-7 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(asked, asked && !decided, "top", { delay: PRICE_DELAY_MS })}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Daphne charges $10 per drawing
			</p>

			{/* Cancel - after the price. Daphne begs to draw anyway */}
			<button
				onClick={cancel}
				disabled={!asked || decided}
				tabIndex={asked && !decided ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] mx-auto text-center scribbler absolute bottom-[50svh] left-[43%] portrait:bottom-[36svh] portrait:left-[32%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(asked, asked && !decided, "top", {
					delay: CANCEL_DELAY_MS,
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Cancel
			</button>

			{/* Buy - just after Cancel: money out, spiral in, then the drawing */}
			<button
				onClick={buy}
				disabled={!asked || decided}
				tabIndex={asked && !decided ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] mx-auto text-center scribbler absolute bottom-[50svh] left-[60%] portrait:bottom-[36svh] portrait:left-[68%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(asked, asked && !decided, "top", { delay: BUY_DELAY_MS })}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				{buyNote ?? "Buy"}
			</button>

			{/* Daphne's plea - where the price was, once Buy fails (not enough
			    money) or Cancel is clicked. "Pleeease…" lifts away as she starts
			    drawing; "…any donation would help" stays up while she draws,
			    until the drawing is up */}
			<p
				className="absolute bottom-[60svh] portrait:bottom-[44svh] left-[50%] translate-x-[-50%] w-max max-w-[26vw] portrait:max-w-[80vw] z-7 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(plea !== null, plea !== null && !pleaDone, "top", {
					delay: 400,
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				{plea === "please"
					? "Pleeease can I draw for you?"
					: "Aww man, you don't have $10 - any donation would help"}
			</p>

			{/* After Cancel, the only answer: Yes. She draws for free */}
			<button
				onClick={() => draw(true)}
				disabled={plea !== "please" || pleaDone}
				tabIndex={plea === "please" && !pleaDone ? undefined : -1}
				className="absolute bottom-[50svh] portrait:bottom-[36svh] left-[40%] portrait:left-[50%] translate-x-[-50%] w-max z-6 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker border-dashed cursor-pointer disabled:cursor-default"
				style={hang(plea === "please", plea === "please" && !pleaDone, "top", {
					delay: 1000,
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Yes
			</button>

			{/* The donation ask - after a free drawing is up. Amounts depend on
			    Zhenya's money; picking one (or none) starts the chat */}
			<p
				className="absolute top-[4svh] portrait:top-[22svh] left-[50%] translate-x-[-50%] w-max max-w-[26vw] portrait:max-w-[80vw] z-7 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(
					donateOptions !== null,
					donateOptions !== null && !donated,
					"top",
				)}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Would you like to donate? Anything helps!
			</p>
			<div
				className="absolute top-[19svh] portrait:top-[31svh] left-[50%] translate-x-[-50%] flex flex-wrap justify-center gap-[1.5vw] portrait:gap-[2.5vw] portrait:w-[92vw] z-6"
				style={hang(
					donateOptions !== null,
					donateOptions !== null && !donated,
					"top",
					{ delay: 600 },
				)}
			>
				{[...(donateOptions ?? []), 0].map((amount, i, all) => (
					<button
						key={amount}
						onClick={() => giveDonation(amount)}
						disabled={donateOptions === null || donated}
						tabIndex={donateOptions !== null && !donated ? undefined : -1}
						className="relative w-max text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker border-dashed cursor-pointer disabled:cursor-default"
					>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
						{amount === 0
							? all.length === 1
								? "Sorry, I have nothing..."
								: "No, sorry"
							: i === all.length - 2 && all.length > 2
								? `All $${amount}`
								: `$${amount}`}
					</button>
				))}
			</div>

			{/* ---------- The conversation, after the drawing appears ----------
			    A chat that builds up top to bottom: Zhenya's lines (buttons) on
			    the left at 30%, Daphne's on the right at 60%. Each row has its
			    own height, so nothing overlaps. Earlier rows sit in front (higher
			    z) so the later rows' strings pass behind them. Clicking
			    "Really? Why?" lifts the chat away row by row, top to bottom */}

			{/* Row 1 - Zhenya: "I love it!" / "I dislike it..." side by side.
			    The one not picked lifts away; the picked one stays */}
			<div className="absolute top-[6svh] left-[40%] portrait:top-[24svh] portrait:left-[50%] translate-x-[-50%] flex gap-[1.5vw] portrait:gap-[4vw] z-9">
				<button
					onClick={() => choose("love")}
					disabled={zhenyaStage !== 1}
					tabIndex={zhenyaStage === 1 ? undefined : -1}
					className="w-max relative text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
					style={hang(
						zhenyaStage >= 1,
						zhenyaStage >= 1 && choice !== "dislike" && !chatCleared,
						"top",
						{ exitDelay: rowExit(0) },
					)}
				>
					<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
					<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
					I love it!
				</button>
				<button
					onClick={() => choose("dislike")}
					disabled={zhenyaStage !== 1}
					tabIndex={zhenyaStage === 1 ? undefined : -1}
					className="w-max relative text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
					style={hang(
						zhenyaStage >= 1,
						zhenyaStage >= 1 && choice !== "love" && !chatCleared,
						"top",
						{ exitDelay: rowExit(0) },
					)}
				>
					<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
					<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
					I dislike it...
				</button>
			</div>

			{/* Row 2 - Daphne: "Thanks!" / "Oh..." */}
			<p
				className="absolute top-[12svh] left-[65%] portrait:top-[31svh] portrait:left-[70%] translate-x-[-50%] w-max z-8 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(replied, replied && !chatCleared, "top", {
					exitDelay: rowExit(1),
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				{choice === "dislike" ? "Oh..." : "Thanks!"}
			</p>

			{/* Row 3 - Zhenya: "Why won't you just use the magic button?" */}
			<button
				onClick={askMagic}
				disabled={zhenyaStage !== 3}
				tabIndex={zhenyaStage === 3 ? undefined : -1}
				className="absolute top-[21svh] left-[42%] portrait:top-[38svh] portrait:left-[34%] translate-x-[-50%] w-[18vw] portrait:w-[56vw] z-8 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(zhenyaStage >= 3, zhenyaStage >= 3 && !chatCleared, "top", {
					exitDelay: rowExit(2),
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Why won&apos;t you just use the magic button?
			</button>

			{/* Row 4 - Daphne: "I enjoy the process of creating art…" */}
			<p
				className="absolute top-[37svh] left-[53%] portrait:top-[50svh] portrait:left-[62%] translate-x-[-50%] w-[20vw] portrait:w-[56vw] z-7 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(zhenyaStage >= 4, zhenyaStage >= 4 && !chatCleared, "top", {
					exitDelay: rowExit(3),
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				I enjoy the process of creating art, it is part of me
			</p>

			{/* Row 5 - Zhenya: "Really? Why?" - clicking it clears the chat */}
			<button
				onClick={askWhy}
				disabled={zhenyaStage !== 5}
				tabIndex={zhenyaStage === 5 ? undefined : -1}
				className="absolute top-[56svh] left-[44%] portrait:top-[64svh] portrait:left-[34%] translate-x-[-50%] w-max z-6 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(zhenyaStage >= 5, zhenyaStage >= 5 && !chatCleared, "top", {
					exitDelay: rowExit(4),
				})}
			>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
				Really? Why?
			</button>

			{/* Daphne's long answer - after the chat has cleared, one line at a
			    time near Daphne. A new line hangs in (.hang-in) while the
			    previous one lifts away (.hang-out), staying in front (z-2) like
			    it was until it's gone. "next ->" sits under it, then
			    lifts away after the last line */}
			<div className="absolute top-[13svh] portrait:top-[26svh] left-[50%] translate-x-[-50%] w-[24vw] portrait:w-[84vw] z-6">
				{daphneSaid && (
					<p
						key={`was-${daphneSaid}`}
						aria-hidden
						className="hang-out absolute top-0 left-[50%] translate-x-[-50%] w-max max-w-[24vw] portrait:max-w-[84vw] z-2 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
					>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
						{daphneSaid}
					</p>
				)}
				{daphneSays && (
					<p
						key={daphneSays}
						className="hang-in absolute top-0 left-[50%] translate-x-[-50%] w-max max-w-[24vw] portrait:max-w-[84vw] z-1 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
					>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
						{daphneSays}
					</p>
				)}
				<button
					onClick={() => setAnswerLine((line) => (line ?? 0) + 1)}
					disabled={!nextUp}
					tabIndex={nextUp ? undefined : -1}
					className="absolute top-[18svh] left-[80%] portrait:top-[16svh] portrait:left-[75%] translate-x-[-50%] w-max text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
					style={hang(answerLine !== null, nextUp, "top", { delay: 400 })}
				>
					<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
					<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
					next {"->"}
				</button>
			</div>

			{/* Continue - rises 1s after Daphne's last line ("and share a part
			    of myself with them."), and goes to the next page. Same spot and
			    look as on Page 4 */}
			<PopsicleButton
				onClick={nextPage}
				href="/page6"
				style={{
					...hang(answerDone, answerDone, "bottom", {
						ms: 900,
						easing: DOLL_DROP,
						delay: 1000,
					}),
					// Inline so these beat the component's right-0, bottom-0 and
					// test-shadow-darker: further right, lower, and a darker shadow
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					// In front of everything on the page (labels, chat, dolls and
					// the curtains at z-10), but still under the menu, its
					// backdrop and the curtain animation (z-21 and up)
					zIndex: 20,
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
