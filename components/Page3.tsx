import PopsicleButton from "@/components/PopsicleButton";
import Strings from "@/components/Strings";
import { useEffect, useRef, useState } from "react";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import useFrownDoll, { ZHENYA_FROWN } from "@/components/useFrownDoll";
import MoneyStick from "@/components/MoneyStick";
import * as sound from "@/lib/sound";
import { useStage } from "@/components/Stage";
import type { ItemId } from "@/lib/shop";
import { asset } from "@/lib/asset";
import Zhenya from "@/components/Zhenya";
import Bird from "@/components/Bird";
import { findSecret } from "@/lib/secrets";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const WOW_MS = 1080;
const WOW_REVERSE_MS = 1080;
const MONA_DELAY_MS = 400;

const drop = (shown: boolean, ms = 800, easing = LABEL_DROP) => ({
	transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
	visibility: shown ? ("visible" as const) : ("hidden" as const),
});

export default function Page3({
	nextPage,
	previousPage,
	curtainsOpen,
}: PageProps) {
	const [step, setStep] = useState(0);

	const [entered, setEntered] = useState(false);
	const [opened, setOpened] = useState(false);
	const { buy, owned, give } = useStage();
	const [tooPoor, setTooPoor] = useState<ItemId | null>(null);
	const tooPoorTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(() => () => clearTimeout(tooPoorTimer.current), []);
	const frown = useFrownDoll(ZHENYA_FROWN);
	const frowning = useRef(false);
	const tryBuy = (item: ItemId) => {
		if (buy(item) !== "not-enough-money") return;
		setTooPoor(item);
		if (!frowning.current) frown.playFrown();
		frowning.current = true;
		clearTimeout(tooPoorTimer.current);
		tooPoorTimer.current = setTimeout(() => {
			setTooPoor(null);
			frowning.current = false;
			frown.playFrownReverse();
		}, 1500);
	};
	const buyText = (item: ItemId, text: string, boughtText: string) =>
		owned.includes(item)
			? boughtText
			: tooPoor === item
				? "Not enough money!"
				: text;

	const [item, setItem] = useState(0);
	const ITEM_COUNT = 5;
	const enter = () => {
		sound.shopBell();
		setEntered(true);
		setOpened(true);
		setItem(0);
	};
	const pinsUp = entered && item === 0;
	const pensUp = entered && item === 1;
	const notebookUp = entered && item === 2;
	const monaUp = entered && item === 3;
	const boxUp = entered && item === 4;
	const soldOut = owned.includes("hats");
	const blinkSrc = useBlinkingDoll();
	const [dollSrc, setDollSrc] = useState<string | null>(null);
	const wowPlayed = useRef(false);

	const wowBlobs = useRef<{ wow?: Blob; reverse?: Blob }>({});
	const playingUrl = useRef<string | null>(null);
	const freshUrl = (blob: Blob | undefined, fallback: string) => {
		if (playingUrl.current) URL.revokeObjectURL(playingUrl.current);
		playingUrl.current = blob ? URL.createObjectURL(blob) : null;
		return playingUrl.current ?? fallback;
	};
	useEffect(() => {
		fetch(asset("/imgs/zhenya/wow.webp"))
			.then((res) => res.blob())
			.then((blob) => (wowBlobs.current.wow = blob));
		fetch(asset("/imgs/zhenya/wow-reverse.webp"))
			.then((res) => res.blob())
			.then((blob) => (wowBlobs.current.reverse = blob));
		new Image().src = asset("/imgs/zhenya/wow-idle.webp");
		return () => {
			if (playingUrl.current) URL.revokeObjectURL(playingUrl.current);
		};
	}, []);

	useEffect(() => {
		const timers: ReturnType<typeof setTimeout>[] = [];
		if (monaUp) {
			timers.push(
				setTimeout(() => {
					wowPlayed.current = true;
					setDollSrc(
						freshUrl(wowBlobs.current.wow, asset("/imgs/zhenya/wow.webp")),
					);
				}, MONA_DELAY_MS),
				setTimeout(
					() => setDollSrc(asset("/imgs/zhenya/wow-idle.webp")),
					MONA_DELAY_MS + WOW_MS,
				),
			);
		} else if (wowPlayed.current) {
			wowPlayed.current = false;
			timers.push(
				setTimeout(() =>
					setDollSrc(
						freshUrl(
							wowBlobs.current.reverse,
							asset("/imgs/zhenya/wow-reverse.webp"),
						),
					),
				),
				setTimeout(() => setDollSrc(null), WOW_REVERSE_MS),
			);
		}
		return () => timers.forEach(clearTimeout);
	}, [monaUp]);

	const leaving = opened && !entered;

	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[1200, 2],
			[2000, 3],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="sr-only">Zhenya&apos;s souvenir shop</h1>

			<Zhenya
				src={frown.src ?? dollSrc ?? blinkSrc}
				className="h-svh absolute top-[-32.5svh] right-[-5vw] portrait:h-[46svh] portrait:top-[-12svh] portrait:right-[-6svh] max-w-none test-shadow-darker z-5 scale-x-[-1] pointer-events-none"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<div
				className="absolute left-[35vw] bottom-[5svh] portrait:left-[64vw] portrait:bottom-[31svh] z-11 portrait:z-9 test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: entered ? "400ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<MoneyStick />
			</div>

			<button
				onClick={enter}
				disabled={entered}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[59svh] left-[28vw] portrait:bottom-[58svh] portrait:left-[10vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[3vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(step >= 2),
					transitionDelay: leaving ? "900ms" : "0ms",
					transform:
						step >= 2 && !entered ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				Click to enter
			</button>

			<button
				onClick={enter}
				disabled={entered}
				aria-label="Enter the souvenir shop"
				className="absolute bottom-[5svh] left-[-3vw] portrait:left-[2vw] test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transitionDelay: leaving ? "400ms" : "0ms",
					transform:
						step >= 1 && !entered ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/shop/souvenir.webp")}
					className="h-[70svh] portrait:h-[42svh] max-w-none z-5 relative"
					alt="Souvenir shop"
					data-hit
				/>
				<Bird
					flying={step >= 2}
					onClick={() => {
						sound.click();
						findSecret("bird");
						give("bird-secret");
					}}
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] left-[-8vw] portrait:left-[-6svh] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the souvenir"
					data-hit
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] right-[-10vw] portrait:right-[-8svh] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the souvenir"
					data-hit
				/>
			</button>

			<div
				className="absolute bottom-[5svh] left-[4vw] portrait:left-[8vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pinsUp ? "400ms" : "0ms",
					transform: pinsUp ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/shop/buttons2.webp")}
					className="h-[60svh] portrait:h-[38svh] max-w-none z-5 relative"
					alt="Art Gallery card of four button pins"
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] left-[-10vw] portrait:left-[-8svh] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the button pins"
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] right-[-10vw] portrait:right-[-8svh] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the button pins"
				/>
			</div>

			<div
				className="absolute bottom-[5svh] left-[10vw] portrait:left-[14vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pensUp ? "400ms" : "0ms",
					transform: pensUp ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/shop/pens.webp")}
					className="h-[70svh] portrait:h-[42svh] max-w-none z-5 relative"
					alt="Pack of six Micron pens"
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] left-[50%] translate-x-[-50%] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the pens"
				/>
			</div>

			<div
				className="absolute bottom-[5svh] left-[5vw] portrait:left-[10vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: monaUp ? "400ms" : "0ms",
					transform: monaUp ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/shop/mona_lisa.webp")}
					className="h-[60svh] portrait:h-[38svh] max-w-none z-5 relative"
					alt="The Mona Lisa in a picture frame"
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] left-[50%] translate-x-[-50%] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the Mona Lisa"
				/>
			</div>

			<div
				className="absolute bottom-[1svh] left-[9vw] portrait:left-[12vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: notebookUp ? "400ms" : "0ms",
					transform: notebookUp ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/shop/notebook.webp")}
					className="h-[60svh] portrait:h-[38svh] max-w-none z-5 relative"
					alt="Ruled notebook"
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] left-[50%] translate-x-[-50%] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the notebook"
				/>
			</div>

			<div
				className="absolute bottom-[9svh] left-[6vw] portrait:left-[8vw] test-shadow-darker"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: boxUp ? "400ms" : "0ms",
					transform: boxUp ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				<img
					src={asset("/imgs/shop/mystery-box2.webp")}
					className="h-[36svh] portrait:h-[20svh] max-w-none z-5 relative"
					alt="A cardboard mystery box marked with a big question mark"
				/>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					className="absolute top-[50%] left-[50%] translate-x-[-50%] h-[60svh] min-w-[22vw] portrait:min-w-[24svh] portrait:h-[40svh] z-1"
					alt="Wooden popsicle stick holding up the mystery box"
				/>
			</div>

			<button
				onClick={() => setItem((i) => (i + 1) % ITEM_COUNT)}
				tabIndex={entered ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[59svh] left-[28vw] portrait:bottom-[61svh] portrait:left-[8vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[3vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer"
				style={{
					...drop(opened),
					transitionDelay: entered ? "900ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				Next item
			</button>
			<button
				onClick={() => tryBuy("pins")}
				disabled={!pinsUp}
				tabIndex={pinsUp ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[67svh] left-[22vw] portrait:bottom-[53svh] portrait:left-[8vw] portrait:max-w-[62vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pinsUp ? "400ms" : "0ms",
					transform: pinsUp ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				{buyText("pins", "Buy the buttons for $10", "You bought the buttons!")}
			</button>

			<button
				onClick={() => tryBuy("pens")}
				disabled={!pensUp}
				tabIndex={pensUp ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[67svh] left-[22vw] portrait:bottom-[53svh] portrait:left-[8vw] portrait:max-w-[62vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: pensUp ? "400ms" : "0ms",
					transform: pensUp ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				{buyText("pens", "Buy the pens for $16", "You bought the pens!")}
			</button>

			<button
				onClick={() => tryBuy("mona-lisa")}
				disabled={!monaUp}
				tabIndex={monaUp ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[67svh] left-[17vw] portrait:bottom-[53svh] portrait:left-[8vw] portrait:max-w-[62vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: monaUp ? "400ms" : "0ms",
					transform: monaUp ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				{buyText(
					"mona-lisa",
					"Buy the Mona Lisa for $1,000,000,000",
					"You bought the Mona Lisa!",
				)}
			</button>

			<button
				onClick={() => tryBuy("notebook")}
				disabled={!notebookUp}
				tabIndex={notebookUp ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[67svh] left-[17vw] portrait:bottom-[53svh] portrait:left-[8vw] portrait:max-w-[62vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: notebookUp ? "400ms" : "0ms",
					transform: notebookUp ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				{buyText(
					"notebook",
					"Buy the notebook for $8",
					"You bought the notebook!",
				)}
			</button>

			<button
				onClick={() => tryBuy("mystery-box")}
				disabled={!boxUp || soldOut}
				tabIndex={boxUp ? undefined : -1}
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[67svh] left-[17vw] portrait:bottom-[53svh] portrait:left-[8vw] portrait:max-w-[62vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer disabled:cursor-default"
				style={{
					...drop(opened, 900, DOLL_DROP),
					transitionDelay: boxUp ? "400ms" : "0ms",
					transform: boxUp ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				{soldOut
					? "Sold out - you have all the hats!"
					: buyText(
							"mystery-box",
							"Buy a mystery box for $10",
							"You bought it! Open it in the menu",
						)}
			</button>

			<button
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] cursor-pointer mx-auto text-center scribbler absolute bottom-[59svh] left-[2vw] portrait:bottom-[69svh] portrait:left-[8vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker"
				onClick={() => setEntered(!entered)}
				tabIndex={entered ? undefined : -1}
				style={{
					...drop(opened),
					transitionDelay: entered ? "1100ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				Exit
			</button>

			<button
				className="text-[3svh] portrait:text-[2.3svh] portrait:z-6 max-w-[70%] mx-auto text-center scribbler absolute bottom-[51svh] left-[-1vw] portrait:bottom-[69svh] portrait:left-[28vw] portrait:px-[3vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow-darker cursor-pointer"
				onClick={() => setItem((i) => (i - 1 + ITEM_COUNT) % ITEM_COUNT)}
				tabIndex={entered ? undefined : -1}
				style={{
					...drop(opened),
					transitionDelay: entered ? "1300ms" : "0ms",
					transform: entered ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<Strings />
				Prev item
			</button>

			<div className="z-10">
				<PopsicleButton
					onClick={nextPage}
					href="/art-on-social-media"
					style={{
						...drop(step >= 3, 900, BUTTON_DROP),
						right: "-5vw",
						transform: step >= 3 ? "translateY(0)" : "translateY(100svh)",
					}}
				>
					Continue {"->"}
				</PopsicleButton>
			</div>
		</div>
	);
}
