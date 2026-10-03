"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Page1 from "@/components/Page1";
import Page2 from "@/components/Page2";
import Page3 from "@/components/Page3";

const ANIMATION_MS = 700;

const frames = (name: string, count: number) =>
	Array.from(
		{ length: count },
		(_, i) => `/imgs/${name}/${String(i).padStart(2, "0")}.webp`,
	);

const CLOSING_FRAMES = frames("closing", 10);
const OPENING_FRAMES = frames("opening", 12);

export default function Home() {
	const [currentPage, setCurrentPage] = useState(0);

	// Starts "loading": closed curtains cover the page until the opening
	// frames are decoded, then they open
	const [animationStage, setAnimationStage] = useState<
		"loading" | "idle" | "closing" | "opening"
	>("loading");

	const pages = [Page1, Page2, Page3];

	const CurrentPage = pages[currentPage];

	// The GIFs are too big for browsers to animate reliably, so they're
	// split into frames (public/imgs/closing, public/imgs/opening). Every
	// frame is decoded up front and drawn to a canvas, so playback starts
	// the instant the button is clicked.
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

	const playFrames = (frames: ImageBitmap[], onDone: () => void) => {
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
		}, ANIMATION_MS / frames.length);
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
			// Open the curtains on page load
			setAnimationStage("opening");
			playFrames(b, () => setAnimationStage("idle"));
		});

		return () => {
			cancelled = true;
			if (frameTimer.current) clearInterval(frameTimer.current);
		};
	}, []);

	const goToPage = (delta: number) => {
		const target = currentPage + delta;
		if (target < 0 || target >= pages.length || animationStage !== "idle") {
			return;
		}

		const { closing, opening } = bitmaps.current;
		if (!closing.length || !opening.length) return;

		// Curtains close
		setAnimationStage("closing");
		playFrames(closing, () => {
			// Swap the page while closed, then open
			setCurrentPage(target);
			setAnimationStage("opening");
			playFrames(opening, () => {
				setAnimationStage("idle");
			});
		});
	};

	const nextPage = () => goToPage(1);

	const previousPage = () => goToPage(-1);

	return (
		<div className="relative h-screen overflow-clip">
			<div className="fixed top-[0.5vh] right-[0.5vw] text-[4vh] font-extrabold cursor-pointer z-20 w-[3.5vw] h-[3.5vw] bg-white border-dashed border-[0.2vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60">
				?
			</div>

			{/* Normal open state */}
			<img
				src="/imgs/open.png"
				className="w-screen h-screen top-0 left-0 fixed z-10 pointer-events-none scene-shadow"
				style={{
					visibility: animationStage === "idle" ? "visible" : "hidden",
				}}
				alt=""
			/>

			{/* Closed curtains while the opening frames load */}
			{animationStage === "loading" && (
				<img
					src="/imgs/closed.png"
					className="w-screen h-screen top-0 left-0 fixed z-30"
					alt=""
				/>
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
				<CurrentPage
					nextPage={nextPage}
					previousPage={previousPage}
					currentPage={currentPage}
					totalPages={pages.length}
					curtainsOpen={animationStage === "idle"}
				/>
			</div>

			{/* Background */}
			<div className="-z-10 fixed top-0 left-0 h-screen w-screen">
				<img
					src="/imgs/paper-bg-2560.jpg"
					alt=""
					className="w-full h-full object-cover opacity-60"
				/>
			</div>
		</div>
	);
}
