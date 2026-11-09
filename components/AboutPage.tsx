"use client";
import Strings, { LABEL } from "@/components/Strings";

import {
	Fragment,
	useEffect,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import { asset } from "@/lib/asset";
import { STORY_PAGES } from "@/lib/pages";

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const PERSONAL_SITE = "";

const Link = ({ href, children }: { href: string; children: ReactNode }) => (
	<a
		href={href}
		target="_blank"
		rel="noopener noreferrer"
		className="text-[#2f5fd0] underline decoration-wavy decoration-[0.08em] underline-offset-[0.25em] hover:decoration-[0.12em]"
	>
		{children}
	</a>
);

const ABOUT: ReactNode[] = [
	"Hi! I'm Zhenya - yup, like the doll.",
	"From Ukraine, 18yo",
	"I drew every asset on this stage by hand, in Procreate (The stage curtains are my first ever animation!).",
	<Fragment key="work">
		I work at <Link href="https://hackclub.com">Hack Club</Link>, and organize
		events for teens, who are minorities in STEM
	</Fragment>,
	<span
		key="links"
		className="flex flex-wrap gap-x-[1.5vw] portrait:gap-x-[4vw]"
	>
		<Link href="https://www.linkedin.com/in/yevheniia-simaka/">LinkedIn</Link>
		<Link href="https://github.com/jane-does-coding">GitHub</Link>
		{PERSONAL_SITE && <Link href={PERSONAL_SITE}>Personal site</Link>}
	</span>,
];

const DROP_STAGGER_MS = 250;

const hang = (
	shown: boolean,
	from: "top" | "bottom",
	{ ms = 800, easing = LABEL_DROP, delay = 0 } = {},
): CSSProperties => ({
	visibility: shown ? "visible" : "hidden",
	transition: `transform ${ms}ms ${easing} ${shown ? delay : 0}ms`,
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-110svh" : "110svh"})`,
});

export default function AboutPage() {
	const { curtainsOpen, goTo } = useStage();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const start = STORY_PAGES[0].href;

	return (
		<div className="h-full relative">
			<div
				className="absolute bottom-[12svh] left-[17%] portrait:left-[50%] portrait:bottom-auto portrait:top-[2svh] translate-x-[-50%] z-5 test-shadow-darker"
				style={hang(shown, "bottom", { ms: 900, easing: DROP })}
			>
				<img
					src={asset("/imgs/stage/popsicle-stick.webp")}
					className="absolute w-[2vw] portrait:w-[2.5svh] h-[35svh] max-w-none left-[50%] translate-x-[-50%] top-[80%] z-0 portrait:hidden"
					alt=""
					aria-hidden
				/>
				<div className="relative z-1 h-[49svh] portrait:h-[22svh] aspect-[705/762]">
					{/* <div
						aria-hidden
						className="absolute left-[15.2%] top-[17.4%] w-[69.1%] h-[64.5%] bg-black/20"
					> */}
					<img
						src="/creator.png"
						alt=""
						className="absolute left-[15.2%] top-[17.4%] w-[69.1%] h-[64.5%] bg-black/20"
					/>
					<img
						src={asset("/imgs/art/empty_square_frame.webp")}
						className="relative h-full w-auto max-w-none"
						alt="A picture frame, waiting for a self-portrait"
					/>
				</div>
				<p
					className={`${LABEL} w-max mx-auto mt-[1.5svh] text-[3svh] z-2 portrait:hidden`}
				>
					The creator
				</p>
			</div>

			<section className="absolute top-[-4svh] portrait:top-[24svh] left-[44%] portrait:left-[4vw] w-[44%] portrait:w-[92vw] flex flex-col items-start gap-[1.6svh] portrait:gap-[1.2svh]">
				<h1
					className={`${LABEL} w-max max-w-full text-[4.5svh] portrait:text-[3svh]`}
					style={{ ...hang(shown, "top"), zIndex: 9 }}
				>
					<Strings inset="1vw" />
					About the creator
				</h1>
				{ABOUT.map((line, i) => (
					<p
						key={i}
						className={`${LABEL} text-left text-[2.8svh] portrait:text-[2svh] leading-snug`}
						style={{
							...hang(shown, "top", { delay: 300 + i * DROP_STAGGER_MS }),
							zIndex: 8 - i,
						}}
					>
						<Strings inset="1vw" />
						{line}
					</p>
				))}
			</section>

			<PopsicleButton
				href={start}
				onClick={() => goTo(start)}
				className="z-9 portrait:hidden"
				style={{
					...hang(shown, "bottom", {
						ms: 900,
						easing: DROP,
						delay: 300 + ABOUT.length * DROP_STAGGER_MS,
					}),
					right: "-5vw",
				}}
			>
				Watch it again {"->"}
			</PopsicleButton>
		</div>
	);
}
