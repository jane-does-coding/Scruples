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
import ArtViewer from "@/components/ArtViewer";
import Notebook from "@/components/Notebook";
import { asset, srcSet } from "@/lib/asset";
import * as sound from "@/lib/sound";
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
// The same at 800px wide, for phones (≈1.3MB for both instead of ≈3.1MB)
const CLOSING_FRAMES_SMALL = frames("closing-800", 10);
const OPENING_FRAMES_SMALL = frames("opening-800", 12);
// A phone (either way up): the short side of the screen is at most 500px
const isPhone = () => Math.min(window.innerWidth, window.innerHeight) <= 500;
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
	// The last page comes after Page 7 (for now), and the drawings wall is
	// opened from the last page
	if (pathname === "/lastpage") return "/page7";
	if (pathname === "/gallery") return "/lastpage";
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
	// Adds a drawing made along the way (like yours on Page 6) to the
	// inventory. Drawings can't be sold
	keepDrawing: (drawing: Omit<Drawing, "key">) => void;
};

// A drawing in the inventory that isn't from the shop
type Drawing = {
	key: string;
	name: string;
	image: string;
	description: string;
};

// The inventory shows 3 items next to the money, or 7 (two rows) with
// "View all items"
const SLOTS = 3;
const ALL_SLOTS = 7;
// How long the menu glides for when "view all" extends or shrinks it (the
// length of .nav-smooth in globals.css)
const NAV_GLIDE_MS = 650;
// One row of the inventory: a slot plus the gap (set in globals.css, and
// sized by width on portrait screens)
const ROW = "(var(--slot) + var(--slot-gap))";
// The pages, as listed in the menu
const PAGES = [
	{ title: "Meet Zhenya", href: "/page1" },
	{ title: "Zhenya likes art", href: "/page2" },
	{ title: "Souvenir shop", href: "/page3" },
	{ title: "Art on social media", href: "/page4" },
	{ title: "Meet Daphne", href: "/page5" },
	{ title: "Every artist starts somewhere", href: "/page6" },
	{ title: "In the spotlight", href: "/page7" },
	{ title: "Curtain call", href: "/lastpage" },
];

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
	const [note, setNote] = useState<{ text: string; id: number } | null>(null);
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
		itemAdded();
		return "bought";
	};
	const give = (item: ItemId) => {
		if (owned.includes(item)) return;
		setOwned([...owned, item]);
		notify(`${ITEMS[item].name} was added to inventory`);
		itemAdded();
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
	// One image per bill, $5s first - fanned out in the money slot
	const moneyBills = [
		...Array.from({ length: bills.fives }, () => BILL_IMAGES.five),
		...Array.from({ length: bills.ones }, () => BILL_IMAGES.one),
	];

	const [drawings, setDrawings] = useState<Drawing[]>([]);
	const keepDrawing = (drawing: Omit<Drawing, "key">) => {
		setDrawings((d) => [...d, { ...drawing, key: `drawing-${d.length}` }]);
		notify(`${drawing.name} was added to inventory`);
		itemAdded();
	};
	// Everything in the inventory, shop items first, in one shape
	const entries = [
		...owned.map((item) => ({
			key: item as string,
			item,
			art: "art" in ITEMS[item],
			...ITEMS[item],
		})),
		...drawings.map((d) => ({ ...d, item: null, price: 0, art: true })),
	];
	// "View all items": the menu drops further down to show a second row
	// It's a toggle that stays as you left it (kept in this browser too), and
	// turns itself on once there are more items than one row can show
	const [allItemsOn, setAllItemsState] = useState(false);
	// While "view all" is extending or shrinking the open menu, it glides
	// (.nav-smooth) instead of using the springy bounce it opens with
	const [navGliding, setNavGliding] = useState(false);
	const glideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const glideNav = () => {
		setNavGliding(true);
		clearTimeout(glideTimer.current);
		glideTimer.current = setTimeout(() => setNavGliding(false), NAV_GLIDE_MS);
	};
	// The switch only shows once there are more items than one row fits, and
	// until then (or after selling things) it's as if it were off
	const canViewAll = entries.length > SLOTS;
	const allItems = allItemsOn && canViewAll;
	const setAllItems = (on: boolean) => {
		setAllItemsState(on);
		try {
			localStorage.setItem("scruples-view-all", on ? "1" : "0");
		} catch {}
	};
	useEffect(() => {
		let on = false;
		try {
			on = localStorage.getItem("scruples-view-all") === "1";
		} catch {}
		const timer = setTimeout(() => setAllItemsState(on), 0);
		return () => clearTimeout(timer);
	}, []);
	// Called after something is added: one more than there was
	const itemAdded = () => {
		if (owned.length + drawings.length + 1 > SLOTS) setAllItems(true);
	};
	// The notebook, opened with "Use"
	const [notebookOpen, setNotebookOpen] = useState(false);
	// A piece of art being viewed big, opened with "View"
	const [viewing, setViewing] = useState<{
		image: string;
		name: string;
	} | null>(null);

	// Clicking an item in the inventory opens it: the other slots fade out and
	// its slot stretches across the whole row with a description and Sell.
	// `openItem` is which one; `itemOpen` turns on a moment later so the slot
	// can grow from where it was
	const [openItem, setOpenItem] = useState<{
		key: string;
		slot: number;
	} | null>(null);
	const [itemOpen, setItemOpen] = useState(false);
	const opened =
		openItem &&
		(openItem.key === "money"
			? {
					key: "money",
					item: null,
					art: false,
					price: 0,
					name: `Money - $${money}`,
					image: BILL_IMAGES.five,
					description: `${bills.fives} $5 bill${bills.fives === 1 ? "" : "s"} and ${bills.ones} $1 bill${bills.ones === 1 ? "" : "s"}. Spend it on souvenirs in the gallery shop or on a drawing from Daphne - and if you run low, you can sell things from here to get some back.`,
				}
			: entries.find((e) => e.key === openItem.key));
	const showItem = (key: string, slot: number) => {
		setOpenItem({ key, slot });
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

	// A soft "tock" whenever something hanging on strings lands: a label or
	// button finishing its drop into place (its transform or top transition
	// ending back at rest), or a line of dialogue's .hang-in animation
	// ending. Hanging things have string spans (bg-black/60) as direct
	// children; lifting away (ending off screen) is silent
	useEffect(() => {
		const hangs = (el: Element) =>
			!!el.querySelector(':scope > span[class*="bg-black/60"]');
		const onTransitionEnd = (e: TransitionEvent) => {
			if (!(e.target instanceof HTMLElement) || !hangs(e.target)) return;
			if (e.propertyName === "transform") {
				if (/^translateY\(0(px|svh)?\)$/.test(e.target.style.transform))
					sound.drop();
			} else if (e.propertyName === "top") {
				const top = parseFloat(getComputedStyle(e.target).top);
				if (top > 0) sound.drop();
			}
		};
		const onAnimationEnd = (e: AnimationEvent) => {
			if (e.animationName === "hang-in") sound.drop();
		};
		document.addEventListener("transitionend", onTransitionEnd);
		document.addEventListener("animationend", onAnimationEnd);
		return () => {
			document.removeEventListener("transitionend", onTransitionEnd);
			document.removeEventListener("animationend", onAnimationEnd);
		};
	}, []);

	// The menu makes a sound when it opens or closes (not on the first
	// render)
	const navOpenedBefore = useRef(false);
	useEffect(() => {
		if (!navOpenedBefore.current && !navOpen) return;
		navOpenedBefore.current = true;
		sound.menu(navOpen);
	}, [navOpen]);

	// Sound on/off (the button under the "?"), kept in this browser
	const [muted, setMutedState] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setMutedState(sound.isMuted()), 0);
		const stop = sound.onMutedChange(setMutedState);
		return () => {
			clearTimeout(timer);
			stop();
		};
	}, []);

	// Clicking a hanging button (dashed border = clickable, on any page) gives
	// it a tiny tug: it dips down a little and springs back. Hanging
	// things are the ones with string spans (bg-black/60) as direct children,
	// so this finds the nearest one around the clicked button. Solid-bordered
	// labels aren't clickable, so they don't move
	useEffect(() => {
		const onPointerDown = (e: PointerEvent) => {
			const dashed =
				e.target instanceof Element
					? e.target.closest(".border-dashed:not(:disabled)")
					: null;
			// Things marked data-no-tug (like the notebook's colors) stay still
			if (dashed?.closest("[data-no-tug]")) return;
			let el = dashed;
			while (el && el !== document.body) {
				if (el.querySelector(':scope > span[class*="bg-black/60"]')) break;
				el = el.parentElement;
			}
			if (!el || el === document.body) return;
			if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			// "add" stacks the dip on top of the translate it already has (like
			// -translate-x-[50%] for centring), so it never shifts sideways
			el.getAnimations()
				.filter((a) => a.id === "tug")
				.forEach((a) => a.cancel());
			const tug = el.animate(
				[
					{ translate: "0 0" },
					{ translate: "0 0.8svh", offset: 0.25 },
					{ translate: "0 -0.3svh", offset: 0.55 },
					{ translate: "0 0.1svh", offset: 0.8 },
					{ translate: "0 0" },
				],
				{ duration: 450, easing: "ease-out", composite: "add" },
			);
			tug.id = "tug";
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
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
		sound.whoosh(duration);
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
		sound.rip();
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
		openingLoading.current ??= decodeFrames(
			isPhone() ? OPENING_FRAMES_SMALL : OPENING_FRAMES,
		).then((b) => {
			bitmaps.current.opening = b;
			// Ticket was clicked while the frames were still loading
			if (enteredRef.current && curtainDelayDone.current) openCurtains();
		});
		return openingLoading.current;
	};

	const enter = () => {
		if (enteredRef.current) return;
		enteredRef.current = true;
		// The first click is what lets the browser play sound: wake it up
		// and start the music
		sound.unlock();
		sound.startMusic();
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
					decodeFrames(isPhone() ? CLOSING_FRAMES_SMALL : CLOSING_FRAMES).then(
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
		sound.whoosh(ANIMATION_MS);
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

	// For real links (<a href>) that should still go through the curtains on
	// a plain click; a click with a modifier key (new tab etc.) is left alone
	const linkClick =
		(href: string, before?: () => void) =>
		(e: React.MouseEvent<HTMLAnchorElement>) => {
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();
			before?.();
			goTo(href);
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
				keepDrawing,
			}}
		>
			<div className="relative h-svh overflow-clip">
				<button
					onClick={() => setNavOpen((open) => !open)}
					aria-expanded={navOpen}
					aria-controls="nav"
					aria-label={navOpen ? "Close menu" : "Open menu"}
					className="fixed top-[0.5svh] right-[0.5vw] text-[4svh] font-extrabold cursor-pointer z-[23] w-[3.5vw] h-[3.5vw] min-w-[44px] min-h-[44px] portrait:top-[1.5vw] portrait:right-[1.5vw] portrait:text-[2.6svh] bg-white border-dashed border-[0.2vw] portrait:border-[0.6vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
					?
				</button>

				{/* Sound on/off - same look as the "?", just under it */}
				<button
					onClick={() => {
						sound.unlock();
						sound.setMuted(!muted);
					}}
					aria-pressed={!muted}
					aria-label={muted ? "Turn sound on" : "Turn sound off"}
					title={muted ? "Sound off" : "Sound on"}
					className="fixed top-[calc(1.5svh+max(3.5vw,44px))] right-[0.5vw] portrait:top-[calc(3vw+max(3.5vw,44px))] portrait:right-[1.5vw] text-[3svh] portrait:text-[2.4svh] cursor-pointer z-[23] w-[3.5vw] h-[3.5vw] min-w-[44px] min-h-[44px] bg-white border-dashed border-[0.2vw] portrait:border-[0.6vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
					{/* A music note, crossed out while sound is off */}
					<svg
						aria-hidden
						viewBox="0 0 24 24"
						className="w-[55%] h-[55%]"
						fill="none"
						stroke="black"
						strokeWidth="2.2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<ellipse cx="8" cy="18" rx="3.6" ry="2.8" fill="black" />
						<path d="M11.4 17.5 V4 c2.5 1.5 5.5 2.2 6.5 5.5" />
						{muted && <path d="M3 3 L21 21" />}
					</svg>
				</button>

				{/* The pop-up's text for screen readers - always on the page, so
				    a new note is announced when it changes */}
				<p role="status" aria-live="polite" className="sr-only">
					{note?.text}
				</p>

				{/* Inventory pop-up - just left of the "?", whenever something is
				    added, sold or given. Clicking it opens the inventory */}
				{note && (
					<button
						key={note.id}
						onClick={() => {
							setNote(null);
							setNavOpen(true);
						}}
						className="note-pop fixed top-[1svh] right-[4.8vw] portrait:top-[2vw] portrait:right-[16vw] z-[23] max-w-[40vw] portrait:max-w-[66vw] text-[2.5svh] portrait:text-[1.8svh] text-left scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] cursor-pointer drop-shadow-lg drop-shadow-black/60"
					>
						{note.text}, click to view {"->"}
					</button>
				)}

				{/* Back - same look as the "?", in the top-left corner */}
				{back && (
					<a
						href={back}
						onClick={(e) => {
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
								return;
							e.preventDefault();
							goBack();
						}}
						aria-label="Back"
						className="fixed top-[0.5svh] left-[0.5vw] text-[3.75svh] font-extrabold cursor-pointer z-[23] w-[3.5vw] h-[3.5vw] min-w-[44px] min-h-[44px] portrait:top-[1.5vw] portrait:left-[1.5vw] portrait:text-[2.4svh] bg-white border-dashed border-[0.2vw] portrait:border-[0.6vw] rounded-full items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
					>
						{"<-"}
					</a>
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

				{/* Nav - header.png's bottom rests 10svh above the bottom of the page.
			    Closed, it's pushed up by 90svh so it sits fully above the screen.
			    Sits above the curtains, buttons (z-20) and backdrop (z-21),
			    under the "?" (z-23) */}
				<nav
					id="nav"
					inert={!navOpen}
					className={`${navGliding ? "nav-smooth" : "nav-bounce"} fixed inset-x-0 bottom-[10svh] z-[22] drop-shadow-lg drop-shadow-black/40 ${navOpen ? "test-shadow-darker" : ""}`}
					style={{
						// "View all items" drops it one more row, so the second row
						// shows
						transform: navOpen
							? allItems
								? `translateY(calc${ROW})`
								: "translateY(0)"
							: "translateY(-90svh)",
					}}
				>
					{/* Hidden scribble ("nothing to see here"). The nav's bottom edge
					    rests 90svh down the screen, so bottom-[90svh] puts this right
					    above the top of the screen when the nav is open - out of
					    sight. It rides along with the nav, so it only peeks in at
					    the lowest point of the bounce (the spring in .nav-bounce
					    dips 8svh - exactly this image's height), then slides back out as
					    the nav settles. Keep the two in sync: see .nav-bounce */}
					{pageLoaded && (
						<img
							src={asset("/imgs/hidden-scribble.webp")}
							fetchPriority="low"
							className="absolute bottom-[90svh] left-0 w-screen h-[8svh] max-w-none pointer-events-none"
							// Gone at once while it's dropped further for "View all" -
							// and only back once the menu has moved back up (the
							// length of .nav-bounce), so it's never seen then
							style={{
								opacity: allItems ? 0 : 1,
								transition: allItems ? "none" : "opacity 0s 1100ms",
							}}
							alt=""
							aria-hidden
						/>
					)}

					{/* White above the header, for when it's dropped further down for
					    "View all items" (the header's top is white too) */}
					<div className="absolute bottom-full inset-x-0 h-[60svh] bg-white -mb-px" />

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
							// Portrait screens are too narrow for its height, so it's
							// made taller there and cropped to its middle instead
							className="w-screen block portrait:h-[85svh] portrait:object-cover portrait:object-bottom"
							alt="Theatre curtain valance"
						/>
					)}

					{/* Nav content - sits in the solid area above the curtain swags */}
					{/* With "View all", the menu drops a row but this moves back up
					    by the same amount, with the same spring, so everything here
					    stays still while the second row fades in below */}
					<div
						className={`${navGliding ? "nav-smooth" : "nav-bounce"} absolute inset-x-0 bottom-[45%] flex flex-col items-center gap-[2svh] text-[3svh] pt-[3svh]`}
						style={{
							transform: allItems ? `translateY(calc(-1 * ${ROW}))` : "none",
						}}
					>
						{/* 	{pageLoaded && (
							<img
								src={asset("/imgs/bag.webp")}
								srcSet={srcSet([
									["/imgs/bag-450.webp", 450],
									["/imgs/bag.webp", 900],
								])}
								sizes="18vw"
								fetchPriority="low"
								className="w-[18vw] absolute right-[8vw] top-[-9svh] test-shadow-darker"
								alt=""
							/>
						)} */}
						{/* Inventory - a row of six square slots: your money (the
						    bills fanned out, with the total), then one slot per thing
						    you can buy - filled in the order you bought them, the rest
						    empty */}
						{/* Pages (left) and the inventory (right), side by side - on
						    portrait screens, one above the other */}
						<div className="flex portrait:flex-col items-end portrait:items-center gap-[3vw] portrait:gap-[2.5svh]">
							{/* Pages - a link to every page, with its title, in two
							    columns. Same height as a row of the inventory (and as
							    wide as the screen leaves room for). The page you're on
							    is marked */}
							<section className="flex flex-col items-center gap-[2svh] portrait:gap-[1svh]">
								<h2 className="text-[4svh] portrait:text-[3svh]">Pages</h2>
								<ol className="h-[var(--slot)] w-[min(54svh,calc(96vw-4*var(--slot)-3*var(--slot-gap)-3vw))] portrait:h-auto portrait:w-[87.5vw] px-[1.5svh] py-[1.2svh] grid grid-cols-2 grid-rows-[repeat(4,auto)] grid-flow-col content-center gap-x-[2vw] portrait:gap-x-[3vw] gap-y-[0.6svh] bg-white/20 border-[0.3svh] border-black border-dashed text-[2.4svh] portrait:text-[2svh] leading-[1.2]">
									{PAGES.map(({ title, href }, i) => {
										const n = i + 1;
										const here = pathname === href;
										return (
											<li key={href}>
												<a
													href={href}
													onClick={(e) => {
														if (here) {
															e.preventDefault();
															setNavOpen(false);
															return;
														}
														linkClick(href, () => setNavOpen(false))(e);
													}}
													aria-current={here ? "page" : undefined}
													className={`block py-[0.15svh] cursor-pointer hover:underline decoration-dashed underline-offset-4 ${here ? "underline" : ""}`}
												>
													{here ? "-> " : `${n}. `}
													{title}
												</a>
											</li>
										);
									})}
								</ol>
							</section>

							<section className="flex flex-col items-center gap-[2svh] portrait:gap-[1svh]">
								{/* The title, and a small "view all" label next to it once
								    there are more items than one row shows: drops the menu
								    a row further so the second row shows (and back) */}
								<div className="flex items-baseline gap-[1.2vw] portrait:gap-[3vw]">
									<h2 className="text-[4svh] portrait:text-[3svh]">
										Inventory
									</h2>
									{canViewAll && (
										<button
											onClick={() => {
												glideNav();
												setAllItems(!allItems);
												if (openItem) closeItem();
											}}
											aria-pressed={allItems}
											className="relative text-[2svh] portrait:text-[1.7svh] bg-white border-[0.2svh] border-black border-dashed px-[0.8vw] portrait:px-[2vw] cursor-pointer"
										>
											{allItems ? "view less" : "view all"}
										</button>
									)}
								</div>
								{/* One row tall: the second row hangs below it, fading in and
						    out with "View all" */}
								<ul className="relative grid grid-cols-4 auto-rows-[var(--slot)] h-[var(--slot)] gap-[var(--slot-gap)]">
									{/* Money - click it to see what it's for */}
									<li
										className="relative w-[var(--slot)] h-[var(--slot)] bg-white/20 border-[0.3svh] border-black border-dashed transition-opacity duration-300 cursor-pointer"
										style={{ opacity: itemOpen ? 0 : 1 }}
										onClick={() => showItem("money", 0)}
										onKeyDown={(e) => {
											if (e.key === "Enter" || e.key === " ")
												showItem("money", 0);
										}}
										role="button"
										tabIndex={0}
										aria-label={`$${money} - ${bills.fives} $5 bills and ${bills.ones} $1 bills - details`}
									>
										{moneyBills.map((src, i, all) => (
											<img
												key={i}
												src={src}
												className="absolute top-[50%] h-[82%] w-auto max-w-none -translate-x-[50%] -translate-y-[50%] test-shadow-darker"
												style={{
													// Fanned out around the middle of the slot
													left: `${50 + (i - (all.length - 1) / 2) * 12}%`,
													rotate: `${(i - (all.length - 1) / 2) * 8}deg`,
												}}
												alt=""
											/>
										))}
										<span className="absolute bottom-[0.5svh] right-[0.5vw] bg-white border-[0.2svh] border-black px-[0.5vw] text-[2.5svh] leading-tight">
											${money}
										</span>
									</li>
									{Array.from({ length: ALL_SLOTS }, (_, i) => entries[i]).map(
										(entry, i) => {
											const hidden = i >= SLOTS && !allItems;
											return (
												<li
													key={entry?.key ?? `empty-${i}`}
													inert={hidden}
													className="relative w-[var(--slot)] h-[var(--slot)] bg-white/20 border-[0.3svh] border-black border-dashed flex items-center justify-center"
													style={{
														opacity: itemOpen || hidden ? 0 : 1,
														// The second row fades in as the menu glides down,
														// and out quickly
														transition: `opacity ${hidden ? 200 : 450}ms ease ${i >= SLOTS && !hidden && !itemOpen ? 150 : 0}ms`,
													}}
													aria-label={entry ? undefined : "Empty slot"}
												>
													{entry && (
														<button
															onClick={() => showItem(entry.key, i + 1)}
															className="w-full h-full flex items-center justify-center cursor-pointer"
															aria-label={`${entry.name} - details`}
														>
															<img
																src={entry.image}
																className="max-h-[90%] max-w-[90%] w-auto h-auto test-shadow-darker"
																alt={entry.name}
																title={entry.name}
															/>
														</button>
													)}
												</li>
											);
										},
									)}

									{/* An opened item - starts exactly over its slot, then
							    stretches across the whole row (both rows, while "view
							    all" is on) while the other slots fade out */}
									{openItem && opened && (
										<li
											// Taller on portrait screens, with the picture above the
											// text, since the row is so narrow there
											className="absolute h-[var(--slot)] portrait:h-auto portrait:min-h-[calc(2*var(--slot)+var(--slot-gap))] bg-white/80 border-[0.3svh] border-black border-dashed flex portrait:flex-col items-center portrait:items-start gap-[2vw] px-[2svh] portrait:p-[3vw] overflow-hidden"
											style={{
												transition: ["left", "width", "top", "height"]
													.map(
														(property) =>
															`${property} 400ms cubic-bezier(0.34, 1.1, 0.64, 1)`,
													)
													.join(", "),
												// It grows from its slot across the whole row - or,
												// while both rows are showing, over both of them
												top:
													itemOpen && allItems
														? "0"
														: `calc(${Math.floor(openItem.slot / 4)} * ${ROW})`,
												left: itemOpen
													? "0"
													: `calc(${openItem.slot % 4} * ${ROW})`,
												width: itemOpen ? "100%" : "var(--slot)",
												height:
													itemOpen && allItems
														? "calc(2 * var(--slot) + var(--slot-gap))"
														: undefined,
											}}
										>
											{/* Money shows its bills fanned out, like in its slot */}
											{opened.key === "money" ? (
												<div className="relative h-[18svh] w-[18svh] portrait:h-[15vw] portrait:w-[22vw] shrink-0">
													{moneyBills.map((src, i, all) => (
														<img
															key={i}
															src={src}
															className="absolute top-[50%] h-[15svh] w-auto max-w-none -translate-x-[50%] -translate-y-[50%] test-shadow-darker"
															style={{
																left: `${50 + (i - (all.length - 1) / 2) * 12}%`,
																rotate: `${(i - (all.length - 1) / 2) * 8}deg`,
															}}
															alt=""
														/>
													))}
												</div>
											) : (
												<>
													{/* Art can be clicked to view it big */}
													<img
														src={opened.image}
														onClick={
															opened.art
																? () => {
																		closeItem();
																		setNavOpen(false);
																		setViewing({
																			image: opened.image,
																			name: opened.name,
																		});
																	}
																: undefined
														}
														className={`h-[18svh] w-auto max-w-[18svh] portrait:h-[15vw] portrait:max-w-[30vw] object-contain test-shadow-darker ${opened.art ? "cursor-zoom-in" : ""}`}
														alt={opened.name}
													/>
												</>
											)}
											<div
												className="flex flex-col gap-[1svh] text-left transition-opacity duration-300"
												style={{ opacity: itemOpen ? 1 : 0 }}
											>
												<h3 className="text-[3svh] portrait:text-[2.4svh]">
													{opened.name}
												</h3>
												<p className="text-[2.2svh] portrait:text-[1.8svh] leading-snug max-w-[45vw] portrait:max-w-none">
													{opened.description}
												</p>
												<div className="flex flex-wrap gap-[1vw] portrait:gap-[2vw]">
													{opened.item === "notebook" && (
														<button
															onClick={() => {
																closeItem();
																setNavOpen(false);
																setNotebookOpen(true);
															}}
															className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
														>
															Use
														</button>
													)}
													{opened.art && (
														<button
															onClick={() => {
																closeItem();
																setNavOpen(false);
																setViewing({
																	image: opened.image,
																	name: opened.name,
																});
															}}
															className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
														>
															View
														</button>
													)}
													{opened.item && opened.price > 0 && (
														<button
															onClick={() => sell(opened.item!)}
															className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
														>
															Sell for ${opened.price}
														</button>
													)}
													<button
														onClick={closeItem}
														className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
													>
														Close
													</button>
												</div>
											</div>
										</li>
									)}
								</ul>
							</section>
						</div>
					</div>
				</nav>

				{notebookOpen && <Notebook onClose={() => setNotebookOpen(false)} />}
				{viewing && <ArtViewer {...viewing} onClose={() => setViewing(null)} />}

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
						className="w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none fixed z-10 pointer-events-none scene-shadow"
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
						className="w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none fixed z-30"
						alt="Closed theatre curtains"
					/>
				)}

				{/* Ticket - click it to open the curtains and enter */}
				{ticket !== "gone" && (
					<button
						onClick={enter}
						disabled={ticket !== "waiting"}
						className={`fixed top-[40svh] left-[20vw] portrait:left-[10vw] z-40 cursor-pointer disabled:cursor-default drop-shadow-lg drop-shadow-black/60 test-shadow-darkest ${ticket === "waiting" ? "ticket-shake" : ""}`}
						aria-label="Enter"
					>
						<img
							src={asset("/imgs/ticket2.webp")}
							// Shown at 50vw (80vw on portrait screens) - smaller screens get the
							// 700px version
							srcSet={srcSet([
								["/imgs/ticket2-700.webp", 700],
								["/imgs/ticket2.webp", 1400],
							])}
							sizes="(orientation: portrait) 80vw, 50vw"
							fetchPriority="high"
							className="w-[50vw] portrait:w-[80vw] block"
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
			    idle) so a click only has to draw, not show/hide anything. On
			    portrait screens all the curtains are a quarter wider than the
			    screen, so the side drapes don't cover so much of it */}
				<canvas
					ref={canvasRef}
					className="w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none fixed z-30 pointer-events-none scene-shadow"
				/>

				{/* Content - no z-index here, so it doesn't form a stacking context:
			    curtains (z-10) sit above it, buttons (z-20) sit above curtains,
			    and the animation (z-30) covers everything */}
				<main className="bg-white/0 border-[0.3svh] border-black/0 w-[65vw] h-[75svh] mx-auto top-[25svh] portrait:w-full portrait:h-[80svh] portrait:top-[20svh] relative">
					{children}
				</main>

				{/* Background */}
				<div className="-z-10 fixed top-0 left-0 h-svh w-screen">
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
