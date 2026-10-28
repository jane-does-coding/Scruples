import PopsicleButton from "@/components/PopsicleButton";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FRAMES, type FrameSize } from "@/lib/frames";
import { asset } from "@/lib/asset";
import * as sound from "@/lib/sound";
import usePortrait from "@/components/usePortrait";
import useWowDoll from "@/components/useWowDoll";
import Zhenya from "@/components/Zhenya";

const FRAME_SIZES: Record<FrameSize, string> = {
	tall: "w-[17vw] portrait:w-[19svh] aspect-[800/1106]",
	wide: "w-[20vw] portrait:w-[25svh] mt-[0svh]",
	"extra-wide": "w-[21vw] portrait:w-[27svh] mt-[0svh]",
};

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

let marqueeTime: CSSNumberish | null = null;

type Focus = {
	slug: string;
	copy: number;
	index: number;
	dx: number;
	dy: number;
	scale: number;
	moveAt: number;
	lastTurn: number;
	open: boolean;
};
const FOCUS_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const SINK = "cubic-bezier(0.5, 0, 0.75, 0)";
const CARD_MS = 800;
const CARD_STAGGER_MS = 120;
const FRAME_STAGGER_MS = 150;
const SINK_MS = 600;
const MOVE_MS = 900;
const RISE_MS = 900;
const RISE_AT_MS = 300;
const RISE_STAGGER_MS = 100;

const turnOf = (along: number) => 2 * Math.abs(along) - (along < 0 ? 2 : 1);

const CARD =
	"relative scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.7svh] text-[1.9svh] portrait:text-[1.45svh] leading-snug drop-shadow-md drop-shadow-black/40 test-shadow";
const CardStrings = () => (
	<>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-[1vw] absolute"></span>
		<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-[1vw] absolute"></span>
	</>
);

