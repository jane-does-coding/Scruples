import { useEffect, useRef, useState } from "react";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import useStats, { type Stat } from "@/components/useStats";
import usePortrait from "@/components/usePortrait";
import Zhenya from "@/components/Zhenya";
import { asset } from "@/lib/asset";
import { useDrawings } from "@/lib/drawings";
import { STORY_PAGES } from "@/lib/pages";
import * as sound from "@/lib/sound";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const CUT = asset("/imgs/zhenya/cut-strings-slow.webp");
const CUT_AT_MS = 1800;
const CUT_MS = 35 * 110;
const FADE_MS = 200;
const ZOOM_AT_MS = CUT_AT_MS + CUT_MS + 300;

const ZOOM_MS = 10000;
const ZOOM_EASE = "cubic-bezier(0.75, 0, 0.45, 1)";
const START_HOLE = { x: 50.3, y: 56.2 };
const END_HOLE = { x: 49.7, y: 38.7, size: 0.675 };
const START_SCALE = 1 / END_HOLE.size;
const ORIGIN_X = (START_HOLE.x - START_SCALE * END_HOLE.x) / (1 - START_SCALE);
const ORIGIN_Y = (START_HOLE.y - START_SCALE * END_HOLE.y) / (1 - START_SCALE);

const PANEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const STICK = asset("/imgs/stage/popsicle-stick.webp");
const EXTRAS = STORY_PAGES.filter((p) => "extra" in p);

const LABEL =
	"relative text-center scribbler bg-white border-[0.2svh] border-black px-[0.8vw] portrait:px-[2vw] py-[0.4svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;
const DROP_STAGGER_MS = 350;
const STATS_IN_MS = 1500;
const GALLERY_IN_MS = STATS_IN_MS + 11 * DROP_STAGGER_MS;
const EXTRAS_IN_MS = GALLERY_IN_MS + 1200;

const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-[0.8vw] absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-[0.8vw] absolute"></span>
	</>
);

const DOLL = { height: 100, top: -28, left: 50 };
const PHONE_DOLL = { height: 60, top: -8, left: 50 };
const CUT_HEIGHT = 1.2619;
const CUT_TOP = 0.0169;
const CUT_LEFT = 0.3371;

const hang = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform 900ms ${DOLL_DROP} ${shown ? delay : 0}ms`,
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-120svh" : "110svh"})`,
});

