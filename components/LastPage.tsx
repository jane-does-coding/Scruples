"use client";

import { useEffect, useState } from "react";
import { useStage } from "@/components/Stage";
import { asset } from "@/lib/asset";
import { loadCompetitor } from "@/lib/competitor";
import { useDrawings } from "@/lib/drawings";
import { STORY_PAGES } from "@/lib/pages";
import { formatPlaytime, loadPlaytime } from "@/lib/playtime";
import { HATS, ITEMS } from "@/lib/shop";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import Zhenya from "@/components/Zhenya";


const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const LABEL =
	"text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

const COLLECTIBLE = Object.keys(ITEMS).filter((item) => item !== "hats");
const CHARACTERS = 2;
const PAGE_COUNT = STORY_PAGES.length + 1;

type Stat = [value: string, label: string];

const DROP_STAGGER_MS = 300;
const LIFT_STAGGER_MS = 100;
const PART_ITEMS = 6;
const LIFT_AWAY_MS = (PART_ITEMS - 1) * LIFT_STAGGER_MS + 800;

const Strings = () => (
	<>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
	</>
);

const hang = (
	shown: boolean,
	from: "top" | "bottom",
	{ ms = 800, easing = LABEL_DROP, delay = 0 } = {},
) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform ${ms}ms ${easing} ${shown ? delay : 0}ms`,
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-110svh" : "110svh"})`,
});

