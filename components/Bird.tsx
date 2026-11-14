"use client";

import { useEffect, useRef } from "react";
import { asset } from "@/lib/asset";

const FLIGHT: [x: number, y: number, facing: 1 | -1][] = [
	[95, -20, 1],
	[60, -30, 1],
	[30, -10, 1],
	[8, 8, 1],
	[8, 8, -1],
	[30, 18, -1],
	[60, 6, -1],
	[78, -22, -1],
	[78, -22, 1],
	[50, -36, 1],
	[22, -24, 1],
	[0, -8, 1],
	[0, 0, 1],
];

export default function Bird({
	flying,
	onClick,
}: {
	flying: boolean;
	onClick: () => void;
}) {
	const ref = useRef<HTMLDivElement>(null);
	useEffect(() => {
		const el = ref.current;
		if (!el || !flying) return;
		if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
			el.style.visibility = "visible";
			return;
		}
		el.style.visibility = "visible";
		const last = FLIGHT.length - 1;
		const flight = el.animate(
			FLIGHT.map(([x, y, facing], i) => ({
				transform: `translate(${x}vw, ${y}svh) scaleX(${facing})`,
				offset: i / last,
				easing: "ease-in-out",
			})),
			{ duration: 7000, fill: "backwards" },
		);
		const bob = el.firstElementChild?.animate(
			[
				{ transform: "translateY(0) rotate(-4deg)" },
				{ transform: "translateY(-1.2svh) rotate(4deg)" },
				{ transform: "translateY(0) rotate(-4deg)" },
			],
			{ duration: 420, iterations: Math.round(7000 / 420) },
		);
		return () => {
			flight.cancel();
			bob?.cancel();
		};
	}, [flying]);

	return (
		<div
			ref={ref}
			className="absolute z-6 pointer-events-none left-[78%] top-[-8.3svh] portrait:top-[-6.5svh]"
			style={{ visibility: "hidden" }}
		>
			<div className="relative">
				<span
					aria-hidden
					data-string
					className="absolute w-[0.1vw] min-w-px bg-black/60 h-[200svh] bottom-[calc(100%-2svh)] left-[45%]"
				/>
				<img
					role="button"
					tabIndex={0}
					onClick={(e) => {
						e.stopPropagation();
						onClick();
					}}
					onKeyDown={(e) => {
						if (e.key !== "Enter" && e.key !== " ") return;
						e.preventDefault();
						e.stopPropagation();
						onClick();
					}}
					src={asset("/imgs/stage/bird.webp")}
					className="relative h-[11svh] portrait:h-[7svh] w-auto max-w-none test-shadow-darker pointer-events-auto cursor-pointer"
					alt="A little bird on a string"
				/>
			</div>
		</div>
	);
}
