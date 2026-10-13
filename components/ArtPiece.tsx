"use client";

import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import type { Frame } from "@/lib/frames";
import { asset } from "@/lib/asset";

const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

// Slides in from off-screen once `shown`, after `delay` ms
const slideIn = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	transition: `transform 900ms ${DROP} ${shown ? delay : 0}ms`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-100vh" : "100vh"})`,
});

// A single painting's page, opened by clicking its frame in the marquee
export default function ArtPiece({ frame }: { frame: Frame }) {
	const { goTo, curtainsOpen } = useStage();
	const tall = frame.size === "tall";
	// "The Starry Night • 1889" → "1889"
	const year = frame.label.split(" • ")[1];

	// Everything comes in once the curtains have opened, and stays put while
	// they close again on the way out
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	// How wide the painting is on screen, so the cards either side of it sit
	// just clear of it whatever its size (tall, wide or extra wide)
	const paintingRef = useRef<HTMLImageElement>(null);
	const [paintingWidth, setPaintingWidth] = useState(0);
	const measurePainting = () => {
		const width = paintingRef.current?.getBoundingClientRect().width ?? 0;
		if (width) setPaintingWidth(width);
	};
	// Measured when it loads, and again whenever the window changes size
	useEffect(() => {
		const timer = setTimeout(measurePainting, 0);
		window.addEventListener("resize", measurePainting);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("resize", measurePainting);
		};
	}, []);
	// Half the painting plus a gap, from the middle of the page; and each
	// card's width: up to 19vw, less if the painting leaves less room (they
	// stay 3vw from the screen's edges, hanging in front of the curtains)
	const clear = `(${paintingWidth / 2}px + 2vw)`;
	const cardWidth = `min(19vw, calc(50vw - ${clear} - 3vw))`;

	return (
		<div className="h-full flex flex-col items-center justify-center gap-[2vh]">
			{/* Tall frames sit 5vw in from the left, 2vh higher, and can be
			    taller (60vh) than the wide ones (50vh) */}
			{/* Painting drops in from the top */}
			<div
				className={`absolute ${tall ? "top-[-6vh] left-[50%] translate-x-[-50%] scale-y-90" : "top-[-2vh] left-[50%] translate-x-[-50%]"}`}
				style={slideIn(shown, "top")}
			>
				<img
					ref={paintingRef}
					onLoad={measurePainting}
					src={frame.src}
					className={`${tall ? "max-h-[65vh] top-[-3vh]" : "max-h-[45vh]"} max-w-[40vw] test-shadow z-2 relative`}
					alt={`${frame.label} by ${frame.artist}, in a picture frame`}
				/>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] left-[3vw] absolute z-1"></span>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] right-[3vw] absolute z-1"></span>
			</div>

			{/* About the painting - hangs on the left of it, just after it */}
			<div
				className="absolute top-[-4vh] bg-white border-[0.2vh] border-black px-[1vw] py-[1.2vh] test-shadow z-[11]"
				style={{
					right: `calc(50% + ${clear})`,
					width: cardWidth,
					...slideIn(shown && paintingWidth > 0, "top", 300),
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] left-[1vw] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] right-[1vw] absolute"></span>
				<h2 className="text-[2.6vh] mb-[0.8vh]">About it</h2>
				<dl className="text-[1.9vh] leading-snug flex flex-col gap-[1vh]">
					{(
						[
							["Painted in", year],
							["Made with", frame.details.medium],
							["Size", frame.details.size],
							["Where it is", frame.details.where],
						] as const
					).map(([term, value]) => (
						<div key={term}>
							<dt className="underline decoration-dashed underline-offset-4">
								{term}
							</dt>
							<dd>{value}</dd>
						</div>
					))}
				</dl>
			</div>

			{/* Fun facts - hang on the right of it, a moment later */}
			<div
				className="absolute top-[-4vh] bg-white border-[0.2vh] border-black px-[1vw] py-[1.2vh] test-shadow z-[11]"
				style={{
					left: `calc(50% + ${clear})`,
					width: cardWidth,
					...slideIn(shown && paintingWidth > 0, "top", 450),
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] left-[1vw] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100vh] top-[-100vh] right-[1vw] absolute"></span>
				<h2 className="text-[2.6vh] mb-[0.8vh]">Fun facts</h2>
				<ul className="text-[1.9vh] leading-snug flex flex-col gap-[1vh] list-['*_'] pl-[1.2vw]">
					{frame.facts.map((fact) => (
						<li key={fact}>{fact}</li>
					))}
				</ul>
			</div>

			{/* Doll */}
			{/* 	<img
				src={asset("/imgs/doll2.png")}
				className="h-[80vh] absolute top-[-30vh] right-[-6vw] test-shadow-darker z-5 -scale-x-[1]"
				alt=""
			/> */}

			{/* Labels rise in from the bottom */}
			<div
				className="absolute bottom-[6vh] right-[-3vw] test-shadow"
				style={slideIn(shown, "bottom", 200)}
			>
				<h1 className="border-[0.2vh] bg-white px-[1.5vw] py-[1vh] text-[3vh] text-center relative z-2 w-fit mx-auto">
					{frame.label}
				</h1>
				<p className="border-[0.2vh] bg-white px-[1.5vw] py-[1vh] text-[3vh] text-center relative z-2 mt-[2vh] w-fit mx-auto">
					by {frame.artist}
				</p>
				{/* popsicle-stick.png is popsicle.png trimmed to just the stick, so
				    w-/h- here are the stick's real size */}
				<img
					src={asset("/imgs/popsicle-stick.webp")}
					className="absolute w-[2.3vw] h-[38vh] max-w-none bottom-[-19vh] left-[50%] -translate-x-[50%] z-0"
					alt="Wooden popsicle stick holding up the labels"
				/>
			</div>

			<PopsicleButton
				onClick={() => goTo("/page2")}
				side="left"
				style={slideIn(shown, "bottom", 400)}
			>
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
