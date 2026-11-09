import { useEffect, useRef, useState } from "react";
import { useStage } from "@/components/Stage";
import useBlinkingDoll, { DAPHNE } from "@/components/useBlinkingDoll";
import useFrownDoll, { ZHENYA_FROWN } from "@/components/useFrownDoll";
import useWowDoll from "@/components/useWowDoll";
import usePortrait from "@/components/usePortrait";
import PopsicleButton from "@/components/PopsicleButton";
import PosterViewer from "@/components/PosterViewer";
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

const curtainFrames = (name: string, count: number) =>
	Array.from({ length: count }, (_, i) =>
		asset(`/imgs/stage/${name}/${String(i).padStart(2, "0")}.webp`),
	);
const CLOSE_FRAMES = curtainFrames("closing", 10);
const CURTAIN_FRAMES = [...CLOSE_FRAMES, ...curtainFrames("opening", 12)];
const LIFT_MS = 700;
const FRAME_MS = 110;
const CLOSE_MS = (CLOSE_FRAMES.length - 1) * FRAME_MS;
const INSIDE_AT_MS = LIFT_MS + CLOSE_MS + 100;
const OPEN_AT_MS = LIFT_MS + CLOSE_MS + 900;
const OPEN_MS = (CURTAIN_FRAMES.length - CLOSE_FRAMES.length) * FRAME_MS;
const PUSH_AT_MS = OPEN_AT_MS + OPEN_MS + 300;
const PUSH_MS = 3800;
const FADE_MS = 1100;
const PUSH_EASE = "linear";
const PUSH_SCALE = 3.2;
const ARRIVED_MS = PUSH_AT_MS + FADE_MS + 400;
const LIGHT_FADE = "opacity 700ms ease";
const DARKNESS: Record<RoomKey, number> = {
	none: 0.3,
	stars: 0.17,
	lamp: 0,
	all: 0,
};
const ROOM_IMGS = {
	none: asset("/room-no-lights.png"),
	lamp: asset("/room-lamp.png"),
	stars: asset("/room-fairy.png"),
	all: asset("/room-all-lights.png"),
};
type RoomKey = keyof typeof ROOM_IMGS;

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

const away = (
	ever: boolean,
	on: boolean,
	delay = 0,
	from: "top" | "bottom" = "top",
) => ({
	visibility: ever ? ("visible" as const) : ("hidden" as const),
	transition: `transform 800ms ${LABEL_DROP} ${on ? delay : 0}ms`,
	transform: on
		? "translateY(0)"
		: `translateY(${from === "top" ? "-120svh" : "110svh"})`,
});

const SAY = `${LABEL} text-[3svh] portrait:text-[1.9svh] w-max max-w-[26vw] portrait:max-w-[44vw]`;
const ASK = `${BUTTON} text-[3svh] portrait:text-[1.9svh] w-max max-w-[26vw] portrait:max-w-[44vw]`;

type Choice = "fine" | "upset";
type Who = "zhenya" | "daphne";

const WALK_MS = 3500;
const LINE_MS = 900;

const REPLY: Record<Choice, { who: Who; text: string }[]> = {
	fine: [
		{ who: "daphne", text: "My drawing is there too!" },
		{
			who: "daphne",
			text: "I don't like it. I never agreed to my art feeding the Magic Button.",
		},
	],
	upset: [
		{ who: "daphne", text: "My drawing is there too!" },
		{ who: "daphne", text: "I mean, why do you care?" },
	],
};

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

const ROOM_LIFT = 0.02;

