"use client";

import { useEffect, useState } from "react";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import { asset } from "@/lib/asset";

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const LABEL =
	"relative text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

const DOLL =
	"h-[103svh] absolute top-[-32svh] left-[-9vw] portrait:h-[62svh] portrait:top-[-6svh] portrait:left-[-18vw] max-w-none";

const WEARABLES = [
	{
		id: "apple-hat",
		name: "Apple hat",
		src: asset("/imgs/progress/apple-hat.webp"),
	},
	{
		id: "pokemon-hat",
		name: "Pokémon hat",
		src: asset("/imgs/progress/pokemon-hat.webp"),
	},
	{
		id: "purple-hair",
		name: "Purple hair",
		src: asset("/imgs/progress/purple-hair.webp"),
	},
];

const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-[1vw] absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-[1vw] absolute"></span>
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
		: `translateY(${from === "top" ? "-120svh" : "110svh"})`,
});

const Prop = ({
	src,
	alt,
	caption,
	size,
	className,
	style,
}: {
	src: string;
	alt: string;
	caption: string;
	size: string;
	className: string;
	style: React.CSSProperties;
}) => (
	<figure
		className={`absolute translate-x-[-50%] z-5 test-shadow-darker ${className}`}
		style={style}
	>
		<img
			src={asset("/imgs/stage/popsicle-stick.webp")}
			className={`absolute w-[2vw] portrait:w-[2.5svh] h-[45svh] portrait:h-[14svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0 `}
			alt=""
			aria-hidden
		/>
		<img
			src={src}
			className={`relative top-[5vh] z-1 w-auto max-w-none ${size} ${caption == "Unused bag" ? "" : "border-[0.2vh] border-black"}`}
			alt={alt}
		/>
		<figcaption
			className={`${LABEL} w-max mx-auto mt-[1svh] top-[5vh] text-[2.4svh] portrait:text-[1.8svh] z-2`}
		>
			{caption}
		</figcaption>
	</figure>
);

export default function ProgressPage() {
	const { curtainsOpen } = useStage();
	const dollSrc = useBlinkingDoll();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const [wearing, setWearing] = useState(WEARABLES[0].id);
	const worn = WEARABLES.find((w) => w.id === wearing)!;

	return (
		<div className="h-full relative">
			<img
				src={dollSrc}
				className={`${DOLL} test-shadow z-4`}
				style={hang(shown, "top", { ms: 900, easing: DROP })}
				alt={`Zhenya, a marionette doll on strings, wearing the unused ${worn.name.toLowerCase()}`}
			/>
			<img
				key={worn.id}
				src={worn.src}
				className={`${DOLL} z-4 pointer-events-none hat-on`}
				style={hang(shown, "top", { ms: 900, easing: DROP })}
				alt=""
				aria-hidden
			/>

			<div className="absolute top-[-4svh] portrait:top-[-2svh] left-[60%] portrait:left-[60%] translate-x-[-50%] w-max max-w-[44vw] portrait:max-w-[72vw] flex flex-col items-center gap-[1.5svh] z-9">
				<h1
					className={`${LABEL} text-[4.5svh] portrait:text-[3svh]`}
					style={{ ...hang(shown, "top"), zIndex: 3 + WEARABLES.length }}
				>
					<Strings />
					The progress
				</h1>
				<p
					className={`${LABEL} text-[2.6svh] portrait:text-[1.8svh]`}
					style={{
						...hang(shown, "top", { delay: 200 }),
						zIndex: 2 + WEARABLES.length,
					}}
				>
					<Strings />
					Drawn for the show, but never made it on stage
				</p>
				<div
					className="flex flex-wrap justify-center gap-[1vw] portrait:gap-[2vw]"
					role="group"
					aria-label="Try an unused hat or hairstyle on Zhenya"
				>
					{WEARABLES.map(({ id, name }, i) => (
						<button
							key={id}
							onClick={() => setWearing(id)}
							aria-pressed={wearing === id}
							className={`${BUTTON} text-[2.6svh] portrait:text-[1.8svh] ${wearing === id ? "underline decoration-dashed underline-offset-4" : ""}`}
							style={{
								...hang(shown, "top", { delay: 400 + i * 150 }),
								zIndex: 1 + WEARABLES.length - i,
							}}
						>
							<Strings />
							{name}
						</button>
					))}
				</div>
			</div>

			<Prop
				src={asset("/imgs/progress/frame.webp")}
				alt="A scalloped paper frame, drawn to sit around the stage"
				caption="Unused frame"
				size="h-[28svh] portrait:h-[13svh]"
				className="top-[22svh] portrait:top-[30svh] left-[52%] portrait:left-[68%]"
				style={hang(shown, "bottom", { ms: 900, easing: DROP, delay: 600 })}
			/>
			<Prop
				src={asset("/imgs/progress/bag.webp")}
				alt="A white tote bag covered in little doodle pins"
				caption="Unused bag"
				size="h-[30svh] portrait:h-[16svh]"
				className="top-[20svh] portrait:top-[52svh] left-[86%] portrait:left-[68%]"
				style={hang(shown, "bottom", { ms: 900, easing: DROP, delay: 800 })}
			/>
		</div>
	);
}
