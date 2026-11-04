import { useEffect, useRef, useState } from "react";
import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import useBlinkingDoll from "@/components/useBlinkingDoll";
import Zhenya from "@/components/Zhenya";
import { asset } from "@/lib/asset";
import * as sound from "@/lib/sound";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

const CURTAIN_FRAMES = Array.from({ length: 7 }, (_, i) =>
	asset(`/imgs/stage/closing/${String(i).padStart(2, "0")}.webp`),
);
const LIFT_MS = 700;
const PUSH_MS = 2400;
const PUSH_EASE = "cubic-bezier(0.6, 0, 0.9, 0.5)";
const PUSH_SCALE = 9;
const TURN_AT_MS = LIFT_MS + PUSH_MS + 200;
const TURN_MS = 2800;
const TURN_EASE = "cubic-bezier(0.65, 0, 0.35, 1)";
const ARRIVED_MS = TURN_AT_MS + TURN_MS + 300;

const LABEL =
	"relative text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";
const BUTTON = `${LABEL.replace("border-[0.2svh]", "border-[0.3svh]")} border-dashed cursor-pointer`;

const Strings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-[1vw] absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-[1vw] absolute"></span>
	</>
);

const hang = (shown: boolean, from: "top" | "bottom", delay = 0) => ({
	visibility: shown ? ("visible" as const) : ("hidden" as const),
	transition: `transform 800ms ${LABEL_DROP} ${shown ? delay : 0}ms`,
	transform: shown
		? "translateY(0)"
		: `translateY(${from === "top" ? "-120svh" : "110svh"})`,
});

const Wall = ({ children }: { children?: React.ReactNode }) => (
	<div className="absolute inset-0 bg-white overflow-hidden [backface-visibility:hidden]">
		<img
			src={asset("/imgs/stage/paper-bg-1920.webp")}
			className="absolute inset-0 w-full h-full object-cover opacity-60"
			alt=""
			aria-hidden
		/>
		{children}
	</div>
);

export default function Page10({ curtainsOpen }: PageProps) {
	const { goTo } = useStage();
	const blinkSrc = useBlinkingDoll();

	const [shown, setShown] = useState(false);
	const [going, setGoing] = useState(false);
	const [pushing, setPushing] = useState(false);
	const [frame, setFrame] = useState(-1);
	const [turning, setTurning] = useState(false);
	const [arrived, setArrived] = useState(false);

	const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const later = (ms: number, fn: () => void) =>
		timers.current.push(setTimeout(fn, ms));
	useEffect(
		() => () => {
			timers.current.forEach(clearTimeout);
			document.documentElement.classList.remove("zoomed-out");
		},
		[],
	);

	useEffect(() => {
		CURTAIN_FRAMES.forEach((src) => (new Image().src = src));
		new Image().src = asset("/imgs/stage/room.webp");
	}, []);

	useEffect(() => {
		if (pushing) document.documentElement.classList.add("zoomed-out");
	}, [pushing]);

	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);

	const follow = () => {
		sound.click();
		setGoing(true);
		setFrame(0);
		later(LIFT_MS, () => {
			setPushing(true);
			sound.whoosh(PUSH_MS);
		});
		CURTAIN_FRAMES.forEach((_, i) =>
			later(LIFT_MS + ((i + 1) * PUSH_MS) / CURTAIN_FRAMES.length, () =>
				setFrame(i + 1 < CURTAIN_FRAMES.length ? i + 1 : -1),
			),
		);
		later(TURN_AT_MS, () => {
			setTurning(true);
			sound.whoosh(TURN_MS);
		});
		later(ARRIVED_MS, () => setArrived(true));
	};

	return (
		<div className="h-full relative">
			<h1 className="sr-only">Backstage</h1>

			<div
				aria-hidden
				className="fixed inset-0 z-5 pointer-events-none"
				style={{
					perspective: "50vw",
					visibility: turning ? "visible" : "hidden",
				}}
			>
				<div
					className="absolute inset-0 [transform-style:preserve-3d]"
					style={{
						transform: `translateZ(50vw) rotateY(${turning ? 90 : 0}deg)`,
						transition: `transform ${TURN_MS}ms ${TURN_EASE}`,
					}}
				>
					<div
						className="absolute inset-0 [transform-style:preserve-3d]"
						style={{ transform: "translateZ(-50vw)" }}
					>
						<Wall />
					</div>
					<div
						className="absolute inset-0 [transform-style:preserve-3d]"
						style={{ transform: "rotateY(-90deg) translateZ(-50vw)" }}
					>
						<Wall>
							<img
								src={asset("/imgs/stage/room.webp")}
								className="absolute inset-0 w-full h-full object-cover mix-blend-multiply"
								alt=""
							/>
						</Wall>
					</div>
				</div>
			</div>

			<Zhenya
				src={blinkSrc}
				className="fixed h-svh w-auto max-w-none top-[-4svh] left-[27vw] portrait:h-[66svh] portrait:top-[-2svh] portrait:left-[24vw] translate-x-[-50%] z-9 test-shadow-darker"
				style={{
					visibility: shown ? "visible" : "hidden",
					transition: `transform 900ms ${DOLL_DROP}`,
					transform: shown ? "translateY(0)" : "translateY(-120svh)",
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			{frame >= 0 && (
				<img
					src={CURTAIN_FRAMES[frame]}
					className="fixed w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none z-12 pointer-events-none scene-shadow"
					style={{
						visibility: pushing ? "visible" : "hidden",
						transformOrigin: "50% 58%",
						scale: pushing ? `${PUSH_SCALE}` : "1",
						transition: `scale ${PUSH_MS}ms ${PUSH_EASE}`,
					}}
					alt=""
					aria-hidden
				/>
			)}

			<div className="absolute top-[4svh] portrait:top-[2svh] left-[66%] portrait:left-[62%] translate-x-[-50%] w-max max-w-[30vw] portrait:max-w-[60vw] flex flex-col items-center gap-[2svh] z-9">
				<p
					className={`${LABEL} text-[3.4svh] portrait:text-[2.3svh] z-2`}
					style={hang(shown && !going, "top")}
				>
					<Strings />
					Come backstage with me.
				</p>
				<button
					onClick={follow}
					disabled={going}
					className={`${BUTTON} text-[3svh] portrait:text-[2.2svh] z-1`}
					style={hang(shown && !going, "top", 300)}
				>
					<Strings />
					Follow her {"->"}
				</button>
			</div>

			<p
				role="status"
				aria-live="polite"
				className={`fixed top-[16svh] portrait:top-[8svh] left-[66vw] portrait:left-[70vw] translate-x-[-50%] w-max text-[3.4svh] portrait:text-[2.3svh] z-9 ${LABEL}`}
				style={hang(arrived, "top")}
			>
				<Strings />
				{arrived ? "This is my room." : ""}
			</p>

			<PopsicleButton
				onClick={() => goTo("/cutting-the-strings")}
				href="/cutting-the-strings"
				style={{
					...hang(arrived, "bottom", 900),
					right: "-5vw",
					bottom: "-2svh",
					filter: "drop-shadow(12px 12px 2px #000000a0)",
					zIndex: 20,
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
