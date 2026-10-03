"use client";

import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";

const ANIMATION_MS = 700;
// Opening on a new route is a bit slower, and waits a moment first so the
// new page has drawn before the curtains move
const ROUTE_OPEN_MS = 1000;
const ROUTE_OPEN_DELAY_MS = 150;

const frames = (name: string, count: number) =>
	Array.from(
		{ length: count },
		(_, i) => `/imgs/${name}/${String(i).padStart(2, "0")}.webp`,
	);

const CLOSING_FRAMES = frames("closing", 10);
const OPENING_FRAMES = frames("opening", 12);
// First half (21 of 42 frames) of ripping.gif. The GIF runs at 50ms a frame;
// it's played faster here
const RIPPING_FRAMES = frames("ripping", 21);
const RIPPING_FRAME_MS = 30;
// Curtains start opening this long after the ticket is clicked
const CURTAIN_DELAY_MS = 300;

type StageContextValue = {
	// True once the curtains have finished opening
	curtainsOpen: boolean;
	// Close the curtains, go to `href`, and open them once it has rendered
	goTo: (href: string) => void;
};

const StageContext = createContext<StageContextValue | null>(null);

export const useStage = () => {
	const stage = useContext(StageContext);
	if (!stage) throw new Error("useStage must be used inside <Stage>");
	return stage;
};

