import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import usePortrait from "@/components/usePortrait";
import Zhenya from "@/components/Zhenya";
import { asset } from "@/lib/asset";
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

const CURTAIN_FRAMES = Array.from({ length: 8 }, (_, i) =>
	asset(`/imgs/stage/closing/${String(i).padStart(2, "0")}.webp`),
);
const LIFT_MS = 700;
const FRAME_MS = 70;
const CLOSE_MS = (CURTAIN_FRAMES.length - 1) * FRAME_MS;
const ZOOM_FROM_FRAME = 3;
const PUSH_AT_MS = LIFT_MS + ZOOM_FROM_FRAME * FRAME_MS;
const INSIDE_AT_MS = LIFT_MS + CLOSE_MS + 100;
const PUSH_MS = 3000;
const PUSH_EASE = "cubic-bezier(0.5, 0, 0.85, 0.35)";
const PUSH_SCALE = 16;
const GAP_ORIGIN = "50% 74%";
const TURN_AT_MS = PUSH_AT_MS + PUSH_MS + 250;
const TURN_MS = 2800;
const TURN_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const ARRIVED_MS = TURN_AT_MS + TURN_MS + 300;
const ROOM_DARK = asset("/sample-room-lights-off3.png");
const ROOM_GLOW = {
	lamp: asset("/imgs/stage/room-lamp-on.webp"),
	stars: asset("/imgs/stage/room-stars-on.webp"),
};

const LABEL =
	"relative text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-[1vw] absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-[1vw] absolute"></span>
	</>
);

const hang = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform 800ms ${LABEL_DROP} ${shown ? delay : 0}ms`,
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-120svh" : "110svh"})`,
});

const ROOM_W = 1000;
const ROOM_H = (1000 * 1710) / 2711;
const WALL_TOP = (x: number) => 18 + 0.2237 * x;
const WALL_BOTTOM = (x: number) => 467 + 0.422 * (590 - x);
const onWall = (x: number, t: number) =>
	[x, WALL_TOP(x) + t * (WALL_BOTTOM(x) - WALL_TOP(x))] as const;

const quadMatrix = (
	w: number,
	h: number,
	[[x0, y0], [x1, y1], [x2, y2], [x3, y3]]: (readonly [number, number])[],
) => {
	const dx1 = x1 - x2;
	const dx2 = x3 - x2;
	const dx3 = x0 - x1 + x2 - x3;
	const dy1 = y1 - y2;
	const dy2 = y3 - y2;
	const dy3 = y0 - y1 + y2 - y3;
	const den = dx1 * dy2 - dx2 * dy1;
	const g = (dx3 * dy2 - dx2 * dy3) / den;
	const h2 = (dx1 * dy3 - dx3 * dy1) / den;
	const a = x1 - x0 + g * x1;
	const b = x3 - x0 + h2 * x3;
	const d = y1 - y0 + g * y1;
	const e = y3 - y0 + h2 * y3;
	return `matrix3d(${[
		a / w,
		d / w,
		0,
		g / w,
		b / h,
		e / h,
		0,
		h2 / h,
		0,
		0,
		1,
		0,
		x0,
		y0,
		0,
		1,
	].join(",")})`;
};

const FOCAL = 367;
const CENTER_X = 500;
const CORNER_X = 590;
const VP_X = 1081;
const WALL_REAL_H = (WALL_BOTTOM(CORNER_X) - WALL_TOP(CORNER_X)) / FOCAL;
const DIR_Z = 1 / Math.hypot(1, (VP_X - CENTER_X) / FOCAL);
const DIR_X = ((VP_X - CENTER_X) / FOCAL) * DIR_Z;
const depth = (x: number) => {
	const q = (x - CENTER_X) / FOCAL;
	return (q - (CORNER_X - CENTER_X) / FOCAL) / (DIR_X - q * DIR_Z);
};

