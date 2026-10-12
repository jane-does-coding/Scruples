"use client";

import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { asset, srcSet } from "@/lib/asset";
import {
	BILL_IMAGES,
	ITEMS,
	STARTING_MONEY,
	billsFor,
	type ItemId,
} from "@/lib/shop";

const ANIMATION_MS = 700;
// Opening on a new route is a bit slower, and waits a moment first so the
// new page has drawn before the curtains move
const ROUTE_OPEN_MS = 1000;
const ROUTE_OPEN_DELAY_MS = 150;

const frames = (name: string, count: number) =>
	Array.from({ length: count }, (_, i) =>
		asset(`/imgs/${name}/${String(i).padStart(2, "0")}.webp`),
	);

const CLOSING_FRAMES = frames("closing", 10);
const OPENING_FRAMES = frames("opening", 12);
// First half (21 of 42 frames) of ripping.gif. The GIF runs at 50ms a frame;
// it's played faster here
const RIPPING_FRAMES = frames("ripping", 21);
// The same frames at 700px wide, for screens where the ticket (50vw) doesn't
// need more - smaller download, so they're ready sooner
const RIPPING_FRAMES_SMALL = frames("ripping-700", 21);
// If the rip frames still aren't ready this long after the ticket is
// clicked, skip the rip rather than leave the ticket sitting there
const RIP_WAIT_MAX_MS = 4000;
const RIPPING_FRAME_MS = 30;
// Curtains start opening this long after the ticket is clicked
const CURTAIN_DELAY_MS = 300;

// Where the top-left "<-" button goes from each route, or null to hide it
const backHref = (pathname: string) => {
	const page = pathname.match(/^\/page(\d+)$/);
	if (page) return Number(page[1]) > 1 ? `/page${Number(page[1]) - 1}` : null;
	// Paintings are opened from the marquee on Page 2
	if (pathname.startsWith("/art-piece/")) return "/page2";
	return null;
};

// What happened when trying to buy something
export type BuyResult = "bought" | "already-owned" | "not-enough-money";

type StageContextValue = {
	// True once the curtains have finished opening
	curtainsOpen: boolean;
	// Close the curtains, go to `href`, and open them once it has rendered
	goTo: (href: string) => void;
	// The inventory (shown in the "?" menu): money left and items bought.
	// Kept here so it carries over between pages
	money: number;
	owned: ItemId[];
	buy: (item: ItemId) => BuyResult;
	// Adds an item without paying for it (e.g. Daphne drawing for free)
	give: (item: ItemId) => void;
	// Gives money to Daphne
	donate: (amount: number) => void;
};

const StageContext = createContext<StageContextValue | null>(null);

export const useStage = () => {
	const stage = useContext(StageContext);
	if (!stage) throw new Error("useStage must be used inside <Stage>");
	return stage;
};

