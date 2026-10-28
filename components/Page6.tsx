import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll, { DAPHNE } from "@/components/useBlinkingDoll";
import useHeheDoll from "@/components/useHeheDoll";
import useWowDoll from "@/components/useWowDoll";
import { asset } from "@/lib/asset";
import usePortrait from "@/components/usePortrait";
import { FRAMES } from "@/lib/frames";
import { saveDrawing } from "@/lib/drawings";
import { drawRandomDoodle } from "@/lib/doodles";
import { ITEMS } from "@/lib/shop";
import {
	penDown as startStroke,
	penMove,
	penUp,
	pointsOn,
	type Pen,
} from "@/lib/stroke";
import Zhenya from "@/components/Zhenya";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

// Page 6 - Zhenya tries making art, and you're the one drawing. After Daphne
// explains why she draws herself instead of using the magic button, an empty
// frame rises and you draw in it (Zhenya does the drawing animation while you
// do). If you bought the notebook or pens in the souvenir shop, they come out
// as Zhenya's tools; otherwise Daphne lends her palette. Zhenya isn't sure it
// looks good - Daphne asks whether it was fun - and your drawing joins a
// gallery of every artwork from the story

const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

// After "Let's draw!" (ms after the click)
const FRAME_MS = 300; // the empty frame rises
const TOOLS_MS = 900; // the tools come out
const CAN_DRAW_MS = 1300; // the instructions and Clear / Done drop in

// Daphne's palette (from Page 5): paint-out, then holding it, then paint-away
const PAINT_OUT = asset("/imgs/daphne/paint-out.webp");
const PAINT_AWAY = asset("/imgs/daphne/paint-away.webp");
const HOLDING_PALETTE = asset("/imgs/daphne/daphne-palette.webp");
const PAINT_MS = 910;

// After "Yes, I did!", the three lines of talk lift away top to bottom, this
// far apart (like the chat on Page 5)
const TALK_EXIT_STAGGER_MS = 100;

// The gallery hangs in one frame at a time, this far apart
const GALLERY_STAGGER_MS = 150;

// The see-through window of empty_square_frame.webp (705×762), as % of the
// image: 14.7-84.8% across, 16.9-82.4% down. The canvas sits just inside it
const CANVAS_BOX = "absolute left-[15.2%] top-[17.4%] w-[69.1%] h-[64.5%]";

// Puts a drawing into the empty frame, as one image (PNG data URL): the
// paper and drawing in the frame's window (where CANVAS_BOX sits), the frame
// over the top
const framed = (drawing: string) =>
	new Promise<string>((resolve) => {
		const frame = new Image();
		const art = new Image();
		let loaded = 0;
		const draw = () => {
			if (++loaded < 2) return;
			const canvas = document.createElement("canvas");
			canvas.width = frame.naturalWidth;
			canvas.height = frame.naturalHeight;
			const ctx = canvas.getContext("2d")!;
			const box = [
				0.152 * canvas.width,
				0.174 * canvas.height,
				0.691 * canvas.width,
				0.645 * canvas.height,
			] as const;
			ctx.fillStyle = "white";
			ctx.fillRect(...box);
			ctx.drawImage(art, ...box);
			ctx.drawImage(frame, 0, 0);
			// WebP keeps it small enough to save (PNG where WebP isn't
			// supported)
			resolve(canvas.toDataURL("image/webp", 0.85));
		};
		frame.onload = art.onload = draw;
		// Without the frame, keep the drawing as it is
		frame.onerror = () => resolve(drawing);
		frame.src = asset("/imgs/art/empty_square_frame.webp");
		art.src = drawing;
	});

// The colors to draw with, in the row above the frame. Brown is picked to
// start with
const COLORS = [
	{ name: "Blue", value: "#2f5fd0" },
	{ name: "Yellow", value: "#f2c522" },
	{ name: "Orange", value: "#f07f1f" },
	{ name: "Brown", value: "#7a4a24" },
];

// The frame's height normally, and after "Bigger"; how long it takes to grow
const FRAME_VH = 38;
const BIG_FRAME_VH = 50;
// …and on portrait screens (phones held upright)
const PORTRAIT_FRAME_VH = 30;
const PORTRAIT_BIG_FRAME_VH = 40;
const GROW_MS = 500;

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

