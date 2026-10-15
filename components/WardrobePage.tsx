"use client";

import { useEffect, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import { HATS, type HatId } from "@/lib/shop";

// /wardrobe - trying on the hats from the mystery box. Zhenya drops in on
// the left; the hats hang in on the right. Clicking a hat puts it on her
// (clicking it again, or "No hat", takes it off); "Save" keeps it and goes
// back to the page you came from, "Cancel" (or Back) goes back without
// changing it

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const LABEL =
	"relative text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

// Zhenya - like on Page 1, a little bigger and further right
const DOLL =
	"h-[103svh] absolute top-[-32svh] left-[calc(2svh+2vw)] portrait:h-[66svh] portrait:top-[-10svh] portrait:left-[-16vw] max-w-none";

// A label's two hanging strings
const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
	</>
);

// Hangs something in from the top once shown
const hang = (
	shown: boolean,
	{ ms = 800, easing = LABEL_DROP, delay = 0 } = {},
) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform ${ms}ms ${easing} ${shown ? delay : 0}ms`,
	transform: shown ? "translateY(0)" : "translateY(-120svh)",
});

export default function WardrobePage() {
	const { curtainsOpen, goTo, goBack, owned, wearing, equip } = useStage();
	const dollSrc = useBlinkingDoll();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	// The hat being tried on - starts as the one she has on
	const [trying, setTrying] = useState(wearing);
	const hasHats = owned.includes("hats");

	return (
		<div className="h-full">
			<h1 className="sr-only">Zhenya&apos;s hats</h1>

			{/* Zhenya, and the hat she's trying on (no shadow of its own) */}
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={dollSrc}
				className={`${DOLL} test-shadow z-5`}
				style={hang(shown, { ms: 900, easing: DOLL_DROP })}
				alt={
					trying
						? `Zhenya, a marionette doll on strings, wearing the ${HATS[trying].name.toLowerCase()}`
						: "Zhenya, a marionette doll on strings"
				}
			/>
			{trying && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					key={trying}
					src={HATS[trying].wear}
					className={`${DOLL} z-5 pointer-events-none hat-on`}
					style={hang(shown, { ms: 900, easing: DOLL_DROP })}
					alt=""
					aria-hidden
				/>
			)}

			{/* On the right: the title, the hats two by two, "No hat", then Save and
			    Cancel - each hanging on its own strings, dropping in one after
			    another. Higher things sit in front, so the strings of the ones
			    below run behind them */}
			<div className="absolute z-6 top-[1svh] right-[5vw] portrait:top-[37svh] portrait:right-auto portrait:left-[50%] portrait:translate-x-[-50%] flex flex-col items-center gap-[2.2svh] portrait:gap-[1.5svh]">
				<h2
					className={`${LABEL} text-[4svh] portrait:text-[2.8svh]`}
					style={{ ...hang(shown, { delay: 300 }), zIndex: 9 }}
				>
					<Strings />
					{hasHats ? "Try on a hat" : "No hats yet"}
				</h2>

				{hasHats ? (
					<>
						<ul className="relative z-[8] grid grid-cols-2 portrait:grid-cols-4 gap-[1.5vw] portrait:gap-[2vw]">
							{(Object.keys(HATS) as HatId[]).map((id, i) => (
								<li
									key={id}
									className="relative"
									style={{
										...hang(shown, { delay: 500 + i * 120 }),
										zIndex: 6 - i,
									}}
								>
									<button
										onClick={() => setTrying((t) => (t === id ? null : id))}
										aria-pressed={trying === id}
										aria-label={HATS[id].name}
										className={`relative w-[calc(14svh+1vw)] h-[calc(14svh+1vw)] portrait:w-[16vw] portrait:h-[16vw] flex items-center justify-center p-[1svh] bg-white border-black cursor-pointer drop-shadow-md drop-shadow-black/40 border-[0.3svh] ${trying === id ? "" : "border-dashed"}`}
									>
										<Strings />
										{/* eslint-disable-next-line @next/next/no-img-element */}
										<img
											src={HATS[id].image}
											className="max-w-full max-h-full w-auto h-auto"
											alt=""
										/>
									</button>
								</li>
							))}
						</ul>
						{/* No hat at all - picked like a hat (solid border when it is) */}
						<button
							onClick={() => setTrying(null)}
							aria-pressed={!trying}
							className={`${BUTTON.replace(" border-dashed", "")} ${trying ? "border-dashed" : ""} self-stretch text-[3svh] portrait:text-[2.3svh]`}
							style={{ ...hang(shown, { delay: 1100 }), zIndex: 7 }}
						>
							<Strings />
							No hat
						</button>
						<div
							className="relative z-[6] flex gap-[1.5vw] portrait:gap-[3vw]"
							style={hang(shown, { delay: 1300 })}
						>
							<button
								onClick={() => {
									equip(trying);
									goBack();
								}}
								className={`${BUTTON} text-[4svh] portrait:text-[2.8svh]`}
							>
								<Strings />
								Save
							</button>
							<button
								onClick={goBack}
								className={`${BUTTON} text-[4svh] portrait:text-[2.8svh]`}
							>
								<Strings />
								Cancel
							</button>
						</div>
					</>
				) : (
					// Came here without them (e.g. straight from a link)
					<a
						href="/page3"
						onClick={(e) => {
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
								return;
							e.preventDefault();
							goTo("/page3");
						}}
						className={`${BUTTON} block max-w-[30vw] portrait:max-w-[80vw] text-[3svh] portrait:text-[2.3svh]`}
						style={{ ...hang(shown, { delay: 500 }), zIndex: 8 }}
					>
						<Strings />
						They come in the mystery box from the souvenir shop {"->"}
					</a>
				)}
			</div>

			{/* Back - on a popsicle stick in the bottom-left corner, like on the
			    painting pages, but a little lower and further left, out of
			    Zhenya's way. Rises in from the bottom */}
			<PopsicleButton
				onClick={goBack}
				side="left"
				className="portrait:hidden"
				style={{
					visibility: shown ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP} ${shown ? 1400 : 0}ms`,
					transform: shown ? "translateY(0)" : "translateY(100svh)",
					left: "-4vw",
					bottom: "-3svh",
				}}
			>
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
