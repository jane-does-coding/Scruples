import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";
import { penDown, penMove, penUp, pointsOn, type Pen } from "@/lib/stroke";

// The ruled notebook from the souvenir shop, opened from the inventory with
// "Use": it rises onto the stage on two popsicle sticks (and sinks back down
// when closed), almost the whole screen, opened flat in the middle - a page on
// the left and another on the right, each with its page number. It has 10
// pages (5 spreads); the arrows turn to the previous / next spread. Pages are
// kept in this browser (localStorage) when saved, so they're still there next
// time the notebook is opened

const STORAGE_KEY = "scruples-notebook";
const PAGE_COUNT = 10;
const SPREADS = PAGE_COUNT / 2;

// The drawing page's colors, brown first, plus red and green
const COLORS = [
	{ name: "Black", value: "#000000" },
	{ name: "Brown", value: "#7a4a24" },
	{ name: "Blue", value: "#2f5fd0" },
	{ name: "Yellow", value: "#f2c522" },
	{ name: "Orange", value: "#f07f1f" },
	{ name: "Red", value: "#d63a2f" },
	{ name: "Green", value: "#3f9a4a" },
];

// open-notebook.webp is 1568 × 1308; its two pages sit at these spots in
// it (the rest is the cover's edge, and a bit of empty space below)
const NOTEBOOK_ASPECT = 1568 / 1308;
// At most this wide, so there's room for the colors on its left
const NOTEBOOK_MAX_VW = 78;
const PAGE_BOXES = [
	{ left: "5.6%", top: "3.4%", width: "44.4%", height: "83.6%" },
	{ left: "51.6%", top: "3.4%", width: "44.2%", height: "83.6%" },
];

const RISE = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const RISE_MS = 900;

const BUTTON =
	"text-[2.5vh] scribbler bg-white border-[0.3vh] border-black border-dashed px-[1vw] py-[0.3vh] cursor-pointer disabled:cursor-default disabled:opacity-50";

type Pages = (string | null)[];

// The saved pages (each a PNG data URL, or null for a blank page), always 10
const blank = (): Pages => Array.from({ length: PAGE_COUNT }, () => null);
const loadPages = (): Pages => {
	try {
		const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
		if (Array.isArray(saved))
			return blank().map((_, i) =>
				typeof saved[i] === "string" ? saved[i] : null,
			);
	} catch {}
	return blank();
};