// The theatre around every route: background, curtains, ticket and nav.
// It lives in the root layout so it stays mounted while routes change
export default function Stage({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	// Starts "loading": closed curtains cover the page until the ticket is
	// clicked and the opening frames are decoded, then they open
	const [animationStage, setAnimationStage] = useState<
		"loading" | "idle" | "closing" | "opening"
	>("loading");

	// The ticket sits on the closed curtains until it's clicked, then plays
	// the ripping frames in the same spot while the curtains open behind it.
	// The refs are read by the frame loader, which may finish before or after
	// the click
	const [ticket, setTicket] = useState<"waiting" | "ripping" | "gone">(
		"waiting",
	);
	const enteredRef = useRef(false);
	const curtainDelayDone = useRef(false);
	const ripCanvasRef = useRef<HTMLCanvasElement>(null);
	const ripFrames = useRef<ImageBitmap[]>([]);

	// Nav: header.png slides down from the top when "?" is clicked
	const [navOpen, setNavOpen] = useState(false);
	useEffect(() => {
		if (!navOpen) return;
		const closeOnEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setNavOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [navOpen]);

	// The GIFs are too big for browsers to animate reliably, so they're
	// split into frames (public/imgs/closing, public/imgs/opening,
	// public/imgs/ripping). Every frame is decoded up front and drawn to a
	// canvas, so playback starts the instant the button is clicked.
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const bitmaps = useRef<{ closing: ImageBitmap[]; opening: ImageBitmap[] }>({
		closing: [],
		opening: [],
	});
	const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);

	const drawFrame = (bitmap: ImageBitmap) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (canvas.width !== bitmap.width) {
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
		}
		const ctx = canvas.getContext("2d")!;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(bitmap, 0, 0);
	};

	// Clear the last frame in the same paint that shows open.png again,
	// so there's no flash between them
	useLayoutEffect(() => {
		if (animationStage !== "idle") return;
		const canvas = canvasRef.current;
		canvas?.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
	}, [animationStage]);

	const playFrames = (
		frames: ImageBitmap[],
		onDone: () => void,
		duration = ANIMATION_MS,
	) => {
		let i = 0;
		drawFrame(frames[0]);
		frameTimer.current = setInterval(() => {
			i++;
			if (i < frames.length) {
				drawFrame(frames[i]);
			} else {
				clearInterval(frameTimer.current!);
				onDone();
			}
		}, duration / frames.length);
	};

	const openCurtains = (duration = ANIMATION_MS) => {
		setAnimationStage("opening");
		playFrames(
			bitmaps.current.opening,
			() => setAnimationStage("idle"),
			duration,
		);
	};

	// Draws the first frame right away, in the click itself, so the rip
	// starts instantly, then removes the ticket after the last frame
	const playRipping = () => {
		const canvas = ripCanvasRef.current;
		const frames = ripFrames.current;
		if (!canvas || !frames.length) {
			setTicket("gone");
			return;
		}

		canvas.width = frames[0].width;
		canvas.height = frames[0].height;
		const ctx = canvas.getContext("2d")!;
		let i = 0;
		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(frames[i], 0, 0);
		};

		draw();
		setTicket("ripping");
		const timer = setInterval(() => {
			i++;
			if (i < frames.length) {
				draw();
			} else {
				clearInterval(timer);
				setTicket("gone");
			}
		}, RIPPING_FRAME_MS);
	};

	const enter = () => {
		if (enteredRef.current) return;
		enteredRef.current = true;
		playRipping();

		setTimeout(() => {
			curtainDelayDone.current = true;
			// Otherwise the frame loader opens them once it's done
			if (bitmaps.current.opening.length) openCurtains();
		}, CURTAIN_DELAY_MS);
	};

	useEffect(() => {
		const decode = (srcs: string[]) =>
			Promise.all(
				srcs.map((src) =>
					fetch(src)
						.then((res) => res.blob())
						.then((blob) => createImageBitmap(blob)),
				),
			);

		let cancelled = false;

		decode(CLOSING_FRAMES).then((b) => (bitmaps.current.closing = b));
		decode(OPENING_FRAMES).then((b) => {
			bitmaps.current.opening = b;
			if (cancelled) return;
			// Ticket was clicked while the frames were still loading
			if (enteredRef.current && curtainDelayDone.current) openCurtains();
		});
		decode(RIPPING_FRAMES).then((b) => (ripFrames.current = b));

		return () => {
			cancelled = true;
			if (frameTimer.current) clearInterval(frameTimer.current);
		};
	}, []);

	// Plays the closing frames, then calls onClosed. Returns false (and does
	// nothing) if the curtains are mid-animation or the frames aren't loaded
	const closeCurtains = (onClosed: () => void) => {
		const { closing, opening } = bitmaps.current;
		if (animationStage !== "idle" || !closing.length || !opening.length) {
			return false;
		}
		setAnimationStage("closing");
		playFrames(closing, onClosed);
		return true;
	};

	// Set when the curtains have closed for a route change; the pathname
	// effect below opens them once the new route has rendered
	const openOnNewRoute = useRef(false);

	const goTo = (href: string) => {
		router.prefetch(href);
		const closing = closeCurtains(() => {
			openOnNewRoute.current = true;
			router.push(href);
		});
		if (!closing) router.push(href);
	};

	useEffect(() => {
		if (!openOnNewRoute.current) return;
		openOnNewRoute.current = false;
		// Timer also keeps the state change outside the effect itself
		setTimeout(() => openCurtains(ROUTE_OPEN_MS), ROUTE_OPEN_DELAY_MS);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	return (
		<StageContext.Provider
			value={{
				curtainsOpen: animationStage === "idle",
				goTo,
			}}
		>
			<div className="relative h-screen overflow-clip">
				<button
					onClick={() => setNavOpen((open) => !open)}
					aria-expanded={navOpen}
					aria-controls="nav"
					aria-label={navOpen ? "Close menu" : "Open menu"}
					className="fixed top-[0.5vh] right-[0.5vw] text-[4vh] font-extrabold cursor-pointer z-[23] w-[3.5vw] h-[3.5vw] bg-white border-dashed border-[0.2vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
					?
				</button>

				{/* Backdrop behind the nav - fades in darker and slightly blurred,
			    and closes the nav when clicked */}
				<div
					onClick={() => setNavOpen(false)}
					aria-hidden
					className="fixed inset-0 z-[21] bg-black/20 backdrop-blur-[1px] transition-opacity duration-700"
					style={{
						opacity: navOpen ? 1 : 0,
						pointerEvents: navOpen ? "auto" : "none",
					}}
				/>

				{/* Nav - header.png's bottom rests 10vh above the bottom of the page.
			    Closed, it's pushed up by 90vh so it sits fully above the screen.
			    Sits above the curtains, buttons (z-20) and backdrop (z-21),
			    under the "?" (z-23) */}
				<nav
					id="nav"
					inert={!navOpen}
					className={`fixed inset-x-0 bottom-[10vh] z-[22] drop-shadow-lg drop-shadow-black/40 ${navOpen ? "test-shadow-darker" : ""}`}
					style={{
						transition: "transform 700ms cubic-bezier(0.34, 1.1, 0.64, 1)",
						transform: navOpen ? "translateY(0)" : "translateY(-90vh)",
					}}
				>
					<img src="/imgs/header.webp" className="w-screen block" alt="" />

					{/* Nav content - sits in the solid area above the curtain swags */}
					<div className="absolute inset-x-0 bottom-[55%] flex flex-col items-center gap-[2vh] text-[3vh]">
						<p className="pt-serif text-center max-w-[50vw]">
							Some text about the site goes here.
						</p>
						<div className="flex gap-[3vw]">
							<a href="#" className="underline hover:no-underline">
								Link one
							</a>
							<a href="#" className="underline hover:no-underline">
								Link two
							</a>
							<a href="#" className="underline hover:no-underline">
								Link three
							</a>
						</div>
					</div>
				</nav>

				{/* Normal open state */}
				<img
					src="/imgs/open.webp"
					className="w-screen h-screen top-0 left-0 fixed z-10 pointer-events-none scene-shadow"
					style={{
						visibility: animationStage === "idle" ? "visible" : "hidden",
					}}
					alt=""
				/>

				{/* Closed curtains until the ticket is clicked and the opening frames load */}
				{animationStage === "loading" && (
					<img
						src="/imgs/closed.webp"
						className="w-screen h-screen top-0 left-0 fixed z-30"
						alt=""
					/>
				)}

				{/* Ticket - click it to open the curtains and enter */}
				{ticket !== "gone" && (
					<button
						onClick={enter}
						disabled={ticket === "ripping"}
						className={`fixed top-[40vh] left-[20vw] z-40 cursor-pointer disabled:cursor-default drop-shadow-lg drop-shadow-black/60 test-shadow-darkest ${ticket === "waiting" ? "ticket-shake" : ""}`}
						aria-label="Enter"
					>
						<img
							src="/imgs/ticket2.webp"
							className="w-[50vw] block"
							style={{
								visibility: ticket === "ripping" ? "hidden" : "visible",
							}}
							alt=""
						/>
						{/* Ripping frames are drawn here, over the same spot */}
						<canvas
							ref={ripCanvasRef}
							className="absolute inset-0 w-full h-full"
						/>
					</button>
				)}

				{/* Closing / opening animation - always on screen (transparent when
			    idle) so a click only has to draw, not show/hide anything */}
				<canvas
					ref={canvasRef}
					className="w-screen h-screen top-0 left-0 fixed z-30 pointer-events-none scene-shadow"
				/>

				{/* Content - no z-index here, so it doesn't form a stacking context:
			    curtains (z-10) sit above it, buttons (z-20) sit above curtains,
			    and the animation (z-30) covers everything */}
				<div className="bg-white/0 border-2 border-black/0 w-[65vw] h-[75vh] mx-auto top-[25vh] relative">
					{children}
				</div>

				{/* Background */}
				<div className="-z-10 fixed top-0 left-0 h-screen w-screen">
					<img
						src="/imgs/paper-bg-2560.webp"
						alt=""
						className="w-full h-full object-cover opacity-60"
					/>
				</div>
			</div>
		</StageContext.Provider>
	);
}
