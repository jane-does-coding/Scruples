"use client";

import { useEffect, useState } from "react";
import { useStage } from "@/components/Stage";
import { asset } from "@/lib/asset";
import { useDrawings } from "@/lib/drawings";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import Zhenya from "@/components/Zhenya";

// The last page - a curtain call. On the left, the story's ending scrolls
// up a sentence at a time, the sentences threaded on two strings that stay
// still; on the right, everyone's drawings from Page 6 scroll up forever,
// with a label over them and a link to the full gallery under them. Both
// pause while the pointer is over them

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const LABEL =
	"text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

// The ending, in three parts: two of "The conclusion" (the story) and then
// "The final lesson". Each part's heading and sentences drop in one by one;
// "next" lifts them away one by one and drops in the next part
const ENDING = [
	{
		title: "The conclusion",
		lines: [
			"Zhenya came here just to look at art.",
			"Every painting was made by a person, stroke by stroke.",
			"Social media shares art with the whole world.",
			"But it can turn art into a contest of likes.",
		],
	},
	{
		title: "The conclusion",
		lines: [
			"The magic button makes perfect pictures, instantly.",
			"Daphne showed the picture was never the point.",
			"Zhenya's first drawing wasn't very good.",
			"But it was fun to make - and it was hers.",
		],
	},
	{
		title: "The final lesson",
		lines: [
			"Art is how someone sees the world.",
			"A hand-made drawing carries the hand that made it.",
			"Use any tools you like - just don't let them see for you.",
			"Every artist starts somewhere. Thanks for starting here.",
		],
	},
];
// Each part is its heading, its sentences and "next": they drop in this far
// apart, and lift away (top to bottom) this far apart
const DROP_STAGGER_MS = 300;
const LIFT_STAGGER_MS = 100;
// How long the last part takes to lift away (each lift is 800ms), so the
// next one waits for it
const PART_ITEMS = 6;
const LIFT_AWAY_MS = (PART_ITEMS - 1) * LIFT_STAGGER_MS + 800;

// A label's two hanging strings
const Strings = () => (
	<>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
	</>
);

// Hangs something in from the top (or up from the bottom) once shown
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
	const { curtainsOpen, goTo } = useStage();
	const dollSrc = useBlinkingDoll();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	// Which part of the ending is up, and whether "next" has been clicked
	// yet (after that, each part waits for the last one to lift away)
	const [part, setPart] = useState(0);
	const [turned, setTurned] = useState(false);
	const next = () => {
		setTurned(true);
		setPart((p) => (p + 1) % ENDING.length);
	};
	// Where the i-th thing in part p is: dropping in one by one when its part
	// is up, lifting away one by one when it's not. Earlier ones sit in
	// front, so the strings of the ones below run behind them (all under
	// the curtains, z-10)
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

	// At least 5 drawings per loop, so the column is always full: with only
	// a few, they repeat
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

			{/* Zhenya - on the very left, watching. Not on portrait screens,
			    where there's no room */}
			<Zhenya
				src={dollSrc}
				className="h-svh w-auto max-w-none absolute top-[-30svh] left-[-12vw] portrait:hidden test-shadow-darker z-5"
				style={hang(shown, "top", { ms: 900, easing: DROP })}
				alt="Zhenya, a marionette doll on strings"
			/>

			{/* The ending - in the middle, between Zhenya and the drawings, a
			    part at a time: its heading, then its sentences (in a column),
			    then "next", each dropping in on its own strings. All three parts sit in the same spot; only the one
			    that's up is on the stage */}
			{ENDING.map(({ title, lines }, p) => (
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
					<div className="flex flex-col gap-[1.8svh] portrait:gap-[1.5svh] w-full">
						{lines.map((line, i) => (
							<p
								key={line}
								className={`relative text-[3svh] portrait:text-[2.3svh] ${LABEL}`}
								style={place(p, i + 1)}
							>
								<Strings />
								{line}
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
						{p < ENDING.length - 1 ? "next ->" : "read it again"}
					</button>
				</section>
			))}

			{/* Everyone's drawings - a column on the right scrolling up forever,
			    in front of two still strings, like the posts on Page 4. Two
			    copies, so the loop is seamless */}
			<div
				className="absolute top-[-25svh] right-[calc(3%)] portrait:top-[-20svh] portrait:right-[1vw] w-[26svh] portrait:w-[33vw] h-svh test-shadow-darker"
				// Just fades in - dropping in while it's already scrolling
				// looked like a jump
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

			{/* The drawings' label hangs over the top of their column, and "See
			    them all" stands at the very bottom of it on a popsicle stick.
			    This box just lines them up with the column */}
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
					{/* The stick, going down off the bottom of the screen */}
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