export default function LastPage() {
	const { curtainsOpen, goTo, owned, money, reached } = useStage();
	const dollSrc = useBlinkingDoll();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const [seconds, setSeconds] = useState(0);
	useEffect(() => {
		if (!shown) return;
		const timer = setTimeout(() => setSeconds(loadPlaytime()), 0);
		return () => clearTimeout(timer);
	}, [shown]);
	const entry = shown ? loadCompetitor().entry : undefined;
	const collected = new Set(
		owned.map((item) => (item === "hats" ? "mystery-box" : item)),
	).size;
	const made = useDrawings().filter((d) => !d.id.startsWith("sample")).length;
	const met = reached >= 5 ? 2 : 1;
	const hats = owned.includes("hats") ? Object.keys(HATS).length : 0;
	const STATS: { title: string; lines: Stat[] }[] = [
		{
			title: "Your stats",
			lines: [
				[`${collected}/${COLLECTIBLE.length}`, "items collected"],
				[`$${money}`, "total money"],
				[`${hats}/${Object.keys(HATS).length}`, "hats unlocked"],
				[`${made}`, made === 1 ? "drawing made" : "drawings made"],
			],
		},
		{
			title: "Your stats",
			lines: [
				[`${met}/${CHARACTERS}`, "characters met"],
				[
					`${Math.min(reached, PAGE_COUNT)}/${PAGE_COUNT}`,
					"pages visited",
				],
				entry === "magic"
					? ["1st", "in the competition"]
					: entry === "yours"
						? ["0", "competition wins"]
						: ["0", "paintings entered"],
				[formatPlaytime(seconds), "spent at the theatre"],
			],
		},
	];

	const [part, setPart] = useState(0);
	const [turned, setTurned] = useState(false);
	const next = () => {
		setTurned(true);
		setPart((p) => (p + 1) % STATS.length);
	};
	const place = (p: number, i: number) => {
		const up = shown && p === part;
		return {
			zIndex: 8 - i,
			transition: `transform 800ms ${LABEL_DROP} ${
				up
					? (turned ? LIFT_AWAY_MS : 400) + i * DROP_STAGGER_MS
					: i * LIFT_STAGGER_MS
			}ms`,
			transform: up ? "translateY(0)" : "translateY(-110svh)",
		};
	};

	const drawings = useDrawings();
	const loop = drawings.length
		? Array.from(
				{ length: Math.max(5, drawings.length) },
				(_, i) => drawings[i % drawings.length],
			)
		: [];

	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="sr-only">Curtain call</h1>

			<Zhenya
				src={dollSrc}
				className="h-svh w-auto max-w-none absolute top-[-30svh] left-[-12vw] portrait:hidden test-shadow-darker z-5"
				style={hang(shown, "top", { ms: 900, easing: DROP })}
				alt="Zhenya, a marionette doll on strings"
			/>

			{STATS.map(({ title, lines }, p) => (
				<section
					key={p}
					aria-hidden={p !== part}
					className="absolute top-[-3svh] portrait:top-[1svh] left-[28%] portrait:left-[8vw] w-[38%] portrait:w-[55vw] flex flex-col items-center gap-[2svh] portrait:gap-[1.5svh] pointer-events-none"
				>
					<h2
						className={`relative w-max max-w-full text-[4svh] portrait:text-[2.8svh] ${LABEL}`}
						style={place(p, 0)}
					>
						<Strings />
						{title}
					</h2>
					<div className="grid grid-cols-2 gap-[1.8svh] portrait:gap-[1.5svh] w-full">
						{lines.map(([value, label], i) => (
							<p
								key={i}
								className={`relative flex flex-col items-center justify-center gap-[0.6svh] min-h-[15svh] portrait:min-h-[12svh] ${LABEL} border-[0.3svh]`}
								style={place(p, i + 1)}
							>
								<Strings />
								<span className="text-[6svh] portrait:text-[4svh] leading-none whitespace-nowrap">
									{value}
								</span>
								<span className="text-[2.4svh] portrait:text-[1.8svh] leading-tight text-black/70">
									{label}
								</span>
							</p>
						))}
					</div>
					<button
						onClick={next}
						disabled={p !== part}
						tabIndex={p === part ? undefined : -1}
						className={`relative w-max text-[3svh] portrait:text-[2.3svh] pointer-events-auto disabled:pointer-events-none ${BUTTON}`}
						style={place(p, lines.length + 1)}
					>
						<Strings />
						{p < STATS.length - 1 ? "next ->" : "<- back"}
					</button>
				</section>
			))}

			<div
				className="absolute top-[-25svh] right-[calc(3%)] portrait:top-[-20svh] portrait:right-[1vw] w-[26svh] portrait:w-[33vw] h-svh test-shadow-darker"
				style={{
					opacity: shown ? 1 : 0,
					transition: "opacity 700ms ease 200ms",
				}}
			>
				<span className="w-[0.1vw] min-w-px bg-black/60 h-full top-0 left-[15%] absolute"></span>
				<span className="w-[0.1vw] min-w-px bg-black/60 h-full top-0 right-[15%] absolute"></span>
				{loop.length > 0 && (
					<div
						className="flex flex-col marquee-up hover-pause"
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

			<div className="absolute top-[-5vh] bottom-0 right-[calc(3%)] portrait:right-[1vw] w-[26svh] portrait:w-[33vw] z-9 pointer-events-none">
				<p
					className={`absolute top-[4svh] portrait:top-[5svh] left-[50%] translate-x-[-50%] w-max max-w-[30svh] portrait:max-w-[33vw] text-[3svh] portrait:text-[2.3svh] pointer-events-auto ${LABEL}`}
					style={hang(shown, "top", { delay: 400 })}
				>
					<Strings />
					Drawings by visitors
				</p>
				<div
					className="absolute bottom-[4svh] left-[50%] translate-x-[-50%] pointer-events-auto test-shadow-darker"
					style={hang(shown, "bottom", { ms: 900, easing: DROP, delay: 600 })}
				>
					<img
						src={asset("/imgs/stage/popsicle-stick.webp")}
						className="absolute w-[2vw] portrait:w-[2.5svh] h-[30svh] max-w-none left-[50%] translate-x-[-50%] top-[60%] z-0"
						alt=""
						aria-hidden
					/>
					<a
						href="/gallery"
						onClick={(e) => {
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
								return;
							e.preventDefault();
							goTo("/gallery");
						}}
						className={`relative block w-max text-[3svh] portrait:text-[2.3svh] z-1 ${BUTTON}`}
					>
						See them all {"->"}
					</a>
				</div>
			</div>
		</div>
	);
}
