import { useEffect, useRef, useState } from "react";
import Strings from "@/components/Strings";
import PopsicleButton from "@/components/PopsicleButton";
import useBlinkingDoll, { DAPHNE } from "@/components/useBlinkingDoll";
import useFrownDoll, {
	FROWN_MS,
	ZHENYA_FROWN,
} from "@/components/useFrownDoll";
import useHeheDoll, { HEHE_MS } from "@/components/useHeheDoll";
import useWowDoll from "@/components/useWowDoll";
import { asset } from "@/lib/asset";
import MoneyStick from "@/components/MoneyStick";
import usePortrait from "@/components/usePortrait";
import { useStage } from "@/components/Stage";
import { HATS } from "@/lib/shop";
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
const TILT = "450ms cubic-bezier(0.34, 1.4, 0.64, 1) 550ms";

const SPIRAL_GONE_MS = 900 + 2000;
const FRAME3_MS = SPIRAL_GONE_MS + 500;
const AWW_MS = FRAME3_MS + 1100;

const DAPHNE_WALK_START_MS = 600;
const WALK_MS = 4000;
const DAPHNE_ARRIVED_MS = DAPHNE_WALK_START_MS + WALK_MS;
const THIS_IS_DAPHNE_MS = DAPHNE_ARRIVED_MS + 500;
const LIKES_TO_DRAW_MS = THIS_IS_DAPHNE_MS + 200;
const ASK_MS = LIKES_TO_DRAW_MS + 300;

const NICE_HAT_MS = 400;
const THANKS_MS = 1300;

const FRAME2_DELAY_MS = 300;
const MONEY_DELAY_MS = 1100;
const PRICE_DELAY_MS = 1900;
const CANCEL_DELAY_MS = 2700;
const BUY_DELAY_MS = 3100;

const SPIRAL2_IN_DELAY_MS = 400;
const SPIRAL2_GONE_MS = SPIRAL2_IN_DELAY_MS + 900 + 2000;
const SMILE_MS = SPIRAL2_GONE_MS + 500;

const PAINT_OUT = asset("/imgs/daphne/paint-out.webp");
const PAINT_AWAY = asset("/imgs/daphne/paint-away.webp");
const HOLDING_PALETTE = asset("/imgs/daphne/daphne-palette.webp");
const PAINT_MS = 910;

const CHOICES_MS = SMILE_MS + 1200;

const CHAT_EXIT_STAGGER_MS = 100;
const CHAT_ROWS = 5;
const ANSWER_START_MS = (CHAT_ROWS - 1) * CHAT_EXIT_STAGGER_MS + 800;

const DAPHNE_ANSWER = [
	"Well, art is not just a representation of the world,",
	"but also of how I see it - and art lets me share that with others.",
	"I truly feel a connection with the world and the people I share my art with,",
	"since I'm letting them peek into my mind and soul, and sharing a part of myself with them.",
];
const LAST_ANSWER = DAPHNE_ANSWER[DAPHNE_ANSWER.length - 1];