// The theatre around every route: background, curtains, ticket and nav.
// It lives in the root layout so it stays mounted while routes change
export default function Stage({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	// Starts "loading": closed curtains cover the page until the ticket is
	// clicked and the opening frames are decoded, then they open
	const [animationStage, setAnimationStage] = useState<
		"loading" | "idle" | "closing" | "opening"
	>("loading");

	// The ticket sits on the closed curtains until it's clicked, then plays
	// the ripping frames in the same spot while the curtains open behind it.
	// The refs are read by the frame loader, which may finish before or after
	// the click
	// "loading" = clicked, waiting for the rip frames to arrive
	const [ticket, setTicket] = useState<
		"waiting" | "loading" | "ripping" | "gone"
	>("waiting");
	const enteredRef = useRef(false);
	const curtainDelayDone = useRef(false);
	const ripCanvasRef = useRef<HTMLCanvasElement>(null);
	const ripFrames = useRef<ImageBitmap[]>([]);

	// Nav: header.png slides down from the top when "?" is clicked
	const [navOpen, setNavOpen] = useState(false);

	// Inventory - money left and items bought
	const [money, setMoney] = useState(STARTING_MONEY);
	const [owned, setOwned] = useState<ItemId[]>([]);
	// Every change to the inventory pops up a note next to the "?" button
	// (see notify)
	const [note, setNote] = useState<{ text: string; id: number } | null>(
		null,
	);
	const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const notify = (text: string) => {
		setNote((n) => ({ text, id: (n?.id ?? 0) + 1 }));
		clearTimeout(noteTimer.current);
		noteTimer.current = setTimeout(() => setNote(null), 5000);
	};
	const buy = (item: ItemId): BuyResult => {
		if (owned.includes(item)) return "already-owned";
		const { price } = ITEMS[item];
		if (price > money) return "not-enough-money";
		setMoney(money - price);
		setOwned([...owned, item]);
		notify(`${ITEMS[item].name} was added to inventory`);
		return "bought";
	};
	const give = (item: ItemId) => {
		if (owned.includes(item)) return;
		setOwned([...owned, item]);
		notify(`${ITEMS[item].name} was added to inventory`);
	};
	const donate = (amount: number) => {
		if (amount <= 0) return;
		setMoney((m) => m - amount);
		notify(`You gave Daphne $${amount}`);
	};
	const sell = (item: ItemId) => {
		setOwned(owned.filter((i) => i !== item));
		setMoney(money + ITEMS[item].price);
		notify(`${ITEMS[item].name} was sold for $${ITEMS[item].price}`);
		closeItem();
	};
	const bills = billsFor(money);

	// Clicking an item in the inventory opens it: the other slots fade out and
	// its slot stretches across the whole row with a description and Sell.
	// `openItem` is which one; `itemOpen` turns on a moment later so the slot
	// can grow from where it was
	const [openItem, setOpenItem] = useState<{
		item: ItemId;
		slot: number;
	} | null>(null);
	const [itemOpen, setItemOpen] = useState(false);
	const showItem = (item: ItemId, slot: number) => {
		setOpenItem({ item, slot });
		setTimeout(() => setItemOpen(true), 20);
	};
	const closeItem = () => {
		setItemOpen(false);
		setTimeout(() => setOpenItem(null), 400);
	};

	// Images that can't be seen until after the ticket is clicked (the menu
	// header and bag, the open curtains, the paper background behind the closed
	// curtains) are only added once the page has loaded, so they don't compete
	// with the ticket and closed curtains for bandwidth
	const [pageLoaded, setPageLoaded] = useState(false);
	useEffect(() => {
		const onLoad = () => setPageLoaded(true);
		if (document.readyState === "complete") {
			const timer = setTimeout(onLoad, 0);
			return () => clearTimeout(timer);
		}
		window.addEventListener("load", onLoad, { once: true });
		return () => window.removeEventListener("load", onLoad);
	}, []);
	useEffect(() => {
		if (!navOpen) return;
		const closeOnEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape") setNavOpen(false);
		};
		window.addEventListener("keydown", closeOnEscape);
		return () => window.removeEventListener("keydown", closeOnEscape);
	}, [navOpen]);

	// The GIFs are too big for browsers to animate reliably, so they're
	// split into frames (public/imgs/closing, public/imgs/opening,
	// public/imgs/ripping). Every frame is decoded up front and drawn to a
	// canvas, so playback starts the instant the button is clicked.
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const bitmaps = useRef<{ closing: ImageBitmap[]; opening: ImageBitmap[] }>({
		closing: [],
		opening: [],
	});
	const frameTimer = useRef<ReturnType<typeof setInterval> | null>(null);

	const drawFrame = (bitmap: ImageBitmap) => {
		const canvas = canvasRef.current;
		if (!canvas) return;
		if (canvas.width !== bitmap.width) {
			canvas.width = bitmap.width;
			canvas.height = bitmap.height;
		}
		const ctx = canvas.getContext("2d")!;
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.drawImage(bitmap, 0, 0);
	};

	// Clear the last frame in the same paint that shows open.png again,
	// so there's no flash between them
	useLayoutEffect(() => {
		if (animationStage !== "idle") return;
		const canvas = canvasRef.current;
		canvas?.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height);
	}, [animationStage]);

	const playFrames = (
		frames: ImageBitmap[],
		onDone: () => void,
		duration = ANIMATION_MS,
	) => {
		let i = 0;
		drawFrame(frames[0]);
		frameTimer.current = setInterval(() => {
			i++;
			if (i < frames.length) {
				drawFrame(frames[i]);
			} else {
				clearInterval(frameTimer.current!);
				onDone();
			}
		}, duration / frames.length);
	};

	const openCurtains = (duration = ANIMATION_MS) => {
		setAnimationStage("opening");
		playFrames(
			bitmaps.current.opening,
			() => setAnimationStage("idle"),
			duration,
		);
	};

	// Draws the first frame right away, in the click itself, so the rip
	// starts instantly, then removes the ticket after the last frame
	const playRipping = () => {
		const canvas = ripCanvasRef.current;
		const frames = ripFrames.current;
		if (!canvas || !frames.length) {
			setTicket("gone");
			return;
		}

		canvas.width = frames[0].width;
		canvas.height = frames[0].height;
		const ctx = canvas.getContext("2d")!;
		let i = 0;
		const draw = () => {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(frames[i], 0, 0);
		};

		draw();
		setTicket("ripping");
		const timer = setInterval(() => {
			i++;
			if (i < frames.length) {
				draw();
			} else {
				clearInterval(timer);
				setTicket("gone");
			}
		}, RIPPING_FRAME_MS);
	};

	// Frame loading. Each starts once and is shared, so the click and the
	// page-load timer can both ask for it. Low priority, so they never hold up
	// what's already on screen
	const decodeFrames = (srcs: string[], priority: RequestPriority = "low") =>
		Promise.all(
			srcs.map((src) =>
				fetch(src, { priority })
					.then((res) => res.blob())
					.then((blob) => createImageBitmap(blob)),
			),
		);
	const ripLoading = useRef<Promise<void> | null>(null);
	const loadRipping = () => {
		// The ticket is 50vw wide, so the 700px frames do unless that's more
		// than 700 real pixels
		const small = window.innerWidth * 0.5 * window.devicePixelRatio <= 700;
		ripLoading.current ??= decodeFrames(
			small ? RIPPING_FRAMES_SMALL : RIPPING_FRAMES,
			"auto",
		).then((b) => {
			ripFrames.current = b;
		});
		return ripLoading.current;
	};
	const openingLoading = useRef<Promise<void> | null>(null);
	const loadOpening = () => {
		openingLoading.current ??= decodeFrames(OPENING_FRAMES).then((b) => {
			bitmaps.current.opening = b;
			// Ticket was clicked while the frames were still loading
			if (enteredRef.current && curtainDelayDone.current) openCurtains();
		});
		return openingLoading.current;
	};

	const enter = () => {
		if (enteredRef.current) return;
		enteredRef.current = true;
		// Make sure both are on their way, even if the click beat the timer
		loadOpening();

		const ripThenOpen = () => {
			playRipping();
			setTimeout(() => {
				curtainDelayDone.current = true;
				// Otherwise the frame loader opens them once it's done
				if (bitmaps.current.opening.length) openCurtains();
			}, CURTAIN_DELAY_MS);
		};

		if (ripFrames.current.length) {
			ripThenOpen();
			return;
		}
		// Clicked before the rip frames arrived: hold the ticket still until
		// they do (or give up after RIP_WAIT_MAX_MS and skip the rip)
		setTicket("loading");
		let started = false;
		const startOnce = () => {
			if (started) return;
			started = true;
			ripThenOpen();
		};
		loadRipping().then(startOnce);
		setTimeout(startOnce, RIP_WAIT_MAX_MS);
	};

	useEffect(() => {
		// The rip frames (~0.5-0.8MB) are needed the moment the ticket is
		// clicked, so they start as soon as the visible page has loaded. The
		// opening frames (~1.7MB) wait another second so the ticket is surely on
		// screen first; the closing frames are only needed when changing pages,
		// so they come last
		let delay: ReturnType<typeof setTimeout>;
		const afterLoad = () => {
			loadRipping();
			delay = setTimeout(() => {
				Promise.all([loadOpening(), loadRipping()]).then(() =>
					decodeFrames(CLOSING_FRAMES).then(
						(b) => (bitmaps.current.closing = b),
					),
				);
			}, 1000);
		};
		if (document.readyState === "complete") afterLoad();
		else window.addEventListener("load", afterLoad, { once: true });

		return () => {
			clearTimeout(delay);
			window.removeEventListener("load", afterLoad);
			if (frameTimer.current) clearInterval(frameTimer.current);
		};
	}, []);

	// Plays the closing frames, then calls onClosed. Returns false (and does
	// nothing) if the curtains are mid-animation or the frames aren't loaded
	const closeCurtains = (onClosed: () => void) => {
		const { closing, opening } = bitmaps.current;
		if (animationStage !== "idle" || !closing.length || !opening.length) {
			return false;
		}
		setAnimationStage("closing");
		playFrames(closing, onClosed);
		return true;
	};

	// Set when the curtains have closed for a route change; the pathname
	// effect below opens them once the new route has rendered
	const openOnNewRoute = useRef(false);

	const goTo = (href: string) => {
		router.prefetch(href);
		const closing = closeCurtains(() => {
			openOnNewRoute.current = true;
			router.push(href);
		});
		if (!closing) router.push(href);
	};

	const back = backHref(pathname);
	const goBack = () => {
		// Only once the curtains are fully open (not mid-animation or behind
		// the ticket), so it always goes through the curtains
		if (!back || animationStage !== "idle") return;
		setNavOpen(false);
		goTo(back);
	};

	useEffect(() => {
		if (!openOnNewRoute.current) return;
		openOnNewRoute.current = false;
		// Timer also keeps the state change outside the effect itself
		setTimeout(() => openCurtains(ROUTE_OPEN_MS), ROUTE_OPEN_DELAY_MS);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	return (
		<StageContext.Provider
			value={{
				curtainsOpen: animationStage === "idle",
				goTo,
				money,
				owned,
				buy,
				give,
				donate,
			}}
		>
			<div className="relative h-screen overflow-clip">
				<button
					onClick={() => setNavOpen((open) => !open)}
					aria-expanded={navOpen}
					aria-controls="nav"
					aria-label={navOpen ? "Close menu" : "Open menu"}
					className="fixed top-[0.5vh] right-[0.5vw] text-[4vh] font-extrabold cursor-pointer z-[23] w-[3.5vw] h-[3.5vw] bg-white border-dashed border-[0.2vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
					?
				</button>

				{/* Inventory pop-up - just left of the "?", whenever something is
				    added, sold or given. Clicking it opens the inventory */}
				{note && (
					<button
						key={note.id}
						onClick={() => {
							setNote(null);
							setNavOpen(true);
						}}
						className="note-pop fixed top-[1vh] right-[4.8vw] z-[23] max-w-[40vw] text-[2.5vh] text-left scribbler bg-white border-2 border-black border-dashed px-[1vw] py-[0.5vh] cursor-pointer drop-shadow-lg drop-shadow-black/60"
					>
						{note.text}, click to view {"->"}
					</button>
				)}

				{/* Back - same look as the "?", in the top-left corner */}
				{back && (
					<button
						onClick={goBack}
						aria-label="Back"
						className="fixed top-[0.5vh] left-[0.5vw] text-[3.75vh] font-extrabold cursor-pointer z-[23] w-[3.5vw] h-[3.5vw] bg-white border-dashed border-[0.2vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
					>
						{"<-"}
					</button>
				)}

				{/* Backdrop behind the nav - fades in darker and slightly blurred,
			    and closes the nav when clicked */}
				<div
					onClick={() => setNavOpen(false)}
					aria-hidden
					className="fixed inset-0 z-[21] bg-black/20 backdrop-blur-[1px] transition-opacity duration-700"
					style={{
						opacity: navOpen ? 1 : 0,
						pointerEvents: navOpen ? "auto" : "none",
					}}
				/>

				{/* Nav - header.png's bottom rests 10vh above the bottom of the page.
			    Closed, it's pushed up by 90vh so it sits fully above the screen.
			    Sits above the curtains, buttons (z-20) and backdrop (z-21),
			    under the "?" (z-23) */}
				<nav
					id="nav"
					inert={!navOpen}
					className={`nav-bounce fixed inset-x-0 bottom-[10vh] z-[22] drop-shadow-lg drop-shadow-black/40 ${navOpen ? "test-shadow-darker" : ""}`}
					style={{
						transform: navOpen ? "translateY(0)" : "translateY(-90vh)",
					}}
				>
					{/* Hidden scribble ("nothing to see here"). The nav's bottom edge
					    rests 90vh down the screen, so bottom-[90vh] puts this right
					    above the top of the screen when the nav is open - out of
					    sight. It rides along with the nav, so it only peeks in at
					    the lowest point of the bounce (the spring in .nav-bounce
					    dips 8vh - exactly this image's height), then slides back out as
					    the nav settles. Keep the two in sync: see .nav-bounce */}
					{pageLoaded && (
						<img
							src={asset("/imgs/hidden-scribble.webp")}
							fetchPriority="low"
							className="absolute bottom-[90vh] left-0 w-screen h-[8vh] max-w-none pointer-events-none"
							alt=""
							aria-hidden
						/>
					)}

					{pageLoaded && (
						<img
							src={asset("/imgs/header.webp")}
							srcSet={srcSet([
								["/imgs/header-1200.webp", 1200],
								["/imgs/header-1600.webp", 1600],
								["/imgs/header.webp", 2360],
							])}
							sizes="100vw"
							fetchPriority="low"
							className="w-screen block"
							alt="Theatre curtain valance"
						/>
					)}

					{/* Nav content - sits in the solid area above the curtain swags */}
					<div className="absolute inset-x-0 bottom-[45%] flex flex-col items-center gap-[2vh] text-[3vh] pt-[3vh]">
						{/* 	{pageLoaded && (
							<img
								src={asset("/imgs/bag.webp")}
								srcSet={srcSet([
									["/imgs/bag-450.webp", 450],
									["/imgs/bag.webp", 900],
								])}
								sizes="18vw"
								fetchPriority="low"
								className="w-[18vw] absolute right-[8vw] top-[-9vh] test-shadow-darker"
								alt=""
							/>
						)} */}
						{/* Inventory - a row of six square slots: your money (the
						    bills fanned out, with the total), then one slot per thing
						    you can buy - filled in the order you bought them, the rest
						    empty */}
						<h2 className="text-[4vh] absolute left-[12.5%] top-[30%]">
							Pages
						</h2>
						<div className="bg-red-400/10 p-[3vh] absolute left-[12%] top-[49%] bg-white/20 border-[0.3vh] border-black border-dashed">
							<div className="grid grid-cols-3 gap-[1.5vh]">
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
							</div>
						</div>
						<h2 className="text-[4vh] absolute right-[11%] top-[30%]">
							Something
						</h2>
						<div className="bg-red-400/10 p-[3vh] absolute right-[12%] top-[49%] bg-white/20 border-[0.3vh] border-black border-dashed">
							<div className="grid grid-cols-3 gap-[1.5vh]">
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
								<div className="h-[1.25vh] w-[1.25vh] rounded-full bg-neutral-600"></div>
							</div>
						</div>
						<h2 className="text-[4vh]">Inventory</h2>
						<ul className="relative grid grid-cols-4 gap-[1.5vw]">
							<li
								className="relative w-[22vh] h-[22vh] bg-white/20 border-[0.3vh] border-black border-dashed transition-opacity duration-300"
								style={{ opacity: itemOpen ? 0 : 1 }}
								aria-label={`$${money} - ${bills.fives} $5 bills and ${bills.ones} $1 bills`}
							>
								{[
									...Array.from(
										{ length: bills.fives },
										() => BILL_IMAGES.five,
									),
									...Array.from({ length: bills.ones }, () => BILL_IMAGES.one),
								].map((src, i, all) => (
									<img
										key={i}
										src={src}
										className="absolute top-[50%] h-[18vh] w-auto max-w-none -translate-x-[50%] -translate-y-[50%] test-shadow-darker"
										style={{
											// Fanned out around the middle of the slot
											left: `${50 + (i - (all.length - 1) / 2) * 12}%`,
											rotate: `${(i - (all.length - 1) / 2) * 8}deg`,
										}}
										alt=""
									/>
								))}
								<span className="absolute bottom-[0.5vh] right-[0.5vw] bg-white border-[0.3vh] border-black px-[0.5vw] text-[2.5vh] leading-tight">
									${money}
								</span>
							</li>
							{Array.from({ length: 3 }, (_, i) => owned[i]).map((item, i) => (
								<li
									key={item ?? `empty-${i}`}
									className="relative w-[22vh] h-[22vh] bg-white/20 border-[0.3vh] border-black border-dashed flex items-center justify-center transition-opacity duration-300"
									style={{ opacity: itemOpen ? 0 : 1 }}
									aria-label={item ? undefined : "Empty slot"}
								>
									{item && (
										<button
											onClick={() => showItem(item, i + 1)}
											className="w-full h-full flex items-center justify-center cursor-pointer"
											aria-label={`${ITEMS[item].name} - details`}
										>
											<img
												src={ITEMS[item].image}
												className="max-h-[90%] max-w-[90%] w-auto h-auto test-shadow-darker"
												alt={ITEMS[item].name}
												title={ITEMS[item].name}
											/>
										</button>
									)}
								</li>
							))}

							{/* An opened item - starts exactly over its slot, then
							    stretches across the whole row while the other slots
							    fade out */}
							{openItem && (
								<li
									className="absolute top-0 h-[22vh] bg-white/80 border-[0.3vh] border-black border-dashed flex items-center gap-[2vw] px-[2vh] overflow-hidden"
									style={{
										transition:
											"left 400ms cubic-bezier(0.34, 1.1, 0.64, 1), width 400ms cubic-bezier(0.34, 1.1, 0.64, 1)",
										left: itemOpen
											? "0"
											: `calc(${openItem.slot} * (22vh + 1.5vw))`,
										width: itemOpen ? "100%" : "22vh",
									}}
								>
									<img
										src={ITEMS[openItem.item].image}
										className="h-[18vh] w-auto max-w-[18vh] object-contain test-shadow-darker"
										alt={ITEMS[openItem.item].name}
									/>
									<div
										className="flex flex-col gap-[1vh] text-left transition-opacity duration-300"
										style={{ opacity: itemOpen ? 1 : 0 }}
									>
										<h3 className="text-[3vh]">{ITEMS[openItem.item].name}</h3>
										<p className="text-[2.2vh] leading-snug max-w-[45vw]">
											{ITEMS[openItem.item].description}
										</p>
										<div className="flex gap-[1vw]">
											<button
												onClick={() => sell(openItem.item)}
												className="text-[2.5vh] bg-white border-2 border-black border-dashed px-[1vw] cursor-pointer"
											>
												Sell for ${ITEMS[openItem.item].price}
											</button>
											<button
												onClick={closeItem}
												className="text-[2.5vh] bg-white border-2 border-black border-dashed px-[1vw] cursor-pointer"
											>
												Close
											</button>
										</div>
									</div>
								</li>
							)}
						</ul>
					</div>
				</nav>

				{/* Normal open state */}
				{pageLoaded && (
					<img
						src={asset("/imgs/open.webp")}
						srcSet={srcSet([
							["/imgs/open-1200.webp", 1200],
							["/imgs/open-1600.webp", 1600],
							["/imgs/open.webp", 2360],
						])}
						sizes="100vw"
						fetchPriority="low"
						className="w-screen h-screen top-0 left-0 fixed z-10 pointer-events-none scene-shadow"
						style={{
							visibility: animationStage === "idle" ? "visible" : "hidden",
						}}
						alt="Open theatre curtains"
					/>
				)}

				{/* Closed curtains until the ticket is clicked and the opening frames load */}
				{animationStage === "loading" && (
					<img
						src={asset("/imgs/closed.webp")}
						// Smaller screens get a smaller copy (147KB at 1200px vs 522KB)
						srcSet={srcSet([
							["/imgs/closed-1200.webp", 1200],
							["/imgs/closed-1600.webp", 1600],
							["/imgs/closed.webp", 2360],
						])}
						sizes="100vw"
						fetchPriority="high"
						className="w-screen h-screen top-0 left-0 fixed z-30"
						alt="Closed theatre curtains"
					/>
				)}

				{/* Ticket - click it to open the curtains and enter */}
				{ticket !== "gone" && (
					<button
						onClick={enter}
						disabled={ticket !== "waiting"}
						className={`fixed top-[40vh] left-[20vw] z-40 cursor-pointer disabled:cursor-default drop-shadow-lg drop-shadow-black/60 test-shadow-darkest ${ticket === "waiting" ? "ticket-shake" : ""}`}
						aria-label="Enter"
					>
						<img
							src={asset("/imgs/ticket2.webp")}
							// Shown at 50vw - smaller screens get the 700px version
							srcSet={srcSet([
								["/imgs/ticket2-700.webp", 700],
								["/imgs/ticket2.webp", 1400],
							])}
							sizes="50vw"
							fetchPriority="high"
							className="w-[50vw] block"
							style={{
								visibility: ticket === "ripping" ? "hidden" : "visible",
							}}
							alt="Admit one ticket"
						/>
						{/* Ripping frames are drawn here, over the same spot */}
						<canvas
							ref={ripCanvasRef}
							className="absolute inset-0 w-full h-full"
						/>
					</button>
				)}

				{/* Closing / opening animation - always on screen (transparent when
			    idle) so a click only has to draw, not show/hide anything */}
				<canvas
					ref={canvasRef}
					className="w-screen h-screen top-0 left-0 fixed z-30 pointer-events-none scene-shadow"
				/>

				{/* Content - no z-index here, so it doesn't form a stacking context:
			    curtains (z-10) sit above it, buttons (z-20) sit above curtains,
			    and the animation (z-30) covers everything */}
				<main className="bg-white/0 border-[0.3vh] border-black/0 w-[65vw] h-[75vh] mx-auto top-[25vh] relative">
					{children}
				</main>

				{/* Background */}
				<div className="-z-10 fixed top-0 left-0 h-screen w-screen">
					{pageLoaded && (
						<img
							src={asset("/imgs/paper-bg-2560.webp")}
							srcSet={srcSet([
								["/imgs/paper-bg-1280.webp", 1280],
								["/imgs/paper-bg-1920.webp", 1920],
								["/imgs/paper-bg-2560.webp", 2560],
							])}
							sizes="100vw"
							fetchPriority="low"
							alt="Paper texture background"
							className="w-full h-full object-cover opacity-60"
						/>
					)}
				</div>
			</div>
		</StageContext.Provider>
	);
}