export default function Page11({ curtainsOpen }: PageProps) {
	const { goTo } = useStage();
	const blinkSrc = useBlinkingDoll();
	const portrait = usePortrait();
	const doll = portrait ? PHONE_DOLL : DOLL;

	const [shown, setShown] = useState(false);
	const [cutSrc, setCutSrc] = useState<string | null>(null);
	const [cutShowing, setCutShowing] = useState(false);
	const [gone, setGone] = useState(false);
	const [zoom, setZoom] = useState<"in" | "out">("in");
	const [settled, setSettled] = useState(false);
	const cutBlob = useRef<Blob | null>(null);
	const [theatre, setTheatre] = useState(
		asset("/imgs/stage/theatre-white.webp"),
	);

	useEffect(() => {
		fetch(CUT)
			.then((res) => res.blob())
			.then((b) => (cutBlob.current = b));
		const src = asset(
			window.innerWidth * window.devicePixelRatio <= 1000
				? "/imgs/stage/theatre-white-1200.webp"
				: "/imgs/stage/theatre-white.webp",
		);
		const timer = setTimeout(() => setTheatre(src), 0);
		document.documentElement.classList.add("zoomed-out");
		new Image().src = src;
		return () => {
			clearTimeout(timer);
			document.documentElement.classList.remove("zoomed-out");
			sound.hushMurmur(1500);
		};
	}, []);

	useEffect(() => {
		if (!curtainsOpen) return;
		const timers: ReturnType<typeof setTimeout>[] = [];
		const at = (ms: number, then: () => void) =>
			timers.push(setTimeout(then, ms));
		at(0, () => setShown(true));
		at(CUT_AT_MS, () =>
			setCutSrc(cutBlob.current ? URL.createObjectURL(cutBlob.current) : CUT),
		);
		at(CUT_AT_MS + CUT_MS - FADE_MS, () => setGone(true));
		at(ZOOM_AT_MS, () => {
			setZoom("out");
			sound.startMurmur();
			sound.whoosh(ZOOM_MS);
		});
		at(ZOOM_AT_MS, () => setSettled(true));
		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	const drawings = useDrawings();
	const stats: Stat[] = [
		...useStats(settled).flatMap(({ lines }) => lines),
		[`${drawings.length}`, "drawings in the gallery"],
	];
	const place = (i: number) => ({
		zIndex: 10 - i,
		transition: `transform 800ms ${PANEL_DROP} ${settled ? STATS_IN_MS + i * DROP_STAGGER_MS : 0}ms`,
		transform: settled ? "translateY(0)" : "translateY(-110svh)",
	});

	const loop = drawings.length
		? Array.from(
				{ length: Math.max(5, drawings.length) },
				(_, i) => drawings[i % drawings.length],
			)
		: [];

	useEffect(() => {
		if (!cutSrc?.startsWith("blob:")) return;
		return () => URL.revokeObjectURL(cutSrc);
	}, [cutSrc]);

	return (
		<div className="h-full relative">
			<h1 className="sr-only">Cutting the strings</h1>

			<Zhenya
				src={blinkSrc}
				className="h-svh w-auto max-w-none absolute top-[-28svh] portrait:h-[60svh] portrait:top-[-8svh] translate-x-[-50%] z-9"
				style={{
					...hang(shown && !cutShowing, "top"),
					filter: "drop-shadow(12px 12px 2px #28282857)",
					translate: "-50% -4svh",
					scale: "-1 1",
					left: `${doll.left}%`,
					visibility: shown && !cutShowing ? "visible" : "hidden",
				}}
				alt="Zhenya, a marionette doll on strings, holding a pair of scissors"
			/>

			{cutSrc && (
				<img
					src={cutSrc}
					onLoad={() => setCutShowing(true)}
					className="absolute w-auto max-w-none z-9 pointer-events-none"
					style={{
						height: `${doll.height * CUT_HEIGHT}svh`,
						top: `${doll.top - 4 - doll.height * CUT_TOP}svh`,
						left: `${doll.left}%`,
						marginLeft: `${-doll.height * CUT_LEFT}svh`,
						filter: "drop-shadow(12px 12px 2px #28282857)",
						opacity: gone ? 0 : 1,
						transition: `opacity ${FADE_MS}ms ease`,
					}}
					alt="Zhenya cuts her own strings and falls"
				/>
			)}

			{
				<div className="fixed top-0 left-0 w-screen h-svh portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none z-12 pointer-events-none overflow-hidden">
					<div
						className="absolute inset-0"
						style={{
							transformOrigin: `${ORIGIN_X}% ${ORIGIN_Y}%`,
							scale: zoom === "out" ? "1" : `${START_SCALE}`,
							transition:
								zoom === "out" ? `scale ${ZOOM_MS}ms ${ZOOM_EASE}` : "none",
						}}
					>
						<div
							className="absolute top-0 left-[68%] translate-x-[-50%] h-[68%] w-[24svh] portrait:hidden overflow-hidden test-shadow-darker"
							style={{
								opacity: settled ? 1 : 0,
								transition: `opacity 900ms ease ${GALLERY_IN_MS}ms`,
							}}
						>
							<span className="w-[0.1vw] min-w-px bg-black/60 h-full top-0 left-[15%] absolute"></span>
							<span className="w-[0.1vw] min-w-px bg-black/60 h-full top-0 right-[15%] absolute"></span>
							{loop.length > 0 && (
								<div
									className="flex flex-col marquee-up hover-pause pointer-events-auto"
									style={{ animationDuration: `${loop.length * 7}s` }}
								>
									{[0, 1].map((copy) => (
										<ul
											key={copy}
											className="flex flex-col gap-[2svh] pb-[2svh]"
											aria-hidden={copy === 1}
										>
											{loop.map((drawing, i) => (
												<li key={`${drawing.id}-${i}`}>
													<img
														src={drawing.image}
														className="w-full h-auto"
														alt={`A drawing by ${drawing.by.toLowerCase()}, in a picture frame`}
													/>
												</li>
											))}
										</ul>
									))}
								</div>
							)}
						</div>

						<section className="absolute top-[17%] left-[42%] portrait:top-[16%] portrait:left-[50%] translate-x-[-50%] w-[30%] portrait:w-[50%] flex flex-col items-center gap-[1.2svh]">
							<h2
								className={`${LABEL} w-max text-[3.5svh] portrait:text-[1.6svh]`}
								style={place(0)}
							>
								<Strings />
								Your stats
							</h2>
							<div className="grid grid-cols-3 gap-[1.2svh] w-full">
								{stats.map(([value, label], i) => (
									<p
										key={i}
										className={`${LABEL} flex flex-col items-center justify-center gap-[0.4svh] min-h-[8svh] portrait:min-h-[5svh] border-[0.3svh]`}
										style={place(i + 1)}
									>
										<Strings />
										<span className="text-[4svh] portrait:text-[1.9svh] leading-none whitespace-nowrap">
											{value}
										</span>
										<span className="text-[1.8svh] portrait:text-[1svh] leading-tight text-black/70">
											{label}
										</span>
									</p>
								))}
							</div>
						</section>

						<nav
							aria-label="Extras"
							className="absolute top-[58%] left-[42%] portrait:top-[44%] portrait:left-[50%] translate-x-[-50%] w-max portrait:w-[54%] flex flex-wrap justify-center items-start gap-[1.4vw] portrait:gap-x-[2vw] portrait:gap-y-[4svh]"
						>
							{EXTRAS.map(({ title, href }, i) => (
								<div
									key={href}
									className="relative test-shadow-darker"
									style={{
										transition: `transform 900ms ${DOLL_DROP} ${settled ? EXTRAS_IN_MS + i * DROP_STAGGER_MS : 0}ms`,
										transform: settled ? "translateY(0)" : "translateY(60svh)",
									}}
								>
									<img
										src={STICK}
										className="absolute w-[2vw] portrait:w-[2.5svh] h-[30svh] max-w-none left-[50%] translate-x-[-50%] top-[60%] z-0"
										alt=""
										aria-hidden
									/>
									<a
										href={href}
										onClick={(e) => {
											if (
												e.metaKey ||
												e.ctrlKey ||
												e.shiftKey ||
												e.button !== 0
											)
												return;
											e.preventDefault();
											goTo(href);
										}}
										tabIndex={settled ? undefined : -1}
										className={`${BUTTON} block w-max text-[2.3svh] portrait:text-[1.3svh] pointer-events-auto z-1`}
									>
										{title} {"->"}
									</a>
								</div>
							))}
						</nav>

						<img
							src={theatre}
							className="absolute inset-0 w-full h-full scene-shadow"
							alt=""
						/>
					</div>
				</div>
			}
		</div>
	);
}
