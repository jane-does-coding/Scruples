import { useEffect, useState } from "react";
import { asset } from "@/lib/asset";
import Strings from "@/components/Strings";

const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const MS = 800;

const CARD =
	"relative scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[1svh] drop-shadow-md drop-shadow-black/40 text-[2.4svh] portrait:text-[1.5svh] leading-snug";

const LEFT = [
	{
		title: "Sunbeam Poster? Why is it here?",
		body: "The creator of this website ran Sunbeam and is very proud of it!",
	},
];

const RIGHT = [
	{
		title: "What is Sunbeam?",
		body: "38 all-girls hackathons happening on the same day, internationally in 38 different cities! Got together 1,600+ girls to code and make projects. Sunbeam was brought to live by Athena Initiative from Hack Club.",
	},
];

type Card = { title: string; body?: string; list?: string[] };

const Cards = ({
	cards,
	shown,
	delay,
}: {
	cards: Card[];
	shown: boolean;
	delay: number;
}) => (
	<div className="flex flex-col gap-[2.5svh] portrait:gap-[1.5svh] w-[22vw] portrait:w-auto portrait:flex-1">
		{cards.map(({ title, body, list }, i) => (
			<div
				key={title}
				onClick={(e) => e.stopPropagation()}
				className={CARD}
				style={{
					transition: `transform ${MS}ms ${DROP} ${delay + i * 120}ms`,
					transform: shown ? "translateY(0)" : "translateY(-110svh)",
				}}
			>
				<Strings inset="15%" />
				<p className="text-[2.9svh] portrait:text-[1.8svh] mb-[0.5svh]">
					{title}
				</p>
				{body && <p>{body}</p>}
				{list && (
					<ul>
						{list.map((item) => (
							<li key={item}>- {item}</li>
						))}
					</ul>
				)}
			</div>
		))}
	</div>
);

export default function PosterViewer({ onClose }: { onClose: () => void }) {
	const [shown, setShown] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setShown(true), 20);
		return () => clearTimeout(timer);
	}, []);

	const close = () => {
		setShown(false);
		setTimeout(onClose, MS + 400);
	};
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	});

	return (
		<div
			role="dialog"
			aria-modal
			aria-label="Sunbeam poster"
			onClick={close}
			className="fixed inset-0 z-25 overflow-y-auto overflow-x-hidden bg-black/40 backdrop-blur-[1px] transition-opacity duration-500"
			style={{ opacity: shown ? 1 : 0 }}
		>
			<div className="min-h-full w-max mx-auto flex items-center gap-[3vw] py-[4svh] portrait:w-full portrait:flex-col portrait:gap-[2svh] portrait:px-[4vw] portrait:py-[6svh]">
				<div className="contents portrait:hidden">
					<Cards cards={LEFT} shown={shown} delay={150} />
				</div>
				<div
					className="relative flex flex-col items-center gap-[2svh]"
					onClick={(e) => e.stopPropagation()}
					style={{
						transition: `transform ${MS}ms ${DROP}`,
						transform: shown ? "translateY(0)" : "translateY(-110svh)",
					}}
				>
					<Strings inset="30%" place="h-[100svh] bottom-[calc(100%-6svh)]" />
					<div className="relative h-[72svh] portrait:h-[38svh] aspect-[2706/3897] test-shadow-darker">
						<img
							src={asset("/imgs/stage/sunbeam-poster.webp")}
							className="absolute object-cover"
							style={{
								left: "6.25%",
								top: "4.7%",
								width: "88.03%",
								height: "91.15%",
							}}
							alt="Sunbeam poster by Hack Club: a girl with a stylus and goggles surrounded by sea creatures, with a sign-up QR code"
						/>
						<img
							src={asset("/imgs/stage/poster-frame.webp")}
							className="absolute inset-0 w-full h-full"
							alt=""
						/>
					</div>
					<button
						onClick={close}
						autoFocus
						className="relative text-[3svh] portrait:text-[2.3svh] scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[3vw] py-[0.5svh] cursor-pointer drop-shadow-md drop-shadow-black/40"
					>
						<Strings inset="20%" place="h-[2svh] top-[-2svh]" />
						Close
					</button>
				</div>
				<div className="contents portrait:flex portrait:gap-[3vw] portrait:items-start portrait:w-full">
					<div className="hidden portrait:contents">
						<Cards cards={LEFT} shown={shown} delay={150} />
					</div>
					<Cards cards={RIGHT} shown={shown} delay={250} />
				</div>
			</div>
		</div>
	);
}
