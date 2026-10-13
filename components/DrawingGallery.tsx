"use client";

import { useEffect, useState } from "react";
import { useStage } from "@/components/Stage";
import { useDrawings } from "@/lib/drawings";

// /gallery - every drawing from Page 6 on one wall, newest first, each in
// its frame with who drew it and when. Opened from the last page

const LABEL =
	"text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";

const when = (ms: number) =>
	ms
		? new Date(ms).toLocaleDateString(undefined, {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: "";

export default function DrawingGallery() {
	const { curtainsOpen, goTo } = useStage();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);
	const drawings = useDrawings();
	const onlySamples = drawings.every((d) => d.id.startsWith("sample"));

	return (
		<div className="h-full">
			{/* Title - hangs in at the top */}
			<h1
				className={`absolute top-[-2svh] left-[50%] -translate-x-[50%] w-max text-[4svh] portrait:text-[2.8svh] z-[9] ${LABEL}`}
				style={{
					visibility: shown ? "visible" : "hidden",
					transition: "transform 800ms cubic-bezier(0.34, 1.25, 0.64, 1)",
					transform: shown ? "translateY(0)" : "translateY(-110svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] right-0 absolute"></span>
				Everyone&apos;s drawings
			</h1>

			{/* The wall - scrolls if there are more than fit. Rises in */}
			<div
				className="absolute inset-x-0 top-[8svh] bottom-0 overflow-y-auto overscroll-contain px-[1vw] pb-[6svh]"
				style={{
					opacity: shown ? 1 : 0,
					transition: "opacity 600ms ease 300ms",
				}}
			>
				<ul className="grid grid-cols-4 portrait:grid-cols-2 gap-[3svh] portrait:gap-[3vw] items-start">
					{drawings.map((drawing) => (
						<li
							key={drawing.id}
							className="flex flex-col items-center gap-[1svh]"
						>
							<img
								src={drawing.image}
								className="w-full h-auto test-shadow-darker"
								alt={`A drawing by ${drawing.by.toLowerCase()}, in a picture frame`}
							/>
							<p className={`text-[2svh] portrait:text-[1.7svh] ${LABEL}`}>
								{drawing.by}
								{drawing.madeAt ? ` · ${when(drawing.madeAt)}` : ""}
							</p>
						</li>
					))}
				</ul>

				{/* Nothing drawn here yet - just Daphne's */}
				{onlySamples && (
					<p className="mt-[4svh] text-center text-[3svh] portrait:text-[2.3svh]">
						<a
							href="/page6"
							onClick={(e) => {
								if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
									return;
								e.preventDefault();
								goTo("/page6");
							}}
							className="inline-block bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[2.5vw] py-[0.5svh] cursor-pointer"
						>
							No drawings yet - go make one {"->"}
						</a>
					</p>
				)}
			</div>
		</div>
	);
}