const CELL_W = 300;
const CELL_H = Math.round((CELL_W * 762) / 705);
const CELL_GAP = 12;
const GRID_W = CELL_W * 3 + CELL_GAP * 2;
const GRID_H = 1170;
const xAtDepth = (d: number) =>
	CENTER_X +
	(FOCAL * ((CORNER_X - CENTER_X) / FOCAL + DIR_X * d)) / (1 + DIR_Z * d);
const GRID_SCALE = 0.85;
const placeGrid = (x1: number, x2: number, t1: number) => {
	const width = depth(x2) - depth(x1);
	const middle = (depth(x1) + depth(x2)) / 2;
	const span = ((GRID_H / GRID_W) * width) / WALL_REAL_H;
	const left = xAtDepth(middle - (width * GRID_SCALE) / 2);
	const right = xAtDepth(middle + (width * GRID_SCALE) / 2);
	const top = t1 + (span * (1 - GRID_SCALE)) / 2;
	const bottom = top + span * GRID_SCALE;
	return quadMatrix(GRID_W, GRID_H, [
		onWall(left, top),
		onWall(right, top),
		onWall(right, bottom),
		onWall(left, bottom),
	]);
};
const GRID_PLACE = {
	wide: placeGrid(311, 567, -0.003),
	tall: placeGrid(474, 590, 0.06),
};