export default function Page2({
	nextPage,
	previousPage,
	curtainsOpen,
}: PageProps) {
	const LABEL_DROP = "cubic-bezier(0.34, 1.25, 0.64, 1)";
	const DOLL_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
	const BUTTON_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";

	const drop = (shown: boolean, ms = 800, easing = LABEL_DROP) => ({
		transition: `top ${ms}ms ${easing}, transform ${ms}ms ${easing}`,
		visibility: shown ? ("visible" as const) : ("hidden" as const),
	});
	const [step, setStep] = useState(0);

	const portrait = usePortrait();

	useEffect(() => {
		if (!curtainsOpen) return;

		const timers = [
			[0, 1],
			[400, 2],
			[800, 3],
			[2000, 4],
		].map(([ms, n]) => setTimeout(() => setStep((s) => Math.max(s, n)), ms));

		return () => timers.forEach(clearTimeout);
	}, [curtainsOpen]);

	const [hoveringArt, setHoveringArt] = useState(false);
	const [blinking, setBlinking] = useState(false);
	useEffect(() => {
		if (!hoveringArt) return;

		let blinkEnd: ReturnType<typeof setTimeout>;
		const interval = setInterval(() => {
			setBlinking(true);
			blinkEnd = setTimeout(() => setBlinking(false), 700);
		}, 3000);

		return () => {
			clearInterval(interval);
			clearTimeout(blinkEnd);
			setBlinking(false);
		};
	}, [hoveringArt]);
	const { src: wowSrc, playWow, playWowReverse } = useWowDoll();
	const dollImage = wowSrc
		? wowSrc
		: !hoveringArt
			? asset("/imgs/zhenya/wiggle.webp")
			: blinking
				? asset("/imgs/zhenya/blink2.webp")
				: asset("/imgs/zhenya/doll3.webp");

	const marqueeRef = useRef<HTMLDivElement>(null);
	const speedFrame = useRef(0);
	const easeMarqueeTo = (target: number) => {
		const animation = marqueeRef.current?.getAnimations()[0];
		if (!animation) return;

		cancelAnimationFrame(speedFrame.current);
		const tick = () => {
			const rate =
				animation.playbackRate + (target - animation.playbackRate) * 0.08;
			if (Math.abs(target - rate) < 0.01) {
				animation.playbackRate = target;
				return;
			}
			animation.playbackRate = rate;
			speedFrame.current = requestAnimationFrame(tick);
		};
		tick();
	};
	useLayoutEffect(() => {
		const el = marqueeRef.current;
		const animation = el?.getAnimations()[0];
		if (animation && marqueeTime !== null) animation.currentTime = marqueeTime;
		return () => {
			const leaving = el?.getAnimations()[0];
			if (leaving?.currentTime != null) marqueeTime = leaving.currentTime;
		};
	}, []);

	const root = useRef<HTMLDivElement>(null);
	const [focus, setFocus] = useState<Focus | null>(null);
	const open = !!focus?.open;
	const frame = focus && FRAMES.find((f) => f.slug === focus.slug);
	const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const look = (slug: string, copy: number, index: number, el: HTMLElement) => {
		const box = root.current?.getBoundingClientRect();
		const seen = el.querySelector("[data-frame]")?.getBoundingClientRect();
		if (!box || !seen) return;
		const own = el.getBoundingClientRect();
		const style = getComputedStyle(el);
		const tx =
			style.translate === "none" ? 0 : parseFloat(style.translate) || 0;
		const grown = style.scale === "none" ? 1 : parseFloat(style.scale) || 1;
		const ownX = own.left + own.width / 2;
		const picture = {
			width: seen.width / grown,
			centerX: ownX - tx + (seen.left + seen.width / 2 - ownX) / grown,
		};
		clearTimeout(resumeTimer.current);
		marqueeRef.current?.getAnimations()[0]?.pause();
		const strip = [
			...(marqueeRef.current?.querySelectorAll("a") ?? []),
		] as HTMLElement[];
		const picked = copy * FRAMES.length + index;
		let lastTurn = -1;
		strip.forEach((a, i) => {
			const r = a.getBoundingClientRect();
			if (i !== picked && r.right > 0 && r.left < innerWidth)
				lastTurn = Math.max(lastTurn, turnOf(i - picked));
		});
		const extra = portrait ? 0 : innerWidth * 0.03;
		const scale = portrait
			? 0.9
			: (picture.width * 1.1 + extra) / picture.width;
		const x = box.left + box.width * (portrait ? 0.5 : 0.4) + extra / 2;
		setFocus({
			moveAt: lastTurn < 0 ? 0 : lastTurn * FRAME_STAGGER_MS + SINK_MS - 100,
			lastTurn,
			slug,
			copy,
			index,
			dx: x - picture.centerX,
			scale,
			dy: innerHeight * (portrait ? -0.2 : -0.01),
			open: false,
		});
		requestAnimationFrame(() =>
			requestAnimationFrame(() => setFocus((f) => f && { ...f, open: true })),
		);
		sound.click();
		playWow();
	};
	const putBack = () => {
		if (!open) return;
		setFocus((f) => f && { ...f, open: false });
		playWowReverse();
		const back = Math.max(
			MOVE_MS,
			RISE_AT_MS + Math.max(0, focus!.lastTurn) * RISE_STAGGER_MS + RISE_MS,
		);
		resumeTimer.current = setTimeout(
			() => marqueeRef.current?.getAnimations()[0]?.play(),
			back,
		);
	};
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") putBack();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	});
	useEffect(() => () => clearTimeout(resumeTimer.current), []);
	const placeFrame = (copy: number, index: number) => {
		if (!focus) return undefined;
		const picked = focus.copy === copy && focus.index === index;
		const delay =
			turnOf(
				copy * FRAMES.length +
					index -
					(focus.copy * FRAMES.length + focus.index),
			) * FRAME_STAGGER_MS;
		if (picked) {
			const move = `${MOVE_MS}ms ${FOCUS_DROP} ${open ? focus.moveAt : 0}ms`;
			return {
				translate: open ? `${focus.dx}px ${focus.dy}px` : "0 0",
				scale: open ? String(focus.scale) : "1",
				transition: `translate ${move}, scale ${move}`,
				zIndex: 3,
			};
		}
		return {
			translate: open ? "0 110svh" : "0 0",
			transition: open
				? `translate ${SINK_MS}ms ${SINK} ${delay}ms`
				: `translate ${RISE_MS}ms ${FOCUS_DROP} ${RISE_AT_MS + (delay / FRAME_STAGGER_MS) * RISE_STAGGER_MS}ms`,
		};
	};
	const card = (i: number, count: number) => ({
		zIndex: 10 - i,
		visibility: open ? ("visible" as const) : ("hidden" as const),
		transform: open ? "translateY(0)" : "translateY(-110svh)",
		transition: open
			? `transform ${CARD_MS}ms ${FOCUS_DROP} ${(focus?.moveAt ?? 0) + MOVE_MS - 300 + i * CARD_STAGGER_MS}ms, visibility 0s`
			: `transform 600ms ${SINK} ${(count - 1 - i) * 60}ms, visibility 0s ${600 + count * 60}ms`,
	});

	const slowDownTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	useEffect(
		() => () => {
			cancelAnimationFrame(speedFrame.current);
			clearTimeout(slowDownTimer.current);
		},
		[],
	);

	return (
		<div
			ref={root}
			className="h-full flex flex-col items-center justify-center"
		>
			<Zhenya
				src={dollImage}
				className="h-svh absolute top-[-27svh] left-[-8vw] portrait:h-[62svh] portrait:top-[-10svh] portrait:left-[-22vw] max-w-none test-shadow-darker z-5"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
					translate: open ? "-4vw 0" : "0 0",
					transition: `${drop(step >= 1, 900, DOLL_DROP).transition}, translate 700ms ${FOCUS_DROP} ${open ? focus.moveAt : 0}ms`,
				}}
				alt="Zhenya, a marionette doll on strings"
			/>

			<h1
				className="text-[3svh] portrait:text-[2.3svh] max-w-[70%] mx-auto text-center scribbler absolute top-[-7svh] right-[25vw] portrait:top-0 portrait:right-[12vw] bg-white border-[0.2svh] border-black px-[2vw] py-[1svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 2),
					transform:
						step >= 2 && !open ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] right-0 absolute"></span>
				Zhenya likes art
			</h1>
			<p
				className="text-[3svh] portrait:text-[2.3svh] max-w-[70%] mx-auto text-center scribbler absolute top-[1svh] right-[13vw] portrait:top-[8svh] portrait:right-[16vw] bg-white border-[0.2svh] border-black px-[2vw] py-[1svh] z-2 drop-shadow-md drop-shadow-black/40 test-shadow"
				style={{
					...drop(step >= 3),
					transform:
						step >= 3 && !open ? "translateY(0)" : "translateY(-60svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[15svh] top-[-15svh] right-0 absolute"></span>
				Click on some pieces
			</p>

			<div
				ref={marqueeRef}
				className="absolute top-[12svh] portrait:top-[21svh] left-0 flex w-max marquee"
				onMouseEnter={() => {
					slowDownTimer.current = setTimeout(() => easeMarqueeTo(0.3), 1000);
					setHoveringArt(true);
				}}
				onMouseLeave={() => {
					clearTimeout(slowDownTimer.current);
					easeMarqueeTo(1);
					setHoveringArt(false);
				}}
			>
				{[0, 1].map((copy) => (
					<div
						key={copy}
						className="flex items-center justify-center gap-[5vw] pr-[4vw] portrait:gap-[6svh] portrait:pr-[5svh] test-shadow"
						aria-hidden={copy === 1}
					>
						{FRAMES.map(({ slug, src, size, label }, index) => (
							<a
								className="relative cursor-pointer text-center"
								key={src}
								href={`/art-piece/${slug}`}
								onClick={(e) => {
									if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
										return;
									e.preventDefault();
									if (open) putBack();
									else look(slug, copy, index, e.currentTarget);
								}}
								aria-label={label}
								aria-expanded={
									focus?.slug === slug && focus.copy === copy ? open : undefined
								}
								tabIndex={
									copy === 1 ||
									(open && (focus.copy !== copy || focus.index !== index))
										? -1
										: undefined
								}
								style={placeFrame(copy, index)}
							>
								<img
									src={asset("/imgs/stage/popsicle.webp")}
									className="absolute top-[30%] left-[50%] translate-x-[-50%] h-[80svh] min-w-[22vw] portrait:min-w-[22svh] z-1"
									alt="Wooden popsicle stick holding up the frame"
									data-hit
								/>
								<img
									src={src}
									className={`${FRAME_SIZES[size]} relative z-2`}
									alt={`${label}, painting in a picture frame`}
									data-hit
									data-frame
								/>
								<span className="border-[0.2svh] border-black bg-white px-[1vw] portrait:px-[3vw] py-[0.5svh] text-[3svh] portrait:text-[2.3svh] left-[50%] translate-x-[-50%] absolute top-full mt-[1svh] z-5 w-max whitespace-nowrap portrait:whitespace-normal portrait:max-w-[24svh] text-center">
									{label.split(" • ")[0]}
								</span>
							</a>
						))}
					</div>
				))}
			</div>

			{frame && (
				<section
					aria-label={`About ${frame.label.split(" • ")[0]}`}
					aria-hidden={!open}
					className="absolute z-7 top-[16svh] right-[-2vw] w-[23vw] pointer-events-none flex flex-col gap-[1.2svh] portrait:top-[36svh] portrait:right-auto portrait:left-[4vw] portrait:w-[92vw] portrait:grid portrait:grid-cols-2 portrait:gap-[1svh]"
				>
					<div className={`${CARD} portrait:col-span-2`} style={card(0, 4)}>
						<CardStrings />
						<h2 className="text-[3.4svh] portrait:text-[2.4svh] leading-tight">
							{frame.label.split(" • ")[0]}
						</h2>
						<p className="text-[2.2svh] portrait:text-[1.7svh] text-black/70">
							by {frame.artist}, {frame.label.split(" • ")[1]}
						</p>
					</div>
					<dl
						className={`${CARD} portrait:col-span-2 grid grid-cols-[auto_1fr] gap-x-[1vw] portrait:gap-x-[3vw] gap-y-[0.4svh]`}
						style={card(1, 4)}
					>
						<CardStrings />
						{(
							[
								["Made with", frame.details.medium],
								["Size", frame.details.size],
								["Where", frame.details.where],
							] as const
						).map(([term, value]) => (
							<div key={term} className="contents">
								<dt className="underline decoration-dashed underline-offset-4">
									{term}
								</dt>
								<dd>{value}</dd>
							</div>
						))}
					</dl>
					<p className={`${CARD} portrait:col-span-2`} style={card(2, 4)}>
						<CardStrings />
						{frame.facts[0]}
					</p>
					<button
						onClick={putBack}
						tabIndex={open ? undefined : -1}
						className={`${CARD} pointer-events-auto border-dashed border-[0.3svh] cursor-pointer self-start text-[2.4svh] portrait:text-[1.9svh] portrait:col-span-2 portrait:justify-self-end`}
						style={card(3, 4)}
					>
						<CardStrings />
						{"<-"} All paintings
					</button>
				</section>
			)}

			<PopsicleButton
				onClick={nextPage}
				href="/souvenir-shop"
				style={{
					...drop(step >= 4, 900, BUTTON_DROP),
					right: "-5vw",
					transform:
						step >= 4 && !open ? "translateY(0)" : "translateY(100svh)",
				}}
			>
				Continue {"->"}
			</PopsicleButton>
		</div>
	);
}