const LABEL =
	"text-[3svh] portrait:text-[2.3svh] portrait:px-[2.5vw] text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer disabled:cursor-default`;

// A label's two hanging strings
const Strings = () => (
	<>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
	</>
);

// Your finished drawing in the empty frame, for the gallery
const YourArt = ({
	drawingUrl,
	className = "",
}: {
	drawingUrl: string | null;
	className?: string;
}) => (
	<div className={`relative ${className}`}>
		{drawingUrl && (
			<img
				src={drawingUrl}
				className={`${CANVAS_BOX} bg-white`}
				alt="Your drawing"
			/>
		)}
		<img
			src={asset("/imgs/art/empty_square_frame.webp")}
			className="relative h-full w-auto max-w-none"
			alt=""
		/>
	</div>
);

export default function Page6({ nextPage, curtainsOpen }: PageProps) {
	const { owned, keepDrawing } = useStage();
	// Zhenya's tools: whatever you bought in the souvenir shop, if anything
	const tools = (["notebook", "pens"] as const).filter((item) =>
		owned.includes(item),
	);
	const ownsDaphneDrawing = owned.includes("daphne-drawing");

	const [step, setStep] = useState(0);
	// 1 = "Let's draw!" clicked, 2 = Done clicked, 3 = "Hmm…" clicked,
	// 4 = "Yes, I did!" clicked
	const [stage, setStage] = useState(0);
	const [frameUp, setFrameUp] = useState(false);
	const [toolsUp, setToolsUp] = useState(false);
	const [canDraw, setCanDraw] = useState(false);
	const [verdict, setVerdict] = useState(false);
	const [goodTime, setGoodTime] = useState(false);
	const [galleryUp, setGalleryUp] = useState(false);
	const [showContinue, setShowContinue] = useState(false);

	// Zhenya: idle blinking, the "moving" animation while you draw, or "wow"
	const zhenyaBlink = useBlinkingDoll();
	const wow = useWowDoll();
	const [penDown, setPenDown] = useState(false);
	const zhenyaSrc = penDown
		? asset("/imgs/zhenya/moving.webp")
		: (wow.src ?? zhenyaBlink);

	// Daphne: idle blinking, or holding out her palette
	const daphneBlink = useBlinkingDoll(DAPHNE);
	const [daphnePaint, setDaphnePaint] = useState<string | null>(null);
	// paint-out / paint-away are the same files as on Page 5, and a browser
	// won't replay an animated image it has already shown - so they're loaded
	// once as blobs and get a fresh object URL each time they play
	const paintBlobs = useRef<{ out?: Blob; away?: Blob }>({});
	const paintUrl = useRef<string | null>(null);
	useEffect(() => {
		fetch(PAINT_OUT)
			.then((res) => res.blob())
			.then((b) => (paintBlobs.current.out = b));
		fetch(PAINT_AWAY)
			.then((res) => res.blob())
			.then((b) => (paintBlobs.current.away = b));
		new Image().src = HOLDING_PALETTE;
		return () => {
			if (paintUrl.current) URL.revokeObjectURL(paintUrl.current);
		};
	}, []);
	const playPaint = (which: "out" | "away") => {
		const blob = paintBlobs.current[which];
		if (paintUrl.current) URL.revokeObjectURL(paintUrl.current);
		paintUrl.current = blob ? URL.createObjectURL(blob) : null;
		setDaphnePaint(
			paintUrl.current ?? (which === "out" ? PAINT_OUT : PAINT_AWAY),
		);
	};
	// …or giggling, once Zhenya says she did have a good time
	const hehe = useHeheDoll();
	const daphneSrc = daphnePaint ?? hehe.src ?? daphneBlink;

	// --- Drawing ---
	// The canvas inside the empty frame. Pointer events draw on it (mouse,
	// finger or stylus); `drew` turns on Done once there's something there,
	// and `drawingUrl` is the finished picture, for the gallery
	const canvasRef = useRef<HTMLCanvasElement>(null);
	// The stroke being drawn (see lib/stroke)
	const pen = useRef<Pen | null>(null);
	const [drew, setDrew] = useState(false);
	const [drawingUrl, setDrawingUrl] = useState<string | null>(null);
	const [color, setColor] = useState(COLORS[3].value);
	// "Bigger" grows the frame to 50svh (and "Smaller" shrinks it back)
	const [big, setBig] = useState(false);
	// Phones held upright get their own layout: smaller dolls at the top, the
	// frame below them, and the buttons in a row above the colors
	const portrait = usePortrait();
	const frameVh = portrait
		? big
			? PORTRAIT_BIG_FRAME_VH
			: PORTRAIT_FRAME_VH
		: big
			? BIG_FRAME_VH
			: FRAME_VH;

	// Once the frame has grown or shrunk, give the canvas pixels for its new
	// size and copy the drawing over, so it stays sharp
	const resizeCanvas = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const { width, height } = canvas.getBoundingClientRect();
		const w = Math.round(width * devicePixelRatio);
		const h = Math.round(height * devicePixelRatio);
		if (w === canvas.width && h === canvas.height) return;
		const copy = document.createElement("canvas");
		copy.width = canvas.width;
		copy.height = canvas.height;
		copy.getContext("2d")!.drawImage(canvas, 0, 0);
		canvas.width = w;
		canvas.height = h;
		canvas.getContext("2d")!.drawImage(copy, 0, 0, w, h);
	};

	// Match the canvas's pixels to its size on screen once it's ready to use,
	// so lines are sharp
	useEffect(() => {
		if (!canDraw) return;
		const canvas = canvasRef.current;
		if (!canvas) return;
		const { width, height } = canvas.getBoundingClientRect();
		canvas.width = Math.round(width * devicePixelRatio);
		canvas.height = Math.round(height * devicePixelRatio);
	}, [canDraw]);

	const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (stage !== 1) return;
		// Keep drawing even if the pointer slips outside the frame
		try {
			e.currentTarget.setPointerCapture(e.pointerId);
		} catch {}
		const [point] = pointsOn(e);
		pen.current = startStroke(e.currentTarget, point, color);
		setPenDown(true);
		setDrew(true);
	};
	const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
		if (pen.current)
			pen.current = penMove(e.currentTarget, pen.current, pointsOn(e), color);
	};
	const onPointerUp = () => {
		if (pen.current && canvasRef.current)
			penUp(canvasRef.current, pen.current, color);
		pen.current = null;
		setPenDown(false);
	};

	const clear = () => {
		const canvas = canvasRef.current;
		canvas?.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
		setDrew(false);
	};

	// Once the curtains have opened: both dolls drop in, then the label, then
	// "Let's draw!"
	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[600, 2],
			[1400, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	useEffect(() => () => timers.current.forEach(clearTimeout), []);
	const later = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));

	const letsDraw = () => {
		setStage(1);
		later(FRAME_MS, () => setFrameUp(true));
		later(TOOLS_MS, () => {
			if (tools.length) setToolsUp(true);
			else {
				// Daphne takes her palette out and lends it instead
				playPaint("out");
				later(PAINT_MS, () => setDaphnePaint(HOLDING_PALETTE));
			}
		});
		later(CAN_DRAW_MS, () => setCanDraw(true));
	};

	// Done: keep the picture, put the tools away, and Zhenya has a think
	const done = () => {
		const url = canvasRef.current?.toDataURL("image/png") ?? null;
		setDrawingUrl(url);
		// Your drawing goes into the inventory - in its frame, like it hangs
		// on the stage - and a bigger frame goes back to its normal size
		if (url)
			framed(url).then((image) => {
				keepDrawing({
					name: "Your drawing",
					image,
					description:
						"The first thing Zhenya drew, in the frame on the stage. Every artist starts somewhere.",
				});
				// …and joins everyone's drawings on the last page
				saveDrawing(image);
			});
		setBig(false);
		setStage(2);
		setPenDown(false);
		setToolsUp(false);
		if (daphnePaint) {
			playPaint("away");
			later(PAINT_MS, () => setDaphnePaint(null));
		}
		later(900, () => setVerdict(true));
	};

	// Skip: for anyone who'd rather not (or can't easily) draw - a simple
	// doodle is drawn in the frame instead, and it carries on as if Done
	const skip = () => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		const [blue, yellow, orange, brown] = COLORS.map((c) => c.value);
		drawRandomDoodle(canvas, { blue, yellow, orange, brown });
		done();
	};

	// "Hmm... it's not very good" → Daphne: "But did you have a good time?"
	const sayVerdict = () => {
		setStage(3);
		later(1500, () => setGoodTime(true));
	};

	// "Yes, I did!" → wow (and Daphne giggles), and the gallery hangs in
	// with your drawing in it
	const sayYes = () => {
		setStage(4);
		wow.playWow();
		hehe.playHehe();
		later(600, () => setGalleryUp(true));
		later(2600, () => wow.playWowReverse());
		later(3400, () => setShowContinue(true));
	};

	// The gallery: the paintings from Page 2, Daphne's drawing if you bought
	// it, and your drawing last
	/* const gallery = [
		...FRAMES.map((frame) => ({
			key: frame.slug,
			node: (
				<img
					src={frame.src}
					className="h-[13svh] w-auto max-w-none"
					alt={`${frame.label} by ${frame.artist}`}
				/>
			),
		})),
		...(ownsDaphneDrawing
			? [
					{
						key: "daphne",
						node: (
							<img
								src={ITEMS["daphne-drawing"].image}
								className="h-[13svh] w-auto max-w-none"
								alt="Daphne's drawing of a smiley face"
							/>
						),
					},
				]
			: []),
		{
			key: "yours",
			node: <YourArt drawingUrl={drawingUrl} className="h-[13svh]" />,
		},
	]; */

	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="sr-only">Every artist starts somewhere</h1>

			{/* Zhenya - on the left, facing Daphne (as Page 5 left them) */}
			<Zhenya
				src={zhenyaSrc}
				className="h-svh absolute top-[-28svh] left-[5%] portrait:h-[48svh] portrait:top-[-12svh] portrait:left-[20%] max-w-none translate-x-[-50%] test-shadow-darker z-5"
				style={hang(step >= 1, step >= 1, "top", {
					ms: 900,
					easing: DOLL_DROP,
				})}
				alt="Zhenya, a marionette doll on strings"
			/>

			{/* Daphne - on the right, mirrored to face Zhenya */}
			<img
				src={daphneSrc}
				className="h-svh absolute top-[-28svh] left-[91%] portrait:h-[48svh] portrait:top-[-12svh] portrait:left-[80%] max-w-none translate-x-[-50%] scale-x-[-1] test-shadow-darker z-4"
				style={hang(step >= 1, step >= 1, "top", {
					ms: 900,
					easing: DOLL_DROP,
					delay: 150,
				})}
				alt="Daphne, another marionette doll on strings"
			/>

			{/* "Zhenya wants to try making art too" + "Let's draw!" */}
			<p
				className={`absolute top-[4svh] left-[52%] portrait:top-[30svh] portrait:left-[50%] translate-x-[-50%] w-max portrait:max-w-[80vw] z-6 ${LABEL}`}
				style={hang(step >= 2, step >= 2 && stage < 1, "top")}
			>
				<Strings />
				Zhenya wants to try making art too
			</p>
			<button
				onClick={letsDraw}
				disabled={step < 3 || stage >= 1}
				tabIndex={step >= 3 && stage < 1 ? undefined : -1}
				className={`absolute top-[20svh] left-[34%] portrait:top-[38svh] portrait:left-[50%] translate-x-[-50%] w-max z-5 portrait:z-6 ${BUTTON}`}
				style={hang(step >= 3, step >= 3 && stage < 1, "top")}
			>
				<Strings />
				Let&apos;s draw!
			</button>

			{/* The empty frame - rises in the middle on a popsicle stick. While
			    you're drawing, the canvas inside it is live; afterwards it holds
			    your drawing. Sinks when the gallery comes */}
			<div
				className="absolute bottom-[6svh] left-[41%] portrait:left-[50%] translate-x-[-50%] z-5 test-shadow-darker"
				style={(() => {
					const style = hang(frameUp, frameUp && stage < 4, "bottom", {
						ms: 900,
						easing: DOLL_DROP,
					});
					return {
						...style,
						height: `${frameVh}svh`,
						transition: `${style.transition}, height ${GROW_MS}ms ${DOLL_DROP}`,
					};
				})()}
				onTransitionEnd={(e) => {
					if (e.target === e.currentTarget && e.propertyName === "height")
						resizeCanvas();
				}}
			>
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2vw] portrait:w-[2.5svh] h-[35svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0"
					alt="Wooden popsicle stick holding up the frame"
				/>
				<canvas
					ref={canvasRef}
					onPointerDown={onPointerDown}
					onPointerMove={onPointerMove}
					onPointerUp={onPointerUp}
					onPointerCancel={onPointerUp}
					aria-label="Drawing area - draw with your mouse, finger or pen"
					className={`${CANVAS_BOX} z-1 bg-white touch-none ${stage === 1 && canDraw ? "cursor-crosshair" : ""}`}
				/>
				<img
					src={asset("/imgs/art/empty_square_frame.webp")}
					className="h-full w-auto max-w-none relative z-2 pointer-events-none"
					alt="An empty picture frame"
				/>
			</div>

			{/* The colors - one connected palette hanging just above the frame
			    while you draw: a single white strip on two strings, the colors
			    side by side in it. The picked one has a ring round it */}
			<div
				className={`absolute left-[41%] portrait:left-[50%] translate-x-[-50%] flex gap-[0.8svh] p-[0.8svh] z-6 bg-white border-[0.3svh] border-black border-dashed drop-shadow-md drop-shadow-black/40 test-shadow-darker`}
				style={(() => {
					const style = hang(canDraw, canDraw && stage === 1, "top");
					return {
						...style,
						bottom: `calc(6svh + ${frameVh}svh + 2svh)`,
						transition: `${style.transition}, bottom ${GROW_MS}ms ${DOLL_DROP}`,
					};
				})()}
			>
				<Strings />
				{COLORS.map((c) => (
					<button
						key={c.value}
						onClick={() => setColor(c.value)}
						disabled={!canDraw || stage !== 1}
						tabIndex={canDraw && stage === 1 ? undefined : -1}
						aria-label={c.name}
						aria-pressed={color === c.value}
						title={c.name}
						className={`block w-[6svh] h-[3.5svh] cursor-pointer disabled:cursor-default ${color === c.value ? "outline-[0.3svh] outline-solid outline-black outline-offset-[0.15svh]" : ""}`}
						style={{ background: c.value }}
					/>
				))}
			</div>

			{/* Instructions - while you draw */}
			<p
				className={`absolute top-[8svh] left-[49%] portrait:top-[20svh] portrait:left-[50%] translate-x-[-50%] w-[30vw] portrait:w-[84vw] z-9 ${LABEL}`}
				// Lifts away while the frame is bigger, to make room for it
				style={hang(canDraw, canDraw && stage === 1 && !big, "top")}
			>
				<Strings />
				{tools.length
					? `Daphne lends Zhenya her palette - draw something in the frame!`
					: "Daphne lends Zhenya her palette - draw something in the frame!"}
			</p>

			{/* Bigger / Clear / Done / Skip - next to the frame while you draw,
			    hanging as one: the strings are tied to the bottom one (Skip) and
			    run up behind the others. Done only works once there's something
			    drawn; Skip draws a doodle for you and carries on. (On portrait screens it's a row above the colors, the
			    strings at its two ends) */}
			<div
				className="absolute translate-x-[-50%] flex flex-col portrait:flex-row items-stretch portrait:items-center gap-[2svh] portrait:gap-[3vw] z-7"
				// Moves over to stay clear of the frame while it's bigger. On
				// portrait screens it moves up with the colors instead
				style={(() => {
					const style = hang(canDraw, canDraw && stage === 1, "top", {
						delay: 300,
					});
					return {
						...style,
						left: portrait
							? "50%"
							: big
								? "max(65%, calc(41% + 33svh))"
								: "65%",
						bottom: portrait ? `calc(6svh + ${frameVh}svh + 10svh)` : "22svh",
						transition: `${style.transition}, left ${GROW_MS}ms ${DOLL_DROP}, bottom ${GROW_MS}ms ${DOLL_DROP}`,
					};
				})()}
			>
				<span className="w-[0.1vw] bg-black/60 h-[200svh] bottom-[2svh] left-[25%] portrait:bottom-[50%] portrait:left-[8%] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[200svh] bottom-[2svh] right-[25%] portrait:bottom-[50%] portrait:right-[8%] absolute"></span>
				<button
					onClick={() => setBig((b) => !b)}
					disabled={stage !== 1}
					tabIndex={canDraw && stage === 1 ? undefined : -1}
					className={`relative w-full portrait:w-max ${BUTTON}`}
				>
					{big ? "Smaller" : "Bigger"}
				</button>
				<button
					onClick={clear}
					disabled={stage !== 1 || !drew}
					tabIndex={canDraw && stage === 1 ? undefined : -1}
					className={`relative w-full portrait:w-max ${BUTTON}`}
				>
					Clear
				</button>
				<button
					onClick={done}
					disabled={stage !== 1 || !drew}
					tabIndex={canDraw && stage === 1 ? undefined : -1}
					className={`relative w-full portrait:w-max ${BUTTON} disabled:opacity-60`}
				>
					Done
				</button>
				<button
					onClick={skip}
					disabled={stage !== 1}
					tabIndex={canDraw && stage === 1 ? undefined : -1}
					title="Skip drawing - a doodle goes in the frame instead"
					className={`relative w-full portrait:w-max ${BUTTON}`}
				>
					Skip
				</button>
			</div>

			{/* Zhenya: "Hmm... it's not very good" */}
			<button
				onClick={sayVerdict}
				disabled={!verdict || stage >= 3}
				tabIndex={verdict && stage < 3 ? undefined : -1}
				className={`absolute top-[2svh] left-[38%] portrait:top-[20svh] portrait:left-[34%] translate-x-[-50%] w-[18vw] portrait:w-[56vw] z-9 ${BUTTON}`}
				style={hang(verdict, verdict && stage < 4, "top", {
					exitDelay: 0 * TALK_EXIT_STAGGER_MS,
				})}
			>
				<Strings />
				Hmm... it&apos;s not very good
			</button>

			{/* Daphne: "But did you have a good time?" */}
			<p
				className={`absolute top-[16svh] left-[60%] portrait:top-[30svh] portrait:left-[62%] translate-x-[-50%] w-max portrait:max-w-[70vw] z-8 ${LABEL}`}
				style={hang(stage >= 3, stage === 3, "top", {
					delay: 400,
					exitDelay: 1 * TALK_EXIT_STAGGER_MS,
				})}
			>
				<Strings />
				But did you have a good time?
			</p>

			{/* Zhenya: "Yes, I did!" */}
			<button
				onClick={sayYes}
				disabled={!goodTime || stage >= 4}
				tabIndex={goodTime && stage < 4 ? undefined : -1}
				className={`absolute top-[22svh] left-[33%] portrait:top-[40svh] portrait:left-[34%] translate-x-[-50%] w-max z-7 ${BUTTON}`}
				style={hang(goodTime, goodTime && stage < 4, "top", {
					exitDelay: 2 * TALK_EXIT_STAGGER_MS,
				})}
			>
				<Strings />
				Yes, I did!
			</button>

			{/* The gallery - every artwork from the story hangs in one at a time
			    on long strings and sways gently (.sway), with your drawing last.
			    Hung high, in front of the curtain valance (z-14 is above the
			    curtains' z-10), so it's clear of the dolls' heads */}
			{/* <ul className="absolute top-[-10svh] left-[46%] translate-x-[-50%] flex gap-[1.5vw] items-start z-[14]">
				{gallery.map(({ key, node }, i) => (
					<li
						key={key}
						className="relative test-shadow-darker"
						style={hang(galleryUp, galleryUp, "top", {
							ms: 900,
							delay: i * GALLERY_STAGGER_MS,
						})}
					>
						<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-[50%] absolute"></span>
						<div
							className="sway"
							// Each one swings a little out of step with its neighbours
							style={{ animationDelay: `${-i * 0.7}s` }}
						>
							{node}
						</div>
					</li>
				))}
			</ul> */}

			{/* Continue - rises once the gallery is up. Same spot and look as on
			    Pages 4 and 5, in front of everything on the page */}
			<PopsicleButton
				onClick={nextPage}
				href="/art-competition"
				style={{
					...hang(showContinue, showContinue, "bottom", {
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
		</div>
	);
}