const useRoomScale = () => {
	const [size, setSize] = useState({ w: 1, h: 1 });
	useEffect(() => {
		const measure = () =>
			setSize({ w: window.innerWidth, h: window.innerHeight });
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);
	const k = Math.max(size.w / ROOM_W, size.h / ROOM_H);
	return {
		k,
		left: (size.w - ROOM_W * k) / 2,
		top: (size.h - ROOM_H * k) / 2,
	};
};

const ART_SHADOW = "drop-shadow-[6px_8px_3px_rgba(0,0,0,0.35)]";

const PAINTINGS: { name: string; alt: string; rows?: number; cols?: number }[] =
	[
		{ name: "tall-scream", alt: "The Scream by Edvard Munch", rows: 2 },
		{ name: "daphne", alt: "Daphne's drawing of a smiley face on an easel" },
		{ name: "mine", alt: "" },
		{
			name: "wide-starry-night",
			alt: "The Starry Night by Vincent van Gogh",
			cols: 2,
		},
		{ name: "square-water-lilies", alt: "The Water Lily Pond by Claude Monet" },
		{
			name: "square-pearl",
			alt: "Girl with a Pearl Earring by Johannes Vermeer",
		},
		{ name: "square-mona-lisa", alt: "Mona Lisa by Leonardo da Vinci" },
	];

type LightId = "lamp" | "stars";
const LIGHTS: {
	id: LightId;
	on: string;
	off: string;
	box: { x: number; y: number; w: number; h: number };
	shape: string;
}[] = [
	{
		id: "lamp",
		on: "Turn the lamp on",
		off: "Turn the lamp off",
		box: { x: 632, y: 282, w: 84, h: 150 },
		shape:
			"M20 2 C27.4 -1.1 56.6 -1.1 64 2 C71.4 5.1 70.5 17.6 73 24 C75.5 30.4 80.9 43.4 82 48 C83.1 52.6 83.8 55.6 81 57 C78.2 58.4 64.7 54.5 62 58 C59.3 61.5 62.6 78.1 62 82 C61.4 85.9 59.3 86.0 58 86 C56.7 86.0 53.7 85.4 53 82 C52.3 78.6 53.3 63.8 53 62 C52.7 60.2 51.8 66.8 51 69 C50.2 71.2 47.6 72.5 47 78 C46.4 83.5 46.2 103.4 47 108 C47.8 112.6 52.0 108.9 53 111 C54.0 113.1 52.3 120.5 54 123 C55.7 125.5 63.3 126.2 65 129 C66.7 131.8 67.4 140.3 66 143 C64.6 145.7 60.3 147.3 55 148 C49.7 148.7 33.5 148.7 28 148 C22.5 147.3 17.5 145.7 16 143 C14.5 140.3 15.2 131.8 17 129 C18.8 126.2 27.2 125.5 29 123 C30.8 120.5 29.0 113.1 30 111 C31.0 108.9 35.2 112.6 36 108 C36.8 103.4 36.6 83.3 36 78 C35.4 72.7 33.0 72.1 32 70 C31.0 67.9 29.3 64.7 29 63 C28.7 61.3 33.5 58.8 30 58 C26.5 57.2 7.9 58.4 4 57 C0.1 55.6 1.0 52.6 2 48 C3.0 43.4 8.5 30.4 11 24 C13.5 17.6 12.6 5.1 20 2 Z",
	},
	{
		id: "stars",
		on: "Turn the star lights on",
		off: "Turn the star lights off",
		box: { x: 581, y: 4, w: 425, h: 186 },
		shape:
			"M4 139 C9.9 137.5 32.8 144.6 44 145 C55.2 145.4 73.5 144.4 84 142 C94.5 139.6 110.2 132.5 119 128 C127.8 123.5 140.3 115.6 147 110 C153.7 104.4 159.7 89.7 167 88 C174.3 86.3 188.9 95.6 199 98 C209.1 100.4 227.8 104.2 239 105 C250.2 105.8 267.8 105.5 279 104 C290.2 102.5 308.5 97.9 319 94 C329.5 90.1 344.9 82.0 354 76 C363.1 70.0 377.0 58.0 384 51 C391.0 44.0 399.4 32.9 404 26 C408.6 19.1 414.3 0.6 417 2 C419.7 3.4 423.4 27.6 423 36 C422.6 44.4 417.6 54.7 414 62 C410.4 69.3 402.6 81.6 397 88 C391.4 94.4 382.1 102.7 374 108 C365.9 113.3 349.5 121.8 339 126 C328.5 130.2 310.2 135.3 299 138 C287.8 140.7 269.4 144.2 259 145 C248.6 145.8 233.7 145.1 225 144 C216.3 142.9 206.2 135.9 197 137 C187.8 138.1 169.5 147.2 159 152 C148.5 156.8 132.2 166.8 122 171 C111.8 175.2 96.1 180.2 86 182 C75.9 183.8 58.8 184.0 50 184 C41.2 184.0 29.0 183.4 23 182 C17.0 180.6 9.9 177.6 7 174 C4.1 170.4 2.4 160.9 2 156 C1.6 151.1 -1.9 140.5 4 139 Z",
	},
];

const WallArt = ({
	mine,
	switchesReady,
	lit,
	onSwitch,
}: {
	mine: string | null;
	switchesReady: boolean;
	lit: Record<LightId, boolean>;
	onSwitch: (id: LightId) => void;
}) => {
	const { k, left, top } = useRoomScale();
	const place = GRID_PLACE[usePortrait() ? "tall" : "wide"];
	return (
		<div
			className="absolute origin-top-left pointer-events-none"
			style={{
				left,
				top,
				width: ROOM_W,
				height: ROOM_H,
				transform: `scale(${k})`,
			}}
		>
			<div
				className="absolute left-0 top-0 origin-top-left flex flex-col items-center"
				style={{
					width: GRID_W,
					height: GRID_H,
					transform: place,
					gap: CELL_GAP * 2,
				}}
			>
				<div
					className="grid"
					style={{
						gridTemplateColumns: `repeat(3, ${CELL_W}px)`,
						gridAutoRows: CELL_H,
						gap: CELL_GAP,
					}}
				>
					{PAINTINGS.map(({ name, alt, rows = 1, cols = 1 }) => (
						<img
							key={name}
							src={
								name === "mine"
									? (mine ?? asset("/imgs/art/empty_square_frame.webp"))
									: name === "daphne"
										? asset("/imgs/art/drawing-smile.webp")
										: asset(`/imgs/art/${name}.webp`)
							}
							alt={
								name === "mine"
									? mine
										? "Your drawing"
										: "An empty frame"
									: alt
							}
							className={`w-full h-full object-contain ${ART_SHADOW}`}
							style={{
								gridRow: `span ${rows}`,
								gridColumn: `span ${cols}`,
							}}
						/>
					))}
				</div>
				<svg
					className="w-[90px] h-[100px] overflow-visible"
					viewBox="0 0 120 150"
					aria-hidden
				>
					<path
						d="M62 4 C56 40 66 80 58 132 M30 104 C42 116 52 126 58 136 C66 124 78 112 92 100"
						fill="none"
						stroke="#000"
						strokeWidth="9"
						strokeLinecap="round"
						strokeLinejoin="round"
					/>
				</svg>
				<p
					className={`scribbler text-[50px] leading-none bg-white border-[5px] border-black border-dashed px-[20px] py-[10px] mt-[-20px] whitespace-nowrap ${ART_SHADOW}`}
				>
					MAGIC BUTTON
				</p>
			</div>
			{switchesReady &&
				LIGHTS.map(({ id, on, off, box, shape }) => (
					<button
						key={id}
						onClick={() => onSwitch(id)}
						aria-label={lit[id] ? off : on}
						aria-pressed={lit[id]}
						className="absolute pointer-events-none cursor-pointer"
						style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
					>
						<svg
							className="absolute inset-0 w-full h-full overflow-visible"
							aria-hidden
						>
							<path
								className="lamp-ants"
								d={shape}
								fill="transparent"
								stroke="#000"
								strokeOpacity="0.2"
								strokeWidth="1"
								strokeDasharray="4 3"
								strokeLinejoin="round"
								style={{ pointerEvents: "visiblePainted" }}
							/>
						</svg>
					</button>
				))}
		</div>
	);
};

const Wall = ({ children }: { children?: React.ReactNode }) => (
	<div className="absolute inset-0 bg-white overflow-hidden [backface-visibility:hidden]">
		<img
			src={asset("/imgs/stage/paper-bg-1920.webp")}
			className="absolute inset-0 w-full h-full object-cover opacity-60"
			alt=""
			aria-hidden
		/>
		{children}
	</div>
);

export default function Page10({ curtainsOpen }: PageProps) {
	const { goTo, myDrawing } = useStage();
	const saved = useDrawings().find((d) => !d.id.startsWith("sample"));
	const mine = myDrawing ?? saved?.image ?? null;
	const blinkSrc = useBlinkingDoll();

	const [shown, setShown] = useState(false);
	const [going, setGoing] = useState(false);
	const [closing, setClosing] = useState(false);
	const [inside, setInside] = useState(false);
	const [pushing, setPushing] = useState(false);
	const [frame, setFrame] = useState(-1);
	const [turning, setTurning] = useState(false);
	const [lit, setLit] = useState({ lamp: false, stars: false });
	const [arrived, setArrived] = useState(false);

	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const later = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));
	useEffect(
		() => () => {
			timers.current.forEach(clearTimeout);
			document.documentElement.classList.remove("zoomed-out");
		},
		[],
	);

	useEffect(() => {
		CURTAIN_FRAMES.forEach((src) => (new Image().src = src));
		new Image().src = ROOM_DARK;
		Object.values(ROOM_GLOW).forEach((src) => (new Image().src = src));
	}, []);

	useEffect(() => {
		if (closing) document.documentElement.classList.add("zoomed-out");
	}, [closing]);

	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const follow = () => {
		sound.click();
		setGoing(true);
		setFrame(0);
		later(LIFT_MS, () => {
			setClosing(true);
			sound.whoosh(CLOSE_MS);
		});
		CURTAIN_FRAMES.slice(1).forEach((_, i) =>
			later(LIFT_MS + (i + 1) * FRAME_MS, () => setFrame(i + 1)),
		);
		later(INSIDE_AT_MS, () => setInside(true));
		later(PUSH_AT_MS, () => {
			setPushing(true);
			sound.whoosh(PUSH_MS);
		});
		later(PUSH_AT_MS + PUSH_MS, () => setFrame(-1));
		later(TURN_AT_MS, () => {
			setTurning(true);
			sound.whoosh(TURN_MS);
		});
		later(ARRIVED_MS, () => setArrived(true));
	};

	return (
		<div className="h-full relative">
			<h1 className="sr-only">Backstage</h1>

			<div
				className="fixed inset-0 z-5 pointer-events-none"
				style={{
					perspective: "50vw",
					visibility: inside ? "visible" : "hidden",
				}}
			>
				<div
					className="absolute inset-0 [transform-style:preserve-3d]"
					style={{
						transform: `translateZ(50vw) rotateY(${turning ? 90 : 0}deg)`,
						transition: `transform ${TURN_MS}ms ${TURN_EASE}`,
					}}
				>
					<div
						className="absolute inset-0 [transform-style:preserve-3d]"
						style={{ transform: "translateZ(-50vw)" }}
					>
						<Wall />
					</div>
					<div
						className="absolute inset-0 [transform-style:preserve-3d]"
						style={{ transform: "rotateY(-90deg) translateZ(-50vw)" }}
					>
						<Wall>
							<img
								src={ROOM_DARK}
								className="absolute inset-0 w-full h-full object-cover"
								alt=""
							/>
							{LIGHTS.map(({ id }) => (
								<img
									key={id}
									src={ROOM_GLOW[id]}
									className="absolute inset-0 w-full h-full object-cover"
									style={{ visibility: lit[id] ? "visible" : "hidden" }}
									alt=""
								/>
							))}
							<WallArt
								mine={mine}
								switchesReady={arrived}
								lit={lit}
								onSwitch={(id) => {
									sound.click();
									setLit((l) => ({ ...l, [id]: !l[id] }));
								}}
							/>
						</Wall>
					</div>
				</div>
			</div>

			<Zhenya
				src={blinkSrc}
				className="fixed h-svh w-auto max-w-none top-[-4svh] left-[19vw] portrait:h-[66svh] portrait:top-[-2svh] portrait:left-[16vw] translate-x-[-50%] z-9 test-shadow-darker"
				style={{
					visibility: shown ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}`,
					transform: shown ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<div
				aria-hidden
				className="fixed w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] z-12 pointer-events-none scene-shadow"
				style={{
					visibility: closing && frame >= 0 ? "visible" : "hidden",
					transformOrigin: GAP_ORIGIN,
					scale: pushing ? `${PUSH_SCALE}` : "1",
					transition: `scale ${PUSH_MS}ms ${PUSH_EASE}`,
				}}
			>
				{CURTAIN_FRAMES.map((src, i) => (
					<img
						key={src}
						src={src}
						className="absolute inset-0 w-full h-full max-w-none"
						style={{ visibility: i === frame ? "inherit" : "hidden" }}
						alt=""
					/>
				))}
			</div>

			<div className="absolute top-[4svh] portrait:top-[2svh] left-[66%] portrait:left-[62%] translate-x-[-50%] w-max max-w-[30vw] portrait:max-w-[60vw] flex flex-col items-center gap-[2svh] z-9">
				<p
					className={`${LABEL} text-[3.4svh] portrait:text-[2.3svh] z-2`}
					style={hang(shown && !going, "top")}
				>
					<Strings />
					Come backstage with me.
				</p>
				<button
					onClick={follow}
					disabled={going}
					className={`${BUTTON} text-[3svh] portrait:text-[2.2svh] z-1`}
					style={hang(shown && !going, "top", 300)}
				>
					<Strings />
					Follow her {"->"}
				</button>
			</div>

			<p
				role="status"
				aria-live="polite"
				className={`fixed top-[16svh] portrait:top-[-10svh] left-[66vw] portrait:left-[70vw] translate-x-[-50%] w-max text-[3.4svh] portrait:text-[2.3svh] z-9 ${LABEL}`}
				style={hang(arrived, "top")}
			>
				<Strings />
				{arrived ? "This is my room." : ""}
			</p>

			<PopsicleButton
				onClick={() => goTo("/cutting-the-strings")}
				href="/cutting-the-strings"
				style={{
					...hang(arrived, "bottom", 900),
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
