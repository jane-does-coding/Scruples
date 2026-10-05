"use client";

import { useEffect, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import type { Frame } from "@/lib/frames";

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

	// Everything comes in once the curtains have opened, and stays put while
	// they close again on the way out
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

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
					src={frame.src}
					className={`${tall ? "max-h-[65vh] top-[-3vh]" : "max-h-[45vh]"} max-w-[40vw] test-shadow z-2 relative`}
					alt={`${frame.label} by ${frame.artist}, in a picture frame`}
				/>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] left-[3vw] absolute z-1"></span>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] right-[3vw] absolute z-1"></span>
			</div>

			{/* Doll */}
			{/* 	<img
				src={"/imgs/doll2.png"}
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
					src="/imgs/popsicle-stick.webp"
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