const PROPS = [
	{
		line: 0,
		src: asset("/imgs/daphne/earth.webp"),
		alt: "The Earth, held up on a popsicle stick",
		size: "h-[24svh] portrait:h-[13svh] bottom-[4svh] portrait:bottom-[3svh]",
		stick: "top-[75%] h-[40svh]",
		tilt: "-4deg",
	},
	{
		line: 1,
		src: asset("/imgs/daphne/glasses.webp"),
		alt: "A pair of glasses, held up on a popsicle stick",
		size: "h-[15svh] portrait:h-[8svh] bottom-[7svh] portrait:bottom-[5svh] ml-[-2.5vw] portrait:ml-0",
		stick: "top-[1svh] h-[44svh]",
		tilt: "3deg",
	},
	{
		line: 2,
		src: asset("/imgs/daphne/palette.webp"),
		alt: "A paint palette, held up on a popsicle stick",
		size: "h-[24svh] portrait:h-[13svh] bottom-[4svh] portrait:bottom-[3svh]",
		stick: "top-[75%] h-[40svh]",
		tilt: "-3deg",
	},
	{
		line: 3,
		src: asset("/imgs/daphne/heart.webp"),
		alt: "A heart, held up on a popsicle stick",
		size: "h-[26svh] portrait:h-[14svh] bottom-[4svh] portrait:bottom-[3svh]",
		stick: "top-[75%] h-[40svh]",
		tilt: "5deg",
	},
];

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
	const portrait = usePortrait();
	const [magic, setMagic] = useState(false);
	const [spiralGone, setSpiralGone] = useState(false);
	const [frame3, setFrame3] = useState(false);
	const [aww, setAww] = useState(false);
	const [done, setDone] = useState(false);

	const [daphneIn, setDaphneIn] = useState(false);
	const [walking, setWalking] = useState(false);
	const [daphneStep, setDaphneStep] = useState(0);
	const [asked, setAsked] = useState(false);
	const [bought, setBought] = useState(false);
	const [spiral2Gone, setSpiral2Gone] = useState(false);
	const [smile, setSmile] = useState(false);
	const [daphnePaint, setDaphnePaint] = useState<string | null>(null);

	const { buy: buyItem, give, donate, money, hat, wearing } = useStage();
	const hatName = hat && wearing ? HATS[wearing].name : null;
	const [greeted, setGreeted] = useState(false);
	const [niceHat, setNiceHat] = useState(false);
	const [thanks, setThanks] = useState(false);
	const [plea, setPlea] = useState<"poor" | "please" | null>(null);
	const [pleaDone, setPleaDone] = useState(false);
	const [donateOptions, setDonateOptions] = useState<number[] | null>(null);
	const [donated, setDonated] = useState(false);
	const moneyRef = useRef(money);
	useEffect(() => {
		moneyRef.current = money;
	}, [money]);
	const decided = bought || plea !== null;

	const [zhenyaStage, setZhenyaStage] = useState(0);
	const [choice, setChoice] = useState<"love" | "dislike" | null>(null);
	const [replied, setReplied] = useState(false);
	const chatCleared = zhenyaStage >= 6;
	const [answerLine, setAnswerLine] = useState<number | null>(null);
	const daphneSays = answerLine !== null ? DAPHNE_ANSWER[answerLine] : null;
	const daphneSaid = useLeaving(daphneSays);
	const nextUp = answerLine !== null && answerLine < DAPHNE_ANSWER.length - 1;
	const answerDone = answerLine === DAPHNE_ANSWER.length - 1;
	const backUp = answerLine !== null && answerLine > 0;

	const blinkSrc = useBlinkingDoll();
	const daphneBlinkSrc = useBlinkingDoll(DAPHNE);
	const hehe = useHeheDoll();
	const frown = useFrownDoll();
	const [face, setFace] = useState<"hehe" | "frown" | null>(null);
	const faceNow = useRef<"hehe" | "frown" | null>(null);
	const FACES = {
		hehe: { in: hehe.playHehe, out: hehe.playHeheReverse, ms: HEHE_MS },
		frown: { in: frown.playFrown, out: frown.playFrownReverse, ms: FROWN_MS },
	};
	const feel = (next: "hehe" | "frown" | null) => {
		const now = faceNow.current;
		if (now === next) return;
		faceNow.current = next;
		setFace(next);
		if (now) {
			FACES[now].out();
			if (next) later(FACES[now].ms - 40, FACES[next].in);
		} else if (next) FACES[next].in();
	};
	const faceSrc =
		face === "frown" ? (frown.src ?? hehe.src) : (hehe.src ?? frown.src);
	const daphneSrc = daphnePaint ?? faceSrc ?? daphneBlinkSrc;
	const wow = useWowDoll();
	const zhenyaFrown = useFrownDoll(ZHENYA_FROWN);
	const dollSrc = wow.src ?? zhenyaFrown.src ?? blinkSrc;

	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[1000, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	const magicTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
	useEffect(() => () => magicTimers.current.forEach(clearTimeout), []);

	const startMagic = () => {
		setMagic(true);
		magicTimers.current.push(
			setTimeout(() => setSpiralGone(true), SPIRAL_GONE_MS),
			setTimeout(() => {
				setFrame3(true);
				wow.playWow();
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

	const greet = () => {
		setGreeted(true);
		later(NICE_HAT_MS, () => setNiceHat(true));
		later(THANKS_MS, () => setThanks(true));
	};

	const ask = () => {
		setAsked(true);
		for (const src of [PAINT_OUT, HOLDING_PALETTE, PAINT_AWAY])
			new Image().src = src;
	};

	const buy = () => {
		const result = buyItem("daphne-drawing");
		if (result === "not-enough-money") {
			setPlea("poor");
			later(600, zhenyaFrown.playFrown);
			later(3000, () => {
				zhenyaFrown.playFrownReverse();
				draw(true, true);
			});
			return;
		}
		draw(false);
	};

	const cancel = () => setPlea("please");

	const draw = (free: boolean, keepPlea = false) => {
		if (keepPlea) later(SMILE_MS, () => setPleaDone(true));
		else setPleaDone(true);
		setBought(true);
		setDaphnePaint(PAINT_OUT);
		later(PAINT_MS, () => setDaphnePaint(HOLDING_PALETTE));
		later(SPIRAL2_GONE_MS, () => setSpiral2Gone(true));
		later(SMILE_MS, () => {
			setSmile(true);
			setDaphnePaint(PAINT_AWAY);
			if (free) give("daphne-drawing");
		});
		later(SMILE_MS + PAINT_MS, () => setDaphnePaint(null));
		later(CHOICES_MS, () => {
			if (!free) return setZhenyaStage(1);
			const m = moneyRef.current;
			const amounts = [1, 2, 5, 10].filter((a) => a < m);
			setDonateOptions(m > 0 ? [...amounts.slice(-3), m] : []);
		});
	};

	const giveDonation = (amount: number) => {
		setDonated(true);
		if (amount === 0) feel("frown");
		donate(amount);
		later(900, () => setZhenyaStage(1));
	};

	const choose = (c: "love" | "dislike") => {
		setChoice(c);
		feel(c === "love" ? "hehe" : "frown");
		setZhenyaStage(2);
		later(900, () => setReplied(true));
		later(2000, () => setZhenyaStage(3));
	};

	const askMagic = () => {
		setZhenyaStage(4);
		feel(null);
		later(1500, () => setZhenyaStage(5));
	};

	const askWhy = () => {
		setZhenyaStage(6);
		later(ANSWER_START_MS, () => setAnswerLine(0));
	};
	const rowExit = (row: number) =>
		chatCleared ? row * CHAT_EXIT_STAGGER_MS : 0;

	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="sr-only">Meet Daphne</h1>

			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[64svh] left-[4vw] portrait:bottom-[52svh] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={{
					...drop(step >= 2, 800, LABEL_DROP),
					transform:
						step >= 2 && !done ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<Strings />
				Click this magic button to get a cute drawing
			</p>

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

			<div
				className="absolute bottom-[6svh] left-[2vw] portrait:left-[4vw] z-5 test-shadow-darker"
				style={{
					...drop(step >= 2, 900),
					transform:
						step >= 2 && !spiralGone ? "translateY(0)" : "translateY(100svh)",
				}}
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

			<button
				onClick={finish}
				disabled={!aww || done}
				tabIndex={aww && !done ? undefined : -1}
				className="text-[4svh] portrait:text-[2.8svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[62svh] right-[2vw] portrait:bottom-[44svh] portrait:right-[6vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(aww, 800, LABEL_DROP),
					transform: aww && !done ? "translateY(0)" : "translateY(-100svh)",
				}}
			>
				<Strings />
				Aww cute!
			</button>

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

			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-max mx-auto text-center scribbler absolute bottom-[60svh] left-[57%] portrait:bottom-[30svh] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(
					daphneStep >= 1,
					daphneStep >= 1 && !asked && !greeted,
					"top",
				)}
			>
				<Strings />
				This is Daphne
			</p>

			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-max mx-auto text-center scribbler absolute bottom-[51svh] left-[57%] portrait:bottom-[22svh] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(
					daphneStep >= 2,
					daphneStep >= 2 && !asked && !greeted,
					"top",
					{ exitDelay: 80 },
				)}
			>
				<Strings />
				Daphne likes to draw
			</p>

			<button
				onClick={hatName ? greet : ask}
				disabled={daphneStep < 3 || asked || greeted}
				tabIndex={daphneStep >= 3 && !asked && !greeted ? undefined : -1}
				className={`text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] ${hatName ? "w-max !px-[2vw] portrait:!px-[4vw] !py-[1svh] ml-[-4vw] portrait:ml-0 !z-7" : "w-[24vw] portrait:w-[70vw]"} mx-auto text-center scribbler absolute bottom-[34svh] portrait:bottom-[8svh] left-[46%] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default`}
				style={(() => {
					const style = hang(daphneStep >= 3, daphneStep >= 3 && !asked, "top");
					return greeted && !asked
						? { ...style, transform: `translateY(${portrait ? -23 : -24}svh)` }
						: style;
				})()}
			>
				<Strings />
				{hatName
					? "Hi Daphne!"
					: "Daphne could you please draw something for me?"}
			</button>

			{hatName && (
				<>
					<p
						className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-max max-w-[26vw] portrait:max-w-[60vw] text-center scribbler absolute bottom-[42svh] left-[62%] ml-[-5vw] portrait:ml-0 portrait:bottom-[17svh] portrait:left-[56%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
						style={hang(niceHat, niceHat && !asked, "top")}
					>
						<Strings />
						Nice {hatName}!
					</p>
					<button
						onClick={ask}
						disabled={!thanks || asked}
						tabIndex={thanks && !asked ? undefined : -1}
						className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] w-[24vw] portrait:w-[70vw] mx-auto text-center scribbler absolute bottom-[25svh] portrait:bottom-[5svh] left-[46%] portrait:left-[50%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
						style={hang(thanks, thanks && !asked, "top", { exitDelay: 80 })}
					>
						<Strings />
						Thanks! Could you please draw something for me?
					</button>
				</>
			)}

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

			<div
				className="absolute bottom-[6svh] left-[50%] translate-x-[-50%] z-5 test-shadow-darker"
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

			<p
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] max-w-[22vw] portrait:max-w-[55vw] mx-auto text-center scribbler absolute bottom-[60svh] portrait:bottom-[44svh] left-[50%] translate-x-[-50%] bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] z-7 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(asked, asked && !decided, "top", { delay: PRICE_DELAY_MS })}
			>
				<Strings />
				Daphne charges $10 per drawing
			</p>

			<button
				onClick={cancel}
				disabled={!asked || decided}
				tabIndex={asked && !decided ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] mx-auto text-center scribbler absolute bottom-[50svh] left-[43%] portrait:bottom-[36svh] portrait:left-[32%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(asked, asked && !decided, "top", {
					delay: CANCEL_DELAY_MS,
				})}
			>
				<Strings />
				Cancel
			</button>

			<button
				onClick={buy}
				disabled={!asked || decided}
				tabIndex={asked && !decided ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] mx-auto text-center scribbler absolute bottom-[50svh] left-[60%] portrait:bottom-[36svh] portrait:left-[68%] translate-x-[-50%] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-6 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(asked, asked && !decided, "top", { delay: BUY_DELAY_MS })}
			>
				<Strings />
				Buy
			</button>

			<p
				className="absolute bottom-[60svh] portrait:bottom-[44svh] left-[50%] translate-x-[-50%] w-max max-w-[26vw] portrait:max-w-[80vw] z-7 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(plea !== null, plea !== null && !pleaDone, "top", {
					delay: 400,
				})}
			>
				<Strings />
				{plea === "please"
					? "Pleeease can I draw for you?"
					: "Aww man, you don't have $10 - any donation would help"}
			</p>

			<button
				onClick={() => draw(true)}
				disabled={plea !== "please" || pleaDone}
				tabIndex={plea === "please" && !pleaDone ? undefined : -1}
				className="absolute bottom-[50svh] portrait:bottom-[36svh] left-[40%] portrait:left-[50%] translate-x-[-50%] w-max z-6 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker border-dashed cursor-pointer disabled:cursor-default"
				style={hang(plea === "please", plea === "please" && !pleaDone, "top", {
					delay: 1000,
				})}
			>
				<Strings />
				Yes
			</button>

			<p
				className="absolute top-[4svh] portrait:top-[22svh] left-[50%] translate-x-[-50%] w-max max-w-[26vw] portrait:max-w-[80vw] z-7 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(
					donateOptions !== null,
					donateOptions !== null && !donated,
					"top",
				)}
			>
				<Strings />
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
						<Strings />
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
					<Strings />I love it!
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
					<Strings />I dislike it...
				</button>
			</div>

			<p
				className="absolute top-[12svh] left-[65%] portrait:top-[31svh] portrait:left-[70%] translate-x-[-50%] w-max z-8 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(replied, replied && !chatCleared, "top", {
					exitDelay: rowExit(1),
				})}
			>
				<Strings />
				{choice === "dislike" ? "Oh..." : "Thanks!"}
			</p>

			<button
				onClick={askMagic}
				disabled={zhenyaStage !== 3}
				tabIndex={zhenyaStage === 3 ? undefined : -1}
				className="absolute top-[21svh] left-[42%] portrait:top-[38svh] portrait:left-[34%] translate-x-[-50%] w-[18vw] portrait:w-[56vw] z-8 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(zhenyaStage >= 3, zhenyaStage >= 3 && !chatCleared, "top", {
					exitDelay: rowExit(2),
				})}
			>
				<Strings />
				Why won&apos;t you just use the magic button?
			</button>

			<p
				className="absolute top-[37svh] left-[53%] portrait:top-[50svh] portrait:left-[62%] translate-x-[-50%] w-[20vw] portrait:w-[56vw] z-7 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				style={hang(zhenyaStage >= 4, zhenyaStage >= 4 && !chatCleared, "top", {
					exitDelay: rowExit(3),
				})}
			>
				<Strings />I enjoy the process of creating art, it is part of me
			</p>

			<button
				onClick={askWhy}
				disabled={zhenyaStage !== 5}
				tabIndex={zhenyaStage === 5 ? undefined : -1}
				className="absolute top-[56svh] left-[44%] portrait:top-[64svh] portrait:left-[34%] translate-x-[-50%] w-max z-6 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={hang(zhenyaStage >= 5, zhenyaStage >= 5 && !chatCleared, "top", {
					exitDelay: rowExit(4),
				})}
			>
				<Strings />
				Really? Why?
			</button>

			<div className="absolute top-[13svh] portrait:top-[26svh] left-[50%] translate-x-[-50%] w-[24vw] portrait:w-[84vw] z-6">
				{daphneSaid && (
					<p
						key={`was-${daphneSaid}`}
						aria-hidden
						style={{ top: daphneSaid === LAST_ANSWER ? "-1svh" : 0 }}
						className="hang-out absolute top-0 left-[50%] translate-x-[-50%] w-max max-w-[24vw] portrait:max-w-[84vw] z-2 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
					>
						<Strings />
						{daphneSaid}
					</p>
				)}
				{daphneSays && (
					<p
						key={daphneSays}
						style={{ top: daphneSays === LAST_ANSWER ? "-1svh" : 0 }}
						className="hang-in absolute top-0 left-[50%] translate-x-[-50%] w-max max-w-[24vw] portrait:max-w-[84vw] z-1 text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker"
					>
						<Strings />
						{daphneSays}
					</p>
				)}
				<button
					onClick={() => setAnswerLine((line) => (line ?? 0) + 1)}
					disabled={!nextUp}
					tabIndex={nextUp ? undefined : -1}
					className="absolute top-[21svh] left-[80%] portrait:top-[16svh] portrait:left-[75%] translate-x-[-50%] w-max text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
					style={hang(answerLine !== null, nextUp, "top", { delay: 400 })}
				>
					<Strings />
					next {"->"}
				</button>
				<button
					onClick={() => setAnswerLine((line) => Math.max(0, (line ?? 0) - 1))}
					disabled={!backUp}
					tabIndex={backUp ? undefined : -1}
					className="absolute top-[21svh] left-[20%] portrait:top-[16svh] portrait:left-[25%] translate-x-[-50%] w-max text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
					style={hang(answerLine !== null && answerLine > 0, backUp, "top", {
						delay: 400,
					})}
				>
					<Strings />
					{"<-"} back
				</button>
			</div>

			{PROPS.map(({ line, src, alt, size, stick, tilt }, i) => {
				const shown = answerLine !== null && answerLine >= line;
				const up =
					shown && (i === PROPS.length - 1 || answerLine < PROPS[i + 1].line);
				return (
					<div
						key={src}
						className={`absolute left-[60%] portrait:left-[66%] translate-x-[-50%] ${size} z-5 test-shadow-darker`}
						style={{
							...hang(shown, up, "bottom", {
								ms: 900,
								easing: DOLL_DROP,
							}),
							rotate: tilt,
						}}
					>
						<img
							src={asset("/imgs/stage/popsicle-stick.webp")}
							className={`absolute w-[2vw] portrait:w-[2.5svh] max-w-none left-[50%] translate-x-[-50%] ${stick} z-0`}
							alt=""
							aria-hidden
						/>
						<img
							src={src}
							className="relative z-1 h-full w-auto max-w-none"
							alt={alt}
						/>
					</div>
				);
			})}

			<PopsicleButton
				onClick={nextPage}
				href="/every-artist-starts-somewhere"
				style={{
					...hang(answerDone, answerDone, "bottom", {
						ms: 900,
						easing: DOLL_DROP,
						delay: 1000,
					}),
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
