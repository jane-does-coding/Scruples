"use client";
import Strings, { LABEL, BUTTON } from "@/components/Strings";

import { useEffect, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import { HATS, type HatId } from "@/lib/shop";
import { asset } from "@/lib/asset";

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const EXTRAS = [
	{
		id: "pins",
		item: "pins",
		name: "Button pins",
		image: asset("/imgs/shop/buttons.webp"),
		wear: asset("/imgs/zhenya/badges-wear.webp"),
	},
	{
		id: "ribbon",
		item: "honorable-mention",
		name: "Honorable mention ribbon",
		image: asset("/imgs/awards/honorable-mention.webp"),
		wear: asset("/imgs/zhenya/ribbon-wear.webp"),
	},
] as const;

const SLOT =
	"relative w-[calc(14svh+1vw)] h-[calc(14svh+1vw)] portrait:w-[16vw] portrait:h-[16vw] flex items-center justify-center p-[1svh] bg-white border-black cursor-pointer drop-shadow-md drop-shadow-black/40 border-[0.3svh]";

const DOLL =
	"h-[103svh] absolute top-[-32svh] left-[calc(2svh+2vw)] portrait:h-[66svh] portrait:top-[-10svh] portrait:left-[-16vw] max-w-none";

const hang = (
	shown: boolean,
	{ ms = 800, easing = LABEL_DROP, delay = 0 } = {},
) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform ${ms}ms ${easing} ${shown ? delay : 0}ms`,
	transform: shown ? "translateY(0)" : "translateY(-120svh)",
});

export default function WardrobePage() {
	const {
		curtainsOpen,
		goTo,
		goBack,
		owned,
		wearing,
		pinsOn,
		ribbonOn,
		dress,
	} = useStage();
	const dollSrc = useBlinkingDoll();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const [trying, setTrying] = useState(wearing);
	const [tryingExtras, setTryingExtras] = useState({
		pins: pinsOn,
		ribbon: ribbonOn,
	});
	const hasHats = owned.includes("hats");
	const extras = EXTRAS.filter(({ item }) => owned.includes(item));
	const canWear = hasHats || extras.length > 0;
	const extrasAt = hasHats ? 980 : 500;
	const saveAt = Math.max(1300, extrasAt + 200 + extras.length * 120);

	return (
		<div className="h-full">
			<h1 className="sr-only">Zhenya&apos;s hats</h1>

			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				src={dollSrc}
				className={`${DOLL} test-shadow z-5`}
				style={hang(shown, { ms: 900, easing: DOLL_DROP })}
				alt={
					trying
						? `Zhenya, a marionette doll on strings, wearing the ${HATS[trying].name}`
						: "Zhenya, a marionette doll on strings"
				}
			/>
			{extras.map(
				({ id, wear }) =>
					tryingExtras[id] && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							key={id}
							src={wear}
							className={`${DOLL} z-5 pointer-events-none hat-on`}
							style={hang(shown, { ms: 900, easing: DOLL_DROP })}
							alt=""
							aria-hidden
						/>
					),
			)}
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

			<div
				className={`absolute z-6 top-[1svh] ${hasHats && extras.length ? "right-[2vw]" : "right-[5vw]"} portrait:top-[37svh] portrait:right-auto portrait:left-[50%] portrait:translate-x-[-50%] flex flex-col items-center gap-[2.2svh] portrait:gap-[1.5svh]`}
			>
				<h2
					className={`${LABEL} text-[4svh] portrait:text-[2.8svh]`}
					style={{ ...hang(shown, { delay: 300 }), zIndex: 9 }}
				>
					<Strings />
					{hasHats
						? "Try on a hat"
						: canWear
							? "Try something on"
							: "No hats yet"}
				</h2>

				{canWear ? (
					<>
						<div className="relative z-[8] flex items-start gap-[1.5vw] portrait:flex-col portrait:items-center portrait:gap-[1.5svh]">
							{hasHats && (
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
												className={`${SLOT} ${trying === id ? "" : "border-dashed"}`}
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
							)}
							{extras.length > 0 && (
								<ul
									aria-label="Extras"
									className="relative z-[6] grid grid-cols-1 portrait:grid-cols-2 gap-[1.5vw] portrait:gap-[2vw]"
								>
									{extras.map(({ id, name, image }, i) => (
										<li
											key={id}
											className="relative"
											style={{
												...hang(shown, { delay: extrasAt + i * 120 }),
												zIndex: 6 - i,
											}}
										>
											<button
												onClick={() =>
													setTryingExtras((on) => ({ ...on, [id]: !on[id] }))
												}
												aria-pressed={tryingExtras[id]}
												aria-label={name}
												className={`${SLOT} ${tryingExtras[id] ? "" : "border-dashed"}`}
											>
												<Strings />
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={image}
													className="max-w-full max-h-full w-auto h-auto"
													alt=""
												/>
											</button>
										</li>
									))}
								</ul>
							)}
						</div>
						{hasHats && (
							<button
								onClick={() => setTrying(null)}
								aria-pressed={!trying}
								className={`${BUTTON.replace(" border-dashed", "")} ${trying ? "border-dashed" : ""} self-stretch text-[3svh] portrait:text-[2.3svh]`}
								style={{ ...hang(shown, { delay: 1100 }), zIndex: 7 }}
							>
								<Strings />
								No hat
							</button>
						)}
						<div
							className="relative z-[5] flex gap-[1.5vw] portrait:gap-[3vw]"
							style={hang(shown, { delay: saveAt })}
						>
							<button
								onClick={() => {
									dress({
										hat: trying,
										pins: tryingExtras.pins,
										ribbon: tryingExtras.ribbon,
									});
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
					<a
						href="/souvenir-shop"
						onClick={(e) => {
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
								return;
							e.preventDefault();
							goTo("/souvenir-shop");
						}}
						className={`${BUTTON} block max-w-[30vw] portrait:max-w-[80vw] text-[3svh] portrait:text-[2.3svh]`}
						style={{ ...hang(shown, { delay: 500 }), zIndex: 8 }}
					>
						<Strings />
						They come in the mystery box from the souvenir shop {"->"}
					</a>
				)}
			</div>

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
