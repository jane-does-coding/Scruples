"use client";

import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import type { Frame } from "@/lib/frames";
import { asset } from "@/lib/asset";
import usePortrait from "@/components/usePortrait";

const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

// Slides in from off-screen once `shown`, after `delay` ms
const slideIn = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	transition: `transform 900ms ${DROP} ${shown ? delay : 0}ms`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-100svh" : "100svh"})`,
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
	// On portrait screens there's no room beside the painting: the painting
	// goes smaller at the top, its title under it, and the two cards side by
	// side below that
	const portrait = usePortrait();
	const aboutPlace = portrait
		? { left: "4vw", top: "39.5svh", width: "44vw" }
		: { right: `calc(50% + ${clear})`, width: cardWidth };
	const factsPlace = portrait
		? { left: "52vw", top: "39.5svh", width: "44vw" }
		: { left: `calc(50% + ${clear})`, width: cardWidth };

	return (
		<div className="h-full flex flex-col items-center justify-center gap-[2svh]">
			{/* Tall frames sit 5vw in from the left, 2svh higher, and can be
			    taller (60svh) than the wide ones (50svh) */}
			{/* Painting drops in from the top */}
			<div
				className={`absolute ${tall ? "top-[-6svh] left-[50%] translate-x-[-50%] scale-y-90" : "top-[-2svh] left-[50%] translate-x-[-50%]"} portrait:top-[-4svh]`}
				style={slideIn(shown, "top")}
			>
				<img
					ref={paintingRef}
					onLoad={measurePainting}
					src={frame.src}
					className={`${tall ? "max-h-[65svh] top-[-3svh]" : "max-h-[45svh]"} max-w-[40vw] portrait:max-h-[29svh] portrait:max-w-[80vw] portrait:top-0 test-shadow z-2 relative`}
					alt={`${frame.label} by ${frame.artist}, in a picture frame`}
				/>
				<span className="w-[0.1vw] bg-black/60 h-[30svh] top-[-25svh] left-[3vw] absolute z-1"></span>
				<span className="w-[0.1vw] bg-black/60 h-[30svh] top-[-25svh] right-[3vw] absolute z-1"></span>
			</div>

			{/* About the painting - hangs on the left of it, just after it */}
			<div
				className="absolute top-[-4svh] bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[1.2svh] test-shadow z-[11]"
				style={{
					...aboutPlace,
					...slideIn(shown && paintingWidth > 0, "top", 300),
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] left-[1vw] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] right-[1vw] absolute"></span>
				<h2 className="text-[2.6svh] portrait:text-[2svh] mb-[0.8svh]">About it</h2>
				<dl className="text-[1.9svh] portrait:text-[1.45svh] leading-snug flex flex-col gap-[1svh]">
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
				className="absolute top-[-4svh] bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[1.2svh] test-shadow z-[11]"
				style={{
					...factsPlace,
					...slideIn(shown && paintingWidth > 0, "top", 450),
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] left-[1vw] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] right-[1vw] absolute"></span>
				<h2 className="text-[2.6svh] portrait:text-[2svh] mb-[0.8svh]">Fun facts</h2>
				<ul className="text-[1.9svh] portrait:text-[1.45svh] leading-snug flex flex-col gap-[1svh] list-['*_'] pl-[1.2vw] portrait:pl-[3vw]">
					{frame.facts.map((fact) => (
						<li key={fact}>{fact}</li>
					))}
				</ul>
			</div>

			{/* Doll */}
			{/* 	<img
				src={asset("/imgs/doll2.png")}
				className="h-[80svh] absolute top-[-30svh] right-[-6vw] test-shadow-darker z-5 -scale-x-[1]"
				alt=""
			/> */}

			{/* Labels rise in from the bottom */}
			<div
				className="absolute bottom-[6svh] right-[-3vw] portrait:bottom-auto portrait:top-[27svh] portrait:right-auto portrait:left-[50%] portrait:-translate-x-[50%] portrait:w-max test-shadow"
				style={slideIn(shown, "bottom", 200)}
			>
				<h1 className="border-[0.2svh] bg-white px-[1.5vw] portrait:px-[3vw] py-[1svh] text-[3svh] portrait:text-[2.2svh] text-center relative z-2 w-fit mx-auto">
					{frame.label}
				</h1>
				<p className="border-[0.2svh] bg-white px-[1.5vw] portrait:px-[3vw] py-[1svh] text-[3svh] portrait:text-[2.2svh] text-center relative z-2 mt-[2svh] portrait:mt-[1svh] w-fit mx-auto">
					by {frame.artist}
				</p>
				{/* popsicle-stick.png is popsicle.png trimmed to just the stick, so
				    w-/h- here are the stick's real size */}
				<img
					src={asset("/imgs/popsicle-stick.webp")}
					className="absolute w-[2.3vw] h-[38svh] max-w-none bottom-[-19svh] left-[50%] -translate-x-[50%] z-0"
					alt="Wooden popsicle stick holding up the labels"
				/>
			</div>

			<PopsicleButton
				onClick={() => goTo("/page2")}
				href="/page2"
				side="left"
				// On portrait screens the cards need the room, and the round
				// "<-" in the corner goes back to the gallery too
				className="portrait:hidden"
				style={slideIn(shown, "bottom", 400)}
			>
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
