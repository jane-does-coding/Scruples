import PopsicleButton from "@/components/PopsicleButton";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { FRAMES, type FrameSize } from "@/lib/frames";
import { asset } from "@/lib/asset";
import * as sound from "@/lib/sound";
import usePortrait from "@/components/usePortrait";
import useWowDoll from "@/components/useWowDoll";
import Zhenya from "@/components/Zhenya";

// Extra-wide is sized so it's the same height as a wide frame
// (frame4 is 1018×762, wide frames are 762×705)
const FRAME_SIZES: Record<FrameSize, string> = {
	// Squashed to 90% height (1229 × 0.9 ≈ 1106) - aspect-ratio rather than
	// scale-y, so the layout box matches and labels sit right under it
	// (On portrait screens they're sized by height instead, as vw is tiny)
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

// Where the marquee was when you left this page, so it carries on from
// there when you come back instead of starting over
let marqueeTime: CSSNumberish | null = null;

// A painting being looked at (clicked in the marquee): which one, which
// copy of the strip it's in, how far it moves to get to the middle, and
// whether it's still open (it's kept after closing, so everything can find
// its way back)
type Focus = {
	slug: string;
	copy: number;
	index: number;
	dx: number;
	dy: number;
	// How much bigger it gets
	scale: number;
	// When it starts moving: once the others on screen have sunk away
	moveAt: number;
	// The last turn (see placeFrame) of a painting that's on screen
	lastTurn: number;
	open: boolean;
};
const FOCUS_DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const SINK = "cubic-bezier(0.5, 0, 0.75, 0)";
// The cards about it: how long each drops in or lifts away, and how far
// apart
const CARD_MS = 800;
const CARD_STAGGER_MS = 120;
// The other paintings sink one at a time, this far apart, each taking
// SINK_MS; then the picked one glides over (MOVE_MS), then the cards drop.
// Putting it back goes the other way: it glides back, then the others come
// up one at a time
const FRAME_STAGGER_MS = 150;
const SINK_MS = 600;
const MOVE_MS = 900;
const RISE_MS = 900;
// Coming back, the others start rising soon after the picked one starts
// back (so they can be clicked again quickly), a little closer together
const RISE_AT_MS = 300;
const RISE_STAGGER_MS = 100;

// A painting's turn to sink, `along` paintings along the strip from the
// one picked (negative = left of it): left neighbour, right neighbour, the
// next one left, the next right…
const turnOf = (along: number) => 2 * Math.abs(along) - (along < 0 ? 2 : 1);

// A card about a painting, and the two strings it hangs on
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

	// Drop the doll, then the labels, in once the curtains have opened,
	// then raise the Continue button
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

	// While the marquee is hovered the doll stops wiggling and idles like on
	// Page 1, blinking every 3 seconds
	const [hoveringArt, setHoveringArt] = useState(false);
	const [blinking, setBlinking] = useState(false);
	useEffect(() => {
		if (!hoveringArt) return;

		let blinkEnd: ReturnType<typeof setTimeout>;
		const interval = setInterval(() => {
			setBlinking(true);
			// blink2.webp is one 700ms blink (it loops, so it's swapped out
			// after one)
			blinkEnd = setTimeout(() => setBlinking(false), 700);
		}, 3000);

		return () => {
			clearInterval(interval);
			clearTimeout(blinkEnd);
			// Next hover starts on the idle frame, not mid-blink
			setBlinking(false);
		};
	}, [hoveringArt]);
	// Zhenya goes "wow" at the painting you pick, and back when it's put away
	const { src: wowSrc, playWow, playWowReverse } = useWowDoll();
	const dollImage = wowSrc
		? wowSrc
		: !hoveringArt
			? asset("/imgs/zhenya/wiggle.webp")
			: blinking
				? asset("/imgs/zhenya/blink2.webp")
				: asset("/imgs/zhenya/doll3.webp");

	// Marquee eases down to 30% speed on hover. playbackRate is changed
	// rather than the CSS duration, so the strip keeps its place instead of jumping
	const marqueeRef = useRef<HTMLDivElement>(null);
	const speedFrame = useRef(0);
	const easeMarqueeTo = (target: number) => {
		const animation = marqueeRef.current?.getAnimations()[0];
		if (!animation) return; // e.g. reduced motion turns the animation off

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
	// Pick up where it left off, and remember where it is when leaving. A
	// layout effect, so on the way out the strip is still on the page (and
	// its animation still running) when its position is read
	useLayoutEffect(() => {
		const el = marqueeRef.current;
		const animation = el?.getAnimations()[0];
		if (animation && marqueeTime !== null) animation.currentTime = marqueeTime;
		return () => {
			const leaving = el?.getAnimations()[0];
			if (leaving?.currentTime != null) marqueeTime = leaving.currentTime;
		};
	}, []);

	// Clicking a painting: the marquee stops, the painting glides to the
	// middle and grows a little, everything else sinks away or lifts off, and
	// cards about it hang down beside it. Clicking it again (or "back", or
	// Escape) puts it all back
	const root = useRef<HTMLDivElement>(null);
	const [focus, setFocus] = useState<Focus | null>(null);
	const open = !!focus?.open;
	const frame = focus && FRAMES.find((f) => f.slug === focus.slug);
	const resumeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const look = (slug: string, copy: number, index: number, el: HTMLElement) => {
		const box = root.current?.getBoundingClientRect();
		const seen = el.querySelector("[data-frame]")?.getBoundingClientRect();
		if (!box || !seen) return;
		// Where its picture is when it's in its place in the strip - it may
		// still be on its way back there (moved and grown) from last time
		const own = el.getBoundingClientRect();
		const style = getComputedStyle(el);
		const [tx = 0] = (style.translate === "none" ? "" : style.translate)
			.split(" ")
			.map(parseFloat);
		const grown = style.scale === "none" ? 1 : parseFloat(style.scale) || 1;
		const ownX = own.left + own.width / 2;
		const picture = {
			width: seen.width / grown,
			centerX: ownX - tx + (seen.left + seen.width / 2 - ownX) / grown,
		};
		clearTimeout(resumeTimer.current);
		marqueeRef.current?.getAnimations()[0]?.pause();
		// The last of the others that can be seen to sink - the picked one
		// moves once it's gone
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
		// To the middle of the stage (left of the cards on wide screens), a
		// little higher up
		// On wide screens it grows to 10% bigger plus 3vw wider, the extra
		// width all on its right (its left edge stays where 10% puts it)
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
			dy: innerHeight * (portrait ? -0.17 : 0.02),
			open: true,
		});
		sound.click();
		playWow();
	};
	const putBack = () => {
		if (!open) return;
		setFocus((f) => f && { ...f, open: false });
		playWowReverse();
		// The marquee only moves again once they're all back
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
	// Where each painting in the strip goes: the others sink below the stage
	// one by one, the nearest first, then the one being looked at moves to
	// the middle. Back: it moves back, then the others come up one by one
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
	// The cards about it: dropping in one after another as the painting
	// arrives, lifting away in reverse
	const card = (i: number, count: number) => ({
		zIndex: 10 - i,
		visibility: open ? ("visible" as const) : ("hidden" as const),
		transform: open ? "translateY(0)" : "translateY(-110svh)",
		transition: open
			? `transform ${CARD_MS}ms ${FOCUS_DROP} ${(focus?.moveAt ?? 0) + MOVE_MS - 300 + i * CARD_STAGGER_MS}ms, visibility 0s`
			: `transform 600ms ${SINK} ${(count - 1 - i) * 60}ms, visibility 0s ${600 + count * 60}ms`,
	});

	// Only slows down once the pointer has stayed on the marquee for 1s
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
			{/* Doll */}
			<Zhenya
				src={dollImage}
				className="h-svh absolute top-[-27svh] left-[-8vw] portrait:h-[62svh] portrait:top-[-10svh] portrait:left-[-22vw] max-w-none test-shadow-darker z-5"
				style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120svh)",
					// Steps aside a little while a painting is being looked at
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

			{/* Picture frames - two copies of the set slide left by one set's width
			    (-50%), so the loop is seamless */}
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
							// A real link to its own page, so search engines can follow
							// it and it can be opened in a new tab; a plain click shows
							// it right here instead (and a second click puts it back)
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
								// The second copy is only there for the loop; while one
								// is open, the others are out of reach
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
									// Only its drawn parts count (see opaqueAt)
									data-hit
								/>
								<img
									src={src}
									className={`${FRAME_SIZES[size]} relative z-2`}
									alt={`${label}, painting in a picture frame`}
									data-hit
									data-frame
								/>
								{/* Label - sits right under the frame image */}
								<span className="border-[0.2svh] border-black bg-white px-[1vw] portrait:px-[3vw] py-[0.5svh] text-[3svh] portrait:text-[2.3svh] left-[50%] translate-x-[-50%] absolute top-full mt-[1svh] z-5 w-max whitespace-nowrap portrait:whitespace-normal portrait:max-w-[24svh] text-center">
									{/* Just the title - the year is on its page */}
									{label.split(" • ")[0]}
								</span>
							</a>
						))}
					</div>
				))}
			</div>

			{/* About the painting being looked at - cards hanging down on the
			    right (under it on portrait screens): who painted it and when,
			    the facts about it, one fun fact, and a way back. Only the
			    way back takes clicks, so nothing here gets in the way of the
			    paintings once they're back */}
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

			{/* <div className="z-10">
				<PopsicleButton onClick={previousPage} side="left">
					{"<-"} Back
				</PopsicleButton>
			</div>
 */}
			{/* <img
				src={asset("/imgs/stage/popsicle.webp")}
				alt=""
				className="absolute w-[15vw] mx-auto bottom-[-13svh] z-[-5]"
			/>
			<button
				onClick={nextPage}
				className="absolute bottom-[3svh] cursor-pointer mx-auto border-[0.3svh] border-black px-6 py-2 z-20 bg-white border-[0.3svh] border-black border-dashed px-[2vw] py-[1svh] text-[2.5svh]"
			>
				Inventory
			</button> */}

			<PopsicleButton
				onClick={nextPage}
				href="/souvenir-shop"
				style={{
					...drop(step >= 4, 900, BUTTON_DROP),
					// Inline so it beats the component's right-0
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