export default function Notebook({ onClose }: { onClose: () => void }) {
	// The two pages that are open: left, right
	const canvases = useRef<(HTMLCanvasElement | null)[]>([null, null]);
	// The stroke being drawn (see lib/stroke)
	const pen = useRef<Pen | null>(null);
	const [pages, setPages] = useState<Pages>(blank);
	// Which spread is open: 0 = pages 1-2, 1 = pages 3-4, …
	const [spread, setSpread] = useState(0);
	const [color, setColor] = useState(COLORS[0].value);
	// Unsaved changes on the open pages, and a short "Saved!" after saving
	const [dirty, setDirty] = useState(false);
	const [saved, setSaved] = useState(false);
	// Up on the stage (it rises in once it's open, and sinks before closing)
	const [shown, setShown] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setShown(true), 20);
		return () => clearTimeout(timer);
	}, []);

	// Load the saved pages once it opens (a timer keeps the state change out
	// of the effect itself)
	useEffect(() => {
		const timer = setTimeout(() => setPages(loadPages()), 0);
		return () => clearTimeout(timer);
	}, []);

	// Size both canvases to their spots on screen, then draw the open pages.
	// Not after a plain Save - the canvases already show what was saved, and
	// redrawing it would only soften the lines
	const justSaved = useRef(false);
	useEffect(() => {
		if (justSaved.current) {
			justSaved.current = false;
			return;
		}
		canvases.current.forEach((canvas, side) => {
			if (!canvas) return;
			const { width, height } = canvas.getBoundingClientRect();
			canvas.width = Math.round(width * devicePixelRatio);
			canvas.height = Math.round(height * devicePixelRatio);
			const src = pages[spread * 2 + side];
			if (!src) return;
			const img = new Image();
			img.onload = () =>
				canvas
					.getContext("2d")!
					.drawImage(img, 0, 0, canvas.width, canvas.height);
			img.src = src;
		});
	}, [spread, pages]);

	// The pages with the open two as they are now
	const withCurrent = () => {
		const next = [...pages];
		canvases.current.forEach((canvas, side) => {
			if (canvas) next[spread * 2 + side] = canvas.toDataURL("image/png");
		});
		return next;
	};
	const save = () => {
		const next = withCurrent();
		setPages(next);
		setDirty(false);
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			setSaved(true);
			setTimeout(() => setSaved(false), 1200);
		} catch {}
	};
	// Turning the page or closing keeps what you drew
	const turnTo = (n: number) => {
		if (dirty) save();
		setSpread(n);
	};
	const close = () => {
		if (dirty) save();
		setShown(false);
		setTimeout(onClose, RISE_MS);
	};
	// Escape closes it
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	});

	// Clears both open pages
	const clear = () => {
		canvases.current.forEach((canvas) =>
			canvas?.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height),
		);
		setDirty(true);
	};

	const Strings = () => (
		<>
			<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] left-0 absolute"></span>
			<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] right-0 absolute"></span>
		</>
	);

	return (
		<div
			role="dialog"
			aria-modal
			aria-label="Notebook"
			className="fixed inset-0 z-[25] bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-500"
			style={{ opacity: shown ? 1 : 0 }}
		>
			{/* The colors - a column on the notebook's left, all on the same
			    two strings: they're tied to the bottom one and run up behind
			    the rest. Lowered in from the top as the notebook rises. No tug
			    when one is clicked (data-no-tug) */}
			<div
				data-no-tug
				className="absolute top-[18vh] flex flex-col gap-[1.5vh] z-1"
				style={{
					// Just left of the notebook, whatever size it is
					right: `calc(50% + min(${NOTEBOOK_MAX_VW / 2}vw, calc(39vh * ${NOTEBOOK_ASPECT})) + 1.5vw)`,
					transition: `transform ${RISE_MS}ms ${RISE}`,
					transform: shown ? "translateY(0)" : "translateY(-110vh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[200vh] bottom-[3vh] left-[25%] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[200vh] bottom-[3vh] right-[25%] absolute"></span>
				{COLORS.map((c) => (
					<button
						key={c.value}
						onClick={() => setColor(c.value)}
						aria-label={c.name}
						aria-pressed={color === c.value}
						title={c.name}
						className={`relative ${BUTTON} drop-shadow-md drop-shadow-black/40 w-[8vh] h-[5vh] transition-all ease-in-out duration-150 ${color === c.value ? "!border-solid  !p-[0.3vh]" : " !p-[0.7vh]"}`}
					>
						<span
							className="block w-full h-full"
							style={{ background: c.value }}
						/>
					</button>
				))}
			</div>

			<div
				className="relative w-[92vw] h-[90vh] flex flex-col items-center gap-[1.5vh]"
				style={{
					transition: `transform ${RISE_MS}ms ${RISE}`,
					transform: shown ? "translateY(0)" : "translateY(110vh)",
				}}
			>
				{/* Top bar - page turning, Clear / Save / Close. It hangs on
				    strings, so it's lowered in from the top while the notebook
				    rises from the bottom: it sits in the rising box, so it moves
				    twice as far the other way, with the same timing */}
				<div
					className="relative self-stretch flex items-center gap-[1vw] px-[1.5vw] py-[1vh] bg-white border-[0.3vh] border-black drop-shadow-lg drop-shadow-black/60 w-[50vw] mx-auto"
					style={{
						transition: `transform ${RISE_MS}ms ${RISE}`,
						transform: shown ? "translateY(0)" : "translateY(-220vh)",
					}}
				>
					<Strings />
					<div className="flex-1" />
					<button
						onClick={() => turnTo(spread - 1)}
						disabled={spread === 0}
						aria-label="Previous pages"
						className={BUTTON}
					>
						{"<-"}
					</button>
					<span className="text-[2.5vh] scribbler w-max">
						Pages {spread * 2 + 1}-{spread * 2 + 2} of {PAGE_COUNT}
					</span>
					<button
						onClick={() => turnTo(spread + 1)}
						disabled={spread === SPREADS - 1}
						aria-label="Next pages"
						className={BUTTON}
					>
						{"->"}
					</button>
					<div className="flex-1" />
					<button onClick={clear} className={BUTTON}>
						Clear
					</button>
					<button
						onClick={() => {
							justSaved.current = true;
							save();
						}}
						className={BUTTON}
					>
						{saved ? "Saved!" : "Save"}
					</button>
					<button onClick={close} className={BUTTON}>
						Close
					</button>
				</div>

				{/* The open notebook (open-notebook.webp) - each of its two pages
				    has a canvas over it to draw on, and its page number in the
				    outer bottom corner. The bookmark ribbon hangs 2vw right of the
				    middle */}
				<div
					className="relative"
					style={{
						width: `min(${NOTEBOOK_MAX_VW}vw, calc(85vh * ${NOTEBOOK_ASPECT}))`,
						aspectRatio: NOTEBOOK_ASPECT,
					}}
				>
					{/* The two popsicle sticks holding it up, going down off the
					    bottom of the screen */}
					{["left-[25%]", "left-[75%]"].map((left) => (
						<img
							key={left}
							src={asset("/imgs/popsicle-stick.webp")}
							className={`absolute ${left} -translate-x-[50%] top-[80%] w-[2.5vw] h-[40vh] max-w-none`}
							alt=""
							aria-hidden
						/>
					))}
					<img
						src={asset("/imgs/open-notebook.webp")}
						className="absolute inset-0 w-full h-full test-shadow-darker"
						alt="An open notebook"
					/>
					{PAGE_BOXES.map((box, side) => {
						const number = spread * 2 + side + 1;
						return (
							<div key={side} className="absolute" style={box}>
								<canvas
									ref={(el) => {
										canvases.current[side] = el;
									}}
									onPointerDown={(e) => {
										try {
											e.currentTarget.setPointerCapture(e.pointerId);
										} catch {}
										const [point] = pointsOn(e);
										pen.current = penDown(e.currentTarget, point, color);
										setDirty(true);
									}}
									onPointerMove={(e) => {
										if (pen.current)
											pen.current = penMove(
												e.currentTarget,
												pen.current,
												pointsOn(e),
												color,
											);
									}}
									onPointerUp={(e) => {
										if (pen.current) penUp(e.currentTarget, pen.current, color);
										pen.current = null;
									}}
									onPointerCancel={() => (pen.current = null)}
									aria-label={`Notebook page ${number} - draw with your mouse, finger or pen`}
									className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
								/>
								{/* Page number, in the outer bottom corner */}
								<span
									className={`absolute bottom-[1.5vh] text-[3vh] scribbler pointer-events-none ${side === 0 ? "left-[1.5vw]" : "right-[1.5vw]"}`}
								>
									{number}
								</span>
							</div>
						);
					})}
					<img
						src={asset("/imgs/bookmark.webp")}
						className="absolute top-0 h-full w-auto max-w-none left-[calc(50%+2vw)] -translate-x-[50%] pointer-events-none"
						alt=""
						aria-hidden
					/>
				</div>
			</div>
		</div>
	);
}