const useRoomScale = () => {
	const [size, setSize] = useState({ w: 1, h: 1 });
	useEffect(() => {
		const measure = () =>
			setSize({ w: window.innerWidth, h: window.innerHeight });
		measure();
		window.addEventListener("resize", measure);
		return () => window.removeEventListener("resize", measure);
	}, []);
	const lift = size.h * ROOM_LIFT;
	const h = size.h + lift * 2;
	const k = Math.max(size.w / ROOM_W, h / ROOM_H);
	return {
		k,
		left: (size.w - ROOM_W * k) / 2,
		top: -lift * 2 + (h - ROOM_H * k) / 2,
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

const POSTER = {
	box: { x: 597, y: 174, w: 62, h: 105 },
	shape: "M-2 10.4 L60.6 -2 L63.2 99.3 L-0.9 106.6 Z",
};

const Hotspot = ({
	box,
	shape,
	label,
	pressed,
	onClick,
	hint,
}: {
	hint: boolean;
	box: { x: number; y: number; w: number; h: number };
	shape: string;
	label: string;
	pressed?: boolean;
	onClick: () => void;
}) => (
	<button
		onClick={onClick}
		aria-label={label}
		aria-pressed={pressed}
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
				strokeOpacity={hint ? 0.75 : 0.1}
				strokeWidth={hint ? 1.6 : 0.9}
				strokeDasharray="4 3"
				strokeLinejoin="round"
				style={{
					pointerEvents: "visiblePainted",
					transition: "stroke-opacity 400ms ease, stroke-width 400ms ease",
				}}
			/>
		</svg>
	</button>
);

const WallArt = ({
	mine,
	room,
	switchesReady,
	lit,
	onSwitch,
	onPoster,
	hint,
}: {
	mine: string | null;
	room: RoomKey;
	switchesReady: boolean;
	lit: Record<LightId, boolean>;
	onSwitch: (id: LightId) => void;
	onPoster: () => void;
	hint: boolean;
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
			{(Object.keys(ROOM_IMGS) as RoomKey[]).map((key) => (
				<img
					key={key}
					src={ROOM_IMGS[key]}
					className="absolute inset-0 w-full h-full"
					style={{
						opacity: key === "none" || key === room ? 1 : 0,
						transition: LIGHT_FADE,
					}}
					alt=""
				/>
			))}
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
					className={`scribbler text-[80px] leading-none bg-white border-[7px] border-black border-dashed px-[32px] py-[16px] mt-[-20px] whitespace-nowrap ${ART_SHADOW}`}
				>
					MAGIC BUTTON
				</p>
			</div>
			{switchesReady && (
				<>
					{LIGHTS.map(({ id, on, off, box, shape }) => (
						<Hotspot
							key={id}
							box={box}
							shape={shape}
							label={lit[id] ? off : on}
							pressed={lit[id]}
							hint={hint}
							onClick={() => onSwitch(id)}
						/>
					))}
					<Hotspot
						box={POSTER.box}
						shape={POSTER.shape}
						label="Look at the Sunbeam poster"
						hint={hint}
						onClick={onPoster}
					/>
				</>
			)}
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
	const daphneBlinkSrc = useBlinkingDoll(DAPHNE);
	const wow = useWowDoll();
	const zhenyaFrown = useFrownDoll(ZHENYA_FROWN);
	const daphneFrown = useFrownDoll();
	const zhenyaSrc = wow.src ?? zhenyaFrown.src ?? blinkSrc;
	const daphneSrc = daphneFrown.src ?? daphneBlinkSrc;
	const portrait = usePortrait();
	const [hint, setHint] = useState(false);
	const [phase, setPhase] = useState<"a" | "b" | "c" | null>(null);
	const [aStep, setAStep] = useState(0);
	const [bStep, setBStep] = useState(0);
	const [choice, setChoice] = useState<Choice | null>(null);
	const [daphneIn, setDaphneIn] = useState(false);
	const [walking, setWalking] = useState(false);
	const [cStep, setCStep] = useState(0);
	const [cReady, setCReady] = useState(false);

	const [shown, setShown] = useState(false);
	const [going, setGoing] = useState(false);
	const [closing, setClosing] = useState(false);
	const [inside, setInside] = useState(false);
	const [pushing, setPushing] = useState(false);
	const [frame, setFrame] = useState(-1);
	const [lit, setLit] = useState({ lamp: false, stars: false });
	const [poster, setPoster] = useState(false);
	const roomKey: RoomKey =
		lit.lamp && lit.stars
			? "all"
			: lit.lamp
				? "lamp"
				: lit.stars
					? "stars"
					: "none";
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
		Object.values(ROOM_IMGS).forEach((src) => (new Image().src = src));
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
		CLOSE_FRAMES.slice(1).forEach((_, i) =>
			later(LIFT_MS + (i + 1) * FRAME_MS, () => setFrame(i + 1)),
		);
		later(INSIDE_AT_MS, () => setInside(true));
		later(OPEN_AT_MS, () => sound.whoosh(OPEN_MS));
		CURTAIN_FRAMES.slice(CLOSE_FRAMES.length).forEach((_, i) =>
			later(OPEN_AT_MS + i * FRAME_MS, () => setFrame(CLOSE_FRAMES.length + i)),
		);
		later(PUSH_AT_MS, () => {
			setPushing(true);
			sound.whoosh(FADE_MS);
		});
		later(PUSH_AT_MS + PUSH_MS, () => setFrame(-1));
		later(ARRIVED_MS, () => setArrived(true));
	};

	const flashHint = () => {
		sound.click();
		setHint(true);
		later(1600, () => setHint(false));
	};

	const startTalk = () => {
		setPhase("a");
		wow.playWow();
		later(1800, wow.playWowReverse);
		later(2900, () => {
			setAStep(1);
			zhenyaFrown.playFrown();
		});
		later(3900, () => setAStep(2));
		later(4800, () => setAStep(3));
	};

	const next = () => {
		sound.click();
		setPhase("b");
		later(500, () => setBStep(1));
		later(1400, () => setBStep(2));
	};

	const choose = (picked: Choice) => {
		sound.click();
		setChoice(picked);
		setPhase("c");
		later(600, () => {
			setDaphneIn(true);
			setWalking(true);
		});
		later(600 + WALK_MS, () => {
			setWalking(false);
			daphneFrown.playFrown();
		});
		later(600 + WALK_MS + 300, () => setCStep(1));
		later(600 + WALK_MS + 300 + LINE_MS, () => setCReady(true));
	};

	const nextLine = () => {
		sound.click();
		setCReady(false);
		setCStep(cStep + 1);
		if (choice === "upset" && cStep === 1) daphneFrown.playFrownReverse();
		later(LINE_MS, () => setCReady(true));
	};

	const lines = choice ? REPLY[choice].map((line, i) => ({ ...line, i })) : [];

	return (
		<div className="h-full relative">
			<h1 className="sr-only">Backstage</h1>

			<div
				className="fixed inset-0 z-5 pointer-events-none"
				style={{ visibility: inside ? "visible" : "hidden" }}
			>
				<Wall>
					<WallArt
						mine={mine}
						room={roomKey}
						switchesReady={arrived}
						lit={lit}
						hint={hint}
						onSwitch={(id) => {
							sound.click();
							setLit((l) => ({ ...l, [id]: !l[id] }));
							if (id === "lamp" && !lit.lamp && !phase) startTalk();
						}}
						onPoster={() => {
							sound.click();
							setPoster(true);
						}}
					/>
				</Wall>
			</div>

			<Zhenya
				src={zhenyaSrc}
				className="fixed h-svh w-auto max-w-none top-[-4svh] portrait:h-[66svh] portrait:top-[-2svh] translate-x-[-50%] z-9 test-shadow-darker"
				style={{
					left: inside ? (portrait ? "16vw" : "19vw") : "50vw",
					visibility: shown ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}`,
					transform: shown ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<button
				onClick={follow}
				disabled={going}
				tabIndex={-1}
				aria-label="Peek at the painting behind the curtain"
				className="fixed top-[30svh] left-[81vw] portrait:top-[34svh] portrait:left-[78vw] h-[44svh] portrait:h-[26svh] z-9 cursor-pointer test-shadow-darker"
				style={{
					...hang(shown && !inside, "top", 500),
					rotate: "5deg",
				}}
			>
				<img
					src={asset("/imgs/art/tall-scream.webp")}
					className="h-full w-auto max-w-none"
					alt=""
				/>
			</button>

			<div
				className="fixed h-svh top-[-4svh] portrait:h-[66svh] portrait:top-[-2svh] translate-x-[-50%] z-9"
				style={{
					visibility: daphneIn ? "visible" : "hidden",
					transition: `left ${WALK_MS}ms cubic-bezier(0.25, 0.1, 0.45, 1)`,
					left: daphneIn ? (portrait ? "80vw" : "86vw") : "160vw",
				}}
			>
				<img
					src={daphneSrc}
					className={`h-full w-auto max-w-none scale-x-[-1] test-shadow-darker ${walking ? "walk-bob" : ""}`}
					alt="Daphne, another marionette doll on strings"
				/>
			</div>

			<div
				aria-hidden
				className="fixed inset-0 z-9 pointer-events-none bg-[#141428]"
				style={{
					visibility: inside ? "visible" : "hidden",
					opacity: DARKNESS[roomKey],
					transition: LIGHT_FADE,
				}}
			/>

			<div
				aria-hidden
				className="fixed w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] z-12 pointer-events-none scene-shadow"
				style={{
					visibility: closing && frame >= 0 ? "visible" : "hidden",
					transformOrigin: "50% 45%",
					scale: pushing ? `${PUSH_SCALE}` : "1",
					opacity: pushing ? 0 : 1,
					transition: `scale ${PUSH_MS}ms ${PUSH_EASE}, opacity ${FADE_MS}ms ease-in`,
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

			<div className="fixed top-[36svh] portrait:top-[70svh] left-[71vw] portrait:left-[50vw] translate-x-[-50%] w-max max-w-[30vw] portrait:max-w-[60vw] flex flex-col items-center gap-[2svh] z-9 pointer-events-none">
				<p
					className={`${LABEL} text-[3.4svh] portrait:text-[2.3svh] z-2`}
					style={hang(shown && !going, "top")}
				>
					<Strings />
					{"Wait, what's that?"}
				</p>
				<button
					onClick={follow}
					disabled={going}
					className={`${BUTTON} text-[3svh] portrait:text-[2.2svh] z-1 pointer-events-auto`}
					style={hang(shown && !going, "top", 300)}
				>
					<Strings />
					Peek through {"->"}
				</button>
			</div>

			<p
				role="status"
				aria-live="polite"
				className={`fixed top-[16svh] portrait:top-[-10svh] left-[66vw] portrait:left-[70vw] translate-x-[-50%] w-max text-[3.4svh] portrait:text-[2.3svh] z-9 ${LABEL}`}
				style={away(arrived, arrived && !phase)}
			>
				<Strings />
				{arrived ? "The backstage??" : ""}
			</p>

			<button
				onClick={flashHint}
				disabled={!arrived || !!phase}
				tabIndex={arrived && !phase ? undefined : -1}
				className={`!fixed top-[3svh] left-[60vw] portrait:top-[3svh] portrait:left-[50vw] translate-x-[-50%] w-max text-[2.8svh] portrait:text-[2svh] z-9 ${BUTTON}`}
				style={away(arrived, arrived && !phase, 300)}
			>
				<Strings />
				Try clicking around
			</button>

			<div className="fixed top-[41svh] left-[83.6vw] portrait:top-[12svh] portrait:left-[66vw] translate-x-[-50%] w-max flex flex-col items-center gap-[1.5svh] z-10 pointer-events-none">
				<p
					className={SAY}
					style={away(aStep >= 1, aStep >= 1 && phase === "a")}
				>
					<Strings />
					Wait...
				</p>
				<p
					className={SAY}
					style={away(aStep >= 2, aStep >= 2 && phase === "a", 0)}
				>
					<Strings />
					The Magic Button is stealing art!
				</p>
				<button
					onClick={next}
					disabled={aStep < 3 || phase !== "a"}
					tabIndex={aStep >= 3 && phase === "a" ? undefined : -1}
					className={`${ASK} pointer-events-auto`}
					style={away(aStep >= 3, aStep >= 3 && phase === "a")}
				>
					<Strings />
					Next {"->"}
				</button>
			</div>

			<div className="fixed top-[41svh] left-[83.6vw] portrait:top-[12svh] portrait:left-[66vw] translate-x-[-50%] w-max flex flex-col items-center gap-[1.5svh] z-10 pointer-events-none">
				<p
					className={SAY}
					style={away(bStep >= 1, bStep >= 1 && phase === "b")}
				>
					<Strings />
					My drawing is there too!
				</p>
				{(["fine", "upset"] as const).map((key, i) => (
					<button
						key={key}
						onClick={() => choose(key)}
						disabled={bStep < 2 || phase !== "b"}
						tabIndex={bStep >= 2 && phase === "b" ? undefined : -1}
						className={`${ASK} pointer-events-auto`}
						style={away(bStep >= 2, bStep >= 2 && phase === "b", i * 200)}
					>
						<Strings />
						{key === "fine"
							? "I mean, I don't care"
							: "I didn't agree to this!"}
					</button>
				))}
			</div>

			{(["zhenya", "daphne"] as const).map((who) => (
				<div
					key={who}
					role="log"
					aria-live="polite"
					className={`fixed portrait:bottom-[4svh] flex flex-col gap-[1.5svh] z-10 pointer-events-none ${who === "zhenya" ? "top-[9svh] left-[3vw] portrait:top-auto portrait:left-[4vw] items-start" : "top-[9svh] right-[3vw] portrait:top-auto portrait:right-[4vw] items-end"}`}
				>
					{lines
						.filter((line) => line.who === who && cStep > line.i)
						.slice(-2)
						.map(({ text, i }) => (
							<p key={i} className={`${SAY} hang-in`}>
								<Strings />
								{text}
							</p>
						))}
					{cReady && cStep < lines.length && lines[cStep - 1]?.who === who && (
						<button
							key={`next-${cStep}`}
							onClick={nextLine}
							className={`${ASK} hang-in pointer-events-auto`}
						>
							<Strings />
							Next {"->"}
						</button>
					)}
				</div>
			))}

			<PopsicleButton
				onClick={() => goTo("/cutting-the-strings")}
				href="/cutting-the-strings"
				style={{
					...hang(
						cReady && cStep >= lines.length && lines.length > 0,
						"bottom",
					),
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					zIndex: 20,
				}}
			>
				Continue {"->"}
			</PopsicleButton>

			{poster && <PosterViewer onClose={() => setPoster(false)} />}
		</div>
	);
}
