import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import usePortrait from "@/components/usePortrait";
import Zhenya from "@/components/Zhenya";
import { asset } from "@/lib/asset";
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

const LINES = [
	"Bad art is better than AI art.",
	"Go out there and create magic of your own,",
	"rather than having AI steal other people's art.",
];
const PANEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";

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

export default function Page10({ curtainsOpen }: PageProps) {
	const { goTo } = useStage();
	const blinkSrc = useBlinkingDoll();
	const portrait = usePortrait();
	const doll = portrait ? PHONE_DOLL : DOLL;

	const [shown, setShown] = useState(false);
	const [cutSrc, setCutSrc] = useState<string | null>(null);
	const [cutShowing, setCutShowing] = useState(false);
	const [gone, setGone] = useState(false);
	const [zoom, setZoom] = useState<"in" | "out">("in");
	const [rolling, setRolling] = useState(false);
	const [done, setDone] = useState(false);
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
			setRolling(true);
			sound.startMurmur();
			sound.whoosh(ZOOM_MS);
		});
		at(ZOOM_AT_MS + ZOOM_MS + 1500, () => setDone(true));
		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	useEffect(() => {
		if (!cutSrc?.startsWith("blob:")) return;
		return () => URL.revokeObjectURL(cutSrc);
	}, [cutSrc]);

	return (
		<div className="h-full relative">
			<h1 className="sr-only">Cutting the strings</h1>
			<p role="status" aria-live="polite" className="sr-only">
				{gone ? LINES.join(" ") : ""}
			</p>

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
				<div
					aria-hidden
					className="fixed top-0 left-0 w-screen h-svh portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none z-12 pointer-events-none overflow-hidden"
				>
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
							className="absolute w-max max-w-[60%] portrait:max-w-[70%] text-center scribbler text-[4svh] portrait:text-[2.6svh] leading-snug"
							style={{
								left: `${END_HOLE.x}%`,
								top: `${END_HOLE.y}%`,
								transform: `translate(-50%, -50%) scale(${END_HOLE.size})`,
							}}
						>
							<div
								style={{
									transform: rolling ? "translateY(0)" : "translateY(-80svh)",
									transition: `transform 1200ms ${PANEL_DROP}`,
								}}
							>
								<div className="panel-sway relative flex flex-col items-center gap-[1svh] bg-white border-[0.3svh] border-black px-[2vw] portrait:px-[4vw] py-[2svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker">
									<span className="w-[0.15svh] bg-black/60 h-[200svh] top-[-200svh] left-[2vw] absolute"></span>
									<span className="w-[0.15svh] bg-black/60 h-[200svh] top-[-200svh] right-[2vw] absolute"></span>
									{LINES.map((line) => (
										<p key={line}>{line}</p>
									))}
								</div>
							</div>
						</div>
						<img
							src={theatre}
							className="absolute inset-0 w-full h-full scene-shadow"
							alt=""
						/>
					</div>
				</div>
			}

			<PopsicleButton
				onClick={() => goTo("/lastpage")}
				href="/lastpage"
				style={{
					...hang(done, "bottom"),
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
