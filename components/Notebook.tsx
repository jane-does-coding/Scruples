import { useEffect, useRef, useState } from "react";
import { asset } from "@/lib/asset";

// The ruled notebook from the souvenir shop, opened from the inventory with
// "Use": it rises onto the stage on two popsicle sticks (and sinks back down
// when closed), almost the whole screen, opened flat in the middle - a blank page on
// the left and another on the right, each with its page number. It has 10
// pages (5 spreads); the arrows turn to the previous / next spread. Pages are
// kept in this browser (localStorage) when saved, so they're still there next
// time the notebook is opened

const STORAGE_KEY = "scruples-notebook";
const PAGE_COUNT = 10;
const SPREADS = PAGE_COUNT / 2;

// Same colors as the drawing page, brown first
const COLORS = [
	{ name: "Brown", value: "#7a4a24" },
	{ name: "Blue", value: "#2f5fd0" },
	{ name: "Yellow", value: "#f2c522" },
	{ name: "Orange", value: "#f07f1f" },
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
	const lastPoint = useRef<{ x: number; y: number } | null>(null);
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

	// Size both canvases to their spots on screen, then draw the open pages
	useEffect(() => {
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

	const pointOn = (e: React.PointerEvent<HTMLCanvasElement>) => {
		const rect = e.currentTarget.getBoundingClientRect();
		return {
			x: ((e.clientX - rect.left) / rect.width) * e.currentTarget.width,
			y: ((e.clientY - rect.top) / rect.height) * e.currentTarget.height,
		};
	};
	const drawTo = (canvas: HTMLCanvasElement, point: { x: number; y: number }) => {
		const from = lastPoint.current;
		if (!from) return;
		const ctx = canvas.getContext("2d")!;
		ctx.strokeStyle = color;
		ctx.lineWidth = 3.5 * devicePixelRatio;
		ctx.lineCap = "round";
		ctx.lineJoin = "round";
		ctx.beginPath();
		ctx.moveTo(from.x, from.y);
		ctx.lineTo(point.x, point.y);
		ctx.stroke();
		lastPoint.current = point;
	};

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

	return (
		<div
			role="dialog"
			aria-modal
			aria-label="Notebook"
			className="fixed inset-0 z-[25] bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-500"
			style={{ opacity: shown ? 1 : 0 }}
		>
			<div
				className="relative w-[92vw] h-[90vh] flex flex-col gap-[1.5vh]"
				style={{
					transition: `transform ${RISE_MS}ms ${RISE}`,
					transform: shown ? "translateY(0)" : "translateY(110vh)",
				}}
			>
				{/* The two popsicle sticks holding it up, going down off the
				    bottom of the screen */}
				{["left-[25%]", "left-[75%]"].map((left) => (
					<img
						key={left}
						src={asset("/imgs/popsicle-stick.webp")}
						className={`absolute ${left} -translate-x-[50%] top-[85%] w-[2.5vw] h-[40vh] max-w-none`}
						alt=""
						aria-hidden
					/>
				))}
				{/* Top bar - colors, page turning, Clear / Save / Close */}
				<div className="flex items-center gap-[1vw] px-[1.5vw] py-[1vh] bg-white border-[0.3vh] border-black drop-shadow-lg drop-shadow-black/60">
					{COLORS.map((c) => (
						<button
							key={c.value}
							onClick={() => setColor(c.value)}
							aria-label={c.name}
							aria-pressed={color === c.value}
							title={c.name}
							className={`${BUTTON} !p-[0.8vh] ${color === c.value ? "!border-solid" : ""}`}
						>
							<span
								className="block w-[6vh] h-[2.5vh]"
								style={{ background: c.value }}
							/>
						</button>
					))}
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
					<button onClick={save} className={BUTTON}>
						{saved ? "Saved!" : "Save"}
					</button>
					<button onClick={close} className={BUTTON}>
						Close
					</button>
				</div>

				{/* The open notebook - two blank pages side by side, split by a
				    line in the middle */}
				<div className="relative flex-1 flex bg-white border-[0.3vh] border-black drop-shadow-lg drop-shadow-black/60">
					{[0, 1].map((side) => {
						const number = spread * 2 + side + 1;
						return (
							<div key={side} className="relative flex-1">
								<canvas
									ref={(el) => {
										canvases.current[side] = el;
									}}
									onPointerDown={(e) => {
										try {
											e.currentTarget.setPointerCapture(e.pointerId);
										} catch {}
										lastPoint.current = pointOn(e);
										drawTo(e.currentTarget, {
											...lastPoint.current,
											x: lastPoint.current.x + 0.1,
										});
										setDirty(true);
									}}
									onPointerMove={(e) => {
										if (lastPoint.current) drawTo(e.currentTarget, pointOn(e));
									}}
									onPointerUp={() => (lastPoint.current = null)}
									onPointerCancel={() => (lastPoint.current = null)}
									aria-label={`Notebook page ${number} - draw with your mouse, finger or pen`}
									className="absolute inset-0 w-full h-full touch-none cursor-crosshair"
								/>
								{/* Page number, in the outer bottom corner */}
								<span
									className={`absolute bottom-[1.5vh] text-[3vh] scribbler pointer-events-none ${side === 0 ? "left-[2vw]" : "right-[2vw]"}`}
								>
									{number}
								</span>
							</div>
						);
					})}
					{/* The middle, where it folds - a thin dark line */}
					<div
						aria-hidden
						className="absolute inset-y-0 left-[50%] -translate-x-[50%] w-[0.15vh] bg-black/80 pointer-events-none"
					/>
				</div>
			</div>
		</div>
	);
}
