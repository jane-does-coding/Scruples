"use client";
import Strings from "@/components/Strings";

import { useEffect, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import type { Frame } from "@/lib/frames";
import { asset } from "@/lib/asset";

const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const slideIn = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	transition: `transform 900ms ${DROP} ${shown ? delay : 0}ms`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-100svh" : "100svh"})`,
});

export default function ArtPiece({ frame }: { frame: Frame }) {
	const { curtainsOpen, goTo } = useStage();
	const tall = frame.size === "tall";
	const year = frame.label.split(" • ")[1];

	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const strings = (
		<>
			<Strings inset="1vw" />
		</>
	);
	const CARD =
		"relative bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.7svh] test-shadow text-[1.8svh] portrait:text-[1.45svh] leading-snug";

	return (
		<div className="h-full flex flex-col items-center justify-center gap-[2svh]">
			<div
				className={`absolute ${tall ? "top-[-3svh] scale-y-90" : "top-[-1svh]"} left-[16.5vw] portrait:left-[50%] translate-x-[-50%] portrait:top-[-4svh]`}
				style={slideIn(shown, "top")}
			>
				<img
					src={frame.src}
					data-panel
					className={`${tall ? "max-h-[56svh]" : "max-h-[40svh]"} max-w-[30vw] portrait:max-h-[24svh] portrait:max-w-[80vw] test-shadow z-2 relative`}
					alt={`${frame.label} by ${frame.artist}, in a picture frame`}
				/>
				<Strings inset="3vw" className="z-1" />
			</div>

			<div className="absolute z-3 top-0 left-[34.5vw] w-[28vw] flex flex-col gap-[1svh] portrait:top-[32.5svh] portrait:left-[4vw] portrait:w-[92vw] portrait:gap-[1.2svh]">
				<div
					className={CARD}
					style={{ ...slideIn(shown, "top", 300), zIndex: 6 }}
				>
					{strings}
					<h2 className="text-[2.6svh] portrait:text-[2svh] mb-[0.6svh]">
						About it
					</h2>
					<dl className="grid grid-cols-2 gap-x-[1.5vw] portrait:gap-x-[4vw] gap-y-[0.8svh]">
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

				<div className="flex flex-col gap-[1svh] portrait:grid portrait:grid-cols-2 portrait:items-start portrait:gap-[2vw]">
					<h2
						className={`${CARD} self-start portrait:col-span-2 portrait:justify-self-start text-[2.6svh] portrait:text-[2svh]`}
						style={{ ...slideIn(shown, "top", 450), zIndex: 5 }}
					>
						{strings}
						Fun facts
					</h2>
					{frame.facts.map((fact, i) => (
						<p
							key={fact}
							className={CARD}
							style={{ ...slideIn(shown, "top", 600 + i * 150), zIndex: 4 - i }}
						>
							{strings}
							{fact}
						</p>
					))}
				</div>
			</div>

			<PopsicleButton
				onClick={() => goTo("/zhenya-likes-art")}
				href="/zhenya-likes-art"
				side="left"
				className="portrait:hidden"
				style={{ ...slideIn(shown, "bottom", 400), left: "-2vw" }}
			>
				{"<-"} Back
			</PopsicleButton>

			<div
				className="absolute bottom-[4svh] left-[23vw] translate-x-[-50%] w-max max-w-[21vw] portrait:max-w-[90vw] portrait:bottom-auto portrait:top-[21.5svh] portrait:left-[50%] test-shadow"
				style={slideIn(shown, "bottom", 200)}
			>
				<h1 className="border-[0.2svh] border-black bg-white px-[1.5vw] portrait:px-[3vw] py-[0.5svh] text-[3svh] portrait:text-[2.3svh] text-center relative z-2 w-fit mx-auto">
					{frame.label}
				</h1>
				<p className="border-[0.2svh] border-black bg-white px-[1.5vw] portrait:px-[3vw] py-[0.5svh] text-[3svh] portrait:text-[2.3svh] text-center relative z-2 mt-[1.5svh] portrait:mt-[1svh] w-fit mx-auto">
					by {frame.artist}
				</p>
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2.3vw] portrait:hidden h-[38svh] max-w-none bottom-[-19svh] left-[50%] translate-x-[-50%] z-0"
					alt="Wooden popsicle stick holding up the labels"
				/>
			</div>
		</div>
	);
}
