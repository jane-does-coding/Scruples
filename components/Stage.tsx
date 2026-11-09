"use client";

import {
	createContext,
	useContext,
	useEffect,
	useLayoutEffect,
	useRef,
	useState,
	type CSSProperties,
	type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import ArtViewer from "@/components/ArtViewer";
import Notebook from "@/components/Notebook";
import { PhoneCard } from "@/components/Opening";
import usePortrait from "@/components/usePortrait";
import { asset, srcSet } from "@/lib/asset";
import { opaqueAt } from "@/lib/opaque";
import { STORY_PAGES, storyHref } from "@/lib/pages";
import { usePlaytimeCounter } from "@/lib/playtime";
import { setReadable, useReadableFont } from "@/lib/font";
import { ALWAYS_PLAY_OPENING } from "@/lib/site";
import * as sound from "@/lib/sound";
import {
	BILL_IMAGES,
	ITEMS,
	STARTING_MONEY,
	billsFor,
	HATS,
	type HatId,
	type ItemId,
} from "@/lib/shop";

const ANIMATION_MS = 700;
const ROUTE_OPEN_MS = 1000;
const ROUTE_OPEN_DELAY_MS = 150;

const frames = (name: string, count: number) =>
	Array.from({ length: count }, (_, i) =>
		asset(`/imgs/stage/${name}/${String(i).padStart(2, "0")}.webp`),
	);

const CLOSING_FRAMES = frames("closing", 10);
const OPENING_FRAMES = frames("opening", 12);
const CLOSING_FRAMES_SMALL = frames("closing-800", 10);
const OPENING_FRAMES_SMALL = frames("opening-800", 12);
const isPhone = () => Math.min(window.innerWidth, window.innerHeight) <= 500;
const RIPPING_FRAMES = frames("ripping", 21);
const RIPPING_FRAMES_SMALL = frames("ripping-700", 21);
const RIP_WAIT_MAX_MS = 4000;
const RIPPING_FRAME_MS = 30;
const CURTAIN_DELAY_MS = 300;
const LIGHTS_DOWN_AT_MS = 500;
const PHONE_CARD_AT_MS = 1600;
const PHONE_CARD_LIFT_MS = 600;
const OPENING_SEEN_KEY = "scruples-opening-seen";
const PROGRESS_KEY = "scruples-progress";
const ONLY_ONE: Partial<Record<ItemId, ItemId>> = {
	prize: "honorable-mention",
	"honorable-mention": "prize",
};

const backHref = (pathname: string) => {
	const n = STORY_PAGES.findIndex((p) => p.href === pathname) + 1;
	if (n) return n > 1 ? storyHref(n - 1) : null;
	if (pathname.startsWith("/art-piece/")) return "/zhenya-likes-art";
	return null;
};

export type BuyResult = "bought" | "already-owned" | "not-enough-money";

type StageContextValue = {
	curtainsOpen: boolean;
	goTo: (href: string) => void;
	money: number;
	owned: ItemId[];
	buy: (item: ItemId) => BuyResult;
	give: (item: ItemId) => void;
	donate: (amount: number) => void;
	keepDrawing: (drawing: Omit<Drawing, "key">) => void;
	myDrawing: string | null;
	hat: string | null;
	wearing: HatId | null;
	equip: (hat: HatId | null) => void;
	pins: string | null;
	ribbon: string | null;
	goBack: () => void;
	reached: number;
};

type Drawing = {
	key: string;
	name: string;
	image: string;
	description: string;
};

const SLOTS = 3;
const ITEM_GROW_MS = 400;
const ITEM_SHRINK_MS = 350;
const ITEM_FADE_MS = 200;
const NAV_GLIDE_MS = 650;
const NAV_REOPEN_MS = 800;
const TEST_ITEMS: ItemId[] = [
	"pins",
	"pens",
	"notebook",
	"mona-lisa",
	"daphne-drawing",
	"hats",
	"magic-drawing",
	"prize",
	"honorable-mention",
];
const ROW = "(var(--slot) + var(--slot-gap))";
const scatter = (n: number, j: number, which: number) => {
	const x = Math.sin(n * 12.9898 + j * 78.233 + which * 37.719) * 43758.5453;
	return (x - Math.floor(x)) * 2 - 1;
};

const MAIN_PAGES = STORY_PAGES.filter((p) => !("extra" in p));
const EXTRA_PAGES = STORY_PAGES.filter((p) => "extra" in p);

const PAGES = [...MAIN_PAGES, ...EXTRA_PAGES];

const PAGE_WINDOW = 10;

const INVENTORY_ARROW =
	"relative text-[2svh] portrait:text-[1.7svh] bg-white border-[0.2svh] border-black border-dashed px-[0.8vw] portrait:px-[2vw] cursor-pointer disabled:opacity-30 disabled:cursor-default";

const NOTE =
	"note-pop fixed top-[0.5svh] right-[calc(1.3vw+max(6.5vw,72px))] portrait:top-[1.5vw] portrait:right-[22vw] z-23 max-w-[40vw] portrait:max-w-[66vw] text-[2.5svh] portrait:text-[1.8svh] text-left scribbler bg-white border-[0.3svh] border-black px-[1vw] py-[0.5svh] drop-shadow-lg drop-shadow-black/60";

const StageContext = createContext<StageContextValue | null>(null);

export const useStage = () => {
	const stage = useContext(StageContext);
	if (!stage) throw new Error("useStage must be used inside <Stage>");
	return stage;
};

export default function Stage({ children }: { children: ReactNode }) {
	const router = useRouter();
	const pathname = usePathname();

	const [animationStage, setAnimationStage] = useState<
		"loading" | "idle" | "closing" | "opening"
	>("loading");

	const [ticket, setTicket] = useState<
		"waiting" | "loading" | "ripping" | "gone"
	>("waiting");
	const enteredRef = useRef(false);
	const curtainDelayDone = useRef(false);

	const [lightsDown, setLightsDown] = useState(false);
	const [phoneCard, setPhoneCard] = useState(false);
	const openingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
	const openingDone = useRef<(() => void) | null>(null);
	const chooseSound = (on: boolean) => {
		if (!openingDone.current) return;
		sound.setMuted(!on);
		try {
			localStorage.setItem(OPENING_SEEN_KEY, "1");
		} catch {}
		setPhoneCard(false);
		openingTimers.current.push(
			setTimeout(openingDone.current, PHONE_CARD_LIFT_MS),
		);
		openingDone.current = null;
	};
	const ripCanvasRef = useRef<HTMLCanvasElement>(null);
	const ripFrames = useRef<ImageBitmap[]>([]);

	const [navOpen, setNavOpen] = useState(false);

	const [money, setMoney] = useState(STARTING_MONEY);
	const [owned, setOwned] = useState<ItemId[]>(TEST_ITEMS);
	const [note, setNote] = useState<{
		text: string;
		id: number;
		link: boolean;
	} | null>(null);
	const noteTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const notify = (text: string, link = true) => {
		setNote((n) => ({ text, link, id: (n?.id ?? 0) + 1 }));
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
		setOwned([...owned.filter((i) => i !== ONLY_ONE[item]), item]);
		if (item === "honorable-mention") setRibbonOn(true);
		notify(
			item === "honorable-mention"
				? "Zhenya is wearing the honorable mention"
				: `${ITEMS[item].name} was added to inventory`,
		);
		itemAdded();
	};
	const donate = (amount: number) => {
		if (amount <= 0) return;
		setMoney((m) => m - amount);
		notify(`You gave Daphne $${amount}`);
	};
	const openBox = () => {
		setOwned(owned.map((i) => (i === "mystery-box" ? "hats" : i)));
		sound.unbox();
		notify(`You found ${Object.keys(HATS).length} hats!`, false);
		closeItem();
		openWardrobe();
	};
	const [wearing, setWearing] = useState<HatId | null>(null);
	const [wardrobeFrom, setWardrobeFrom] = useState("/souvenir-shop");
	const openWardrobe = () => {
		setNavOpen(false);
		if (pathname === "/wardrobe") return;
		setWardrobeFrom(pathname);
		goTo("/wardrobe");
	};
	const equip = (hat: HatId | null) => {
		if (hat === wearing) return;
		setWearing(hat);
		notify(
			hat
				? `Zhenya is wearing the ${HATS[hat].name}`
				: `Zhenya took off the ${HATS[wearing!].name}`,
			false,
		);
	};
	const [pinsOn, setPinsOn] = useState(false);
	const wearPins = (on: boolean) => {
		setPinsOn(on);
		notify(
			on
				? "Zhenya is wearing the button pins"
				: "Zhenya took off the button pins",
			false,
		);
		closeItem();
	};
	const [ribbonOn, setRibbonOn] = useState(false);
	const wearRibbon = (on: boolean) => {
		setRibbonOn(on);
		notify(
			on
				? "Zhenya is wearing the honorable mention"
				: "Zhenya took off the honorable mention",
			false,
		);
		closeItem();
	};
	const sell = (item: ItemId) => {
		setOwned(owned.filter((i) => i !== item));
		setMoney(money + ITEMS[item].price);
		notify(`${ITEMS[item].name} was sold for $${ITEMS[item].price}`);
		closeItem();
	};
	const bills = billsFor(money);
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
	const entries = [
		...owned.map((item) => ({
			key: item as string,
			item,
			art: "art" in ITEMS[item],
			...ITEMS[item],
		})),
		...drawings.map((d) => ({ ...d, item: null, price: 0, art: true })),
	];
	const [allItemsOn, setAllItemsState] = useState(false);
	const [navGliding, setNavGliding] = useState(false);
	const glideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
	const glideNav = () => {
		setNavGliding(true);
		clearTimeout(glideTimer.current);
		glideTimer.current = setTimeout(() => setNavGliding(false), NAV_GLIDE_MS);
	};
	const columns = 4;
	const rowSlots = columns - 1;
	const allSlots = columns * 2 - 1;
	const canViewAll = entries.length > rowSlots;
	const scrolling = entries.length > allSlots;
	const [scrollColumn, setScrollColumn] = useState(0);
	const SCROLL_COLUMNS = 3;
	const lastColumn = Math.max(
		Math.ceil(
			(Math.ceil((entries.length + 1) / 2) - columns) / SCROLL_COLUMNS,
		) * SCROLL_COLUMNS,
		0,
	);
	const firstColumn = Math.min(scrollColumn, lastColumn);
	const cells = Array.from({ length: columns * 2 }, (_, k) => {
		const g = scrolling
			? (firstColumn + (k % columns)) * 2 + Math.floor(k / columns)
			: k;
		return { g, entry: g > 0 ? entries[g - 1] : undefined };
	});
	const scrollInventory = (direction: number) => {
		if (openItem) closeItem();
		setScrollColumn(
			Math.max(
				0,
				Math.min(firstColumn + direction * SCROLL_COLUMNS, lastColumn),
			),
		);
	};
	const [allPages, setAllPages] = useState(false);
	const reopening = useRef(false);
	const reopenNav = (all: boolean) => {
		if (openItem) closeItem();
		reopening.current = true;
		setNavOpen(false);
		setTimeout(() => {
			setAllPages(all);
			setNavOpen(true);
			reopening.current = false;
		}, NAV_REOPEN_MS);
	};
	useEffect(() => {
		if (navOpen || reopening.current) return;
		const timer = setTimeout(() => setAllPages(false), NAV_GLIDE_MS);
		return () => clearTimeout(timer);
	}, [navOpen]);
	const itemRows = (allItemsOn && canViewAll) || scrolling;
	const tallPages = (allPages || itemRows) && PAGES.length > PAGE_WINDOW;
	const allItems = itemRows || tallPages;
	const twoRows = tallPages || scrolling;
	const pageAt = PAGES.findIndex((p) => p.href === pathname);
	const parentAt = PAGES.findIndex((p) => p.href === backHref(pathname));
	const windowLength = tallPages
		? PAGES.length
		: Math.min(PAGES.length, PAGE_WINDOW);
	const windowStart = tallPages
		? 0
		: Math.min(
				Math.max(
					(pageAt >= 0 ? pageAt : Math.max(parentAt, 0)) -
						(PAGE_WINDOW / 2 - 1),
					0,
				),
				PAGES.length - windowLength,
			);
	const windowPages = PAGES.map((p, i) => ({ ...p, i })).slice(
		windowStart,
		windowStart + windowLength,
	);
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
	const itemAdded = () => {
		if (owned.length + drawings.length + 1 > SLOTS) setAllItems(true);
	};
	const [notebookOpen, setNotebookOpen] = useState(false);
	const [viewing, setViewing] = useState<{
		image: string;
		name: string;
	} | null>(null);

	const [openItem, setOpenItem] = useState<{
		key: string;
		slot: number;
	} | null>(null);
	const [itemOpen, setItemOpen] = useState(false);
	const portrait = usePortrait();
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
	const [itemFading, setItemFading] = useState(false);
	const [settlingSlot, setSettlingSlot] = useState<number | null>(null);
	const closeItem = () => {
		const slot = openItem?.slot ?? null;
		setItemOpen(false);
		setTimeout(() => setItemFading(true), ITEM_SHRINK_MS);
		setTimeout(() => {
			setSettlingSlot(slot);
			setOpenItem(null);
			setItemFading(false);
			setTimeout(() => setSettlingSlot(null), 100);
		}, ITEM_SHRINK_MS + ITEM_FADE_MS);
	};
	const instantSlot = (k: number) => openItem?.slot === k || settlingSlot === k;
	const slotsHidden = !!openItem && !itemFading;

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

	useEffect(() => {
		const STRING = 'span[class*="bg-black/60"][class*="w-[0.1vw]"]';
		const PANEL =
			'[class*="bg-white"][class*="border-black"]:not([class*="bg-white/0"]), [data-panel]';
		const layerOf = (el: Element) => {
			const z = parseInt(getComputedStyle(el).zIndex);
			return Number.isNaN(z) ? 0 : z;
		};
		const branches = (a: Element, b: Element) => {
			let lower: Element | null = a;
			while (lower && !lower.parentElement?.contains(b))
				lower = lower.parentElement;
			const common = lower?.parentElement;
			if (!lower || !common) return null;
			let upper: Element | null = b;
			while (upper && upper.parentElement !== common)
				upper = upper.parentElement;
			return upper ? { lower, upper } : null;
		};
		const canStack = (el: Element) => {
			const cs = getComputedStyle(el);
			if (cs.display === "contents") return false;
			if (cs.position !== "static") return true;
			const parent = el.parentElement && getComputedStyle(el.parentElement);
			return !!parent && /flex|grid/.test(parent.display);
		};
		const raised = new Map<HTMLElement, string>();
		const visible = (el: Element, r: DOMRect) => {
			if (!r.width || !r.height || r.bottom <= 0 || r.top >= innerHeight)
				return false;
			const cs = getComputedStyle(el);
			return cs.visibility === "visible" && cs.opacity !== "0";
		};
		const order = () => {
			raised.forEach((z, el) => (el.style.zIndex = z));
			raised.clear();
			const strings = [...document.querySelectorAll<HTMLElement>(STRING)];
			if (!strings.length) return;
			const panels = [...document.querySelectorAll(PANEL)].flatMap((el) => {
				const r = el.getBoundingClientRect();
				return visible(el, r) ? [{ el, r }] : [];
			});
			const pairs: { lower: Element; upper: HTMLElement }[] = [];
			strings.forEach((string) => {
				const r = string.getBoundingClientRect();
				if (!r.height) return;
				const x = r.left + r.width / 2;
				const owner =
					string.parentElement?.closest(PANEL) ?? string.parentElement;
				if (!owner) return;
				const ownerRect = owner.getBoundingClientRect();
				if (!visible(owner, ownerRect)) return;
				const layer = string.closest("[aria-modal]");
				panels.forEach(({ el: panel, r: p }) => {
					if (
						panel.closest("[aria-modal]") !== layer ||
						panel.contains(string) ||
						owner.contains(panel) ||
						panel.contains(owner) ||
						x < p.left ||
						x > p.right ||
						p.bottom <= r.top ||
						p.top >= r.bottom ||
						p.top >= ownerRect.top
					)
						return;
					const pair = branches(string, panel);
					if (pair && canStack(pair.upper))
						pairs.push({
							lower: pair.lower,
							upper: pair.upper as HTMLElement,
						});
				});
			});
			for (let pass = 0; pass < 8; pass++) {
				let changed = false;
				pairs.forEach(({ lower, upper }) => {
					const below = layerOf(lower);
					const above = layerOf(upper);
					const after =
						lower.compareDocumentPosition(upper) &
						Node.DOCUMENT_POSITION_FOLLOWING;
					if (above > below || (above === below && after)) return;
					if (!raised.has(upper)) raised.set(upper, upper.style.zIndex);
					upper.style.zIndex = `${below + 1}`;
					changed = true;
				});
				if (!changed) break;
			}
		};
		let frame = 0;
		const schedule = () => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(order);
		};
		const observer = new MutationObserver(schedule);
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: true,
			attributeFilter: ["class"],
		});
		window.addEventListener("resize", schedule);
		document.addEventListener("transitionend", schedule, true);
		document.addEventListener("animationend", schedule, true);
		schedule();
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("resize", schedule);
			document.removeEventListener("transitionend", schedule, true);
			document.removeEventListener("animationend", schedule, true);
		};
	}, []);

	const navOpenedBefore = useRef(false);
	useEffect(() => {
		if (!navOpenedBefore.current && !navOpen) return;
		navOpenedBefore.current = true;
		sound.menu(navOpen);
	}, [navOpen]);

	const readableFont = useReadableFont();
	const [muted, setMutedState] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setMutedState(sound.isMuted()), 0);
		const stop = sound.onMutedChange(setMutedState);
		return () => {
			clearTimeout(timer);
			stop();
		};
	}, []);

	useEffect(() => {
		const tug = (el: Element) => {
			el.getAnimations()
				.filter((a) => a.id === "tug")
				.forEach((a) => a.cancel());
			const dip = el.animate(
				[
					{ translate: "0 0" },
					{ translate: "0 0.8svh", offset: 0.25 },
					{ translate: "0 -0.3svh", offset: 0.55 },
					{ translate: "0 0.1svh", offset: 0.8 },
					{ translate: "0 0" },
				],
				{ duration: 450, easing: "ease-out", composite: "add" },
			);
			dip.id = "tug";
		};
		const onPointerDown = (e: PointerEvent) => {
			const dashed =
				e.target instanceof Element
					? e.target.closest(".border-dashed:not(:disabled)")
					: null;
			if (!dashed || dashed.closest("[data-no-tug]")) return;
			if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
			const partnerId = dashed.getAttribute("data-tug-with");
			const partner = partnerId && document.getElementById(partnerId);
			if (partner) {
				tug(dashed);
				tug(partner);
				return;
			}
			let el: Element | null = dashed;
			while (el && el !== document.body) {
				if (el.querySelector(':scope > span[class*="bg-black/60"]')) break;
				el = el.parentElement;
			}
			if (!el || el === document.body) return;
			tug(el);
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
		setLightsDown(false);
		sound.startMusic();
		setAnimationStage("opening");
		sound.whoosh(duration);
		playFrames(
			bitmaps.current.opening,
			() => setAnimationStage("idle"),
			duration,
		);
	};

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
			if (enteredRef.current && curtainDelayDone.current) openCurtains();
		});
		return openingLoading.current;
	};

	const curtainsUp = () => {
		curtainDelayDone.current = true;
		if (bitmaps.current.opening.length) openCurtains();
	};

	const playOpening = () => {
		sound.startMurmur();
		const at = (ms: number, then: () => void) =>
			openingTimers.current.push(setTimeout(then, ms));
		at(LIGHTS_DOWN_AT_MS, () => {
			setLightsDown(true);
			sound.hushMurmur();
		});
		at(PHONE_CARD_AT_MS, () => {
			sound.chime();
			setPhoneCard(true);
		});
		openingDone.current = () => {
			sound.hushMurmur(600);
			curtainsUp();
		};
	};

	const enter = () => {
		if (enteredRef.current) return;
		enteredRef.current = true;
		sound.unlock();
		loadOpening();
		let seen = true;
		try {
			seen =
				!ALWAYS_PLAY_OPENING && localStorage.getItem(OPENING_SEEN_KEY) === "1";
		} catch {}

		const ripThenOpen = () => {
			playRipping();
			if (!seen) playOpening();
			else setTimeout(curtainsUp, CURTAIN_DELAY_MS);
		};

		if (ripFrames.current.length) {
			ripThenOpen();
			return;
		}
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

		const timers = openingTimers.current;
		return () => {
			clearTimeout(delay);
			window.removeEventListener("load", afterLoad);
			if (frameTimer.current) clearInterval(frameTimer.current);
			timers.forEach(clearTimeout);
		};
	}, []);

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

	const openOnNewRoute = useRef(false);

	const goTo = (href: string) => {
		router.prefetch(href);
		const closing = closeCurtains(() => {
			openOnNewRoute.current = true;
			router.push(href);
		});
		if (!closing) router.push(href);
	};

	const linkClick =
		(href: string, before?: () => void) =>
		(e: React.MouseEvent<HTMLAnchorElement>) => {
			if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
			e.preventDefault();
			before?.();
			goTo(href);
		};

	const back = pathname === "/wardrobe" ? wardrobeFrom : backHref(pathname);
	const pageNumber = PAGES.findIndex((p) => p.href === pathname) + 1;

	useEffect(() => {
		const targetOf = (img: HTMLImageElement) =>
			img.closest<HTMLElement>("button, a") ?? img;
		const check = (x: number, y: number) => {
			const found = new Map<HTMLElement, { inside: boolean; hit: boolean }>();
			for (const img of document.querySelectorAll<HTMLImageElement>(
				"img[data-hit]",
			)) {
				const target = targetOf(img);
				const state = found.get(target) ?? { inside: false, hit: false };
				const box = img.getBoundingClientRect();
				if (
					x >= box.left &&
					x <= box.right &&
					y >= box.top &&
					y <= box.bottom
				) {
					state.inside = true;
					if (opaqueAt(img, x, y)) state.hit = true;
				}
				found.set(target, state);
			}
			return found;
		};
		let frame = 0;
		let last = { x: 0, y: 0 };
		const onMove = (e: PointerEvent) => {
			last = { x: e.clientX, y: e.clientY };
			if (frame) return;
			frame = requestAnimationFrame(() => {
				frame = 0;
				for (const [target, { inside, hit }] of check(last.x, last.y))
					target.style.pointerEvents = inside && !hit ? "none" : "";
			});
		};
		const onClick = (e: MouseEvent) => {
			if (e.detail === 0 || !(e.target instanceof Element)) return;
			for (const [target, { inside, hit }] of check(e.clientX, e.clientY)) {
				if (inside && !hit && target.contains(e.target)) {
					e.preventDefault();
					e.stopPropagation();
					return;
				}
			}
		};
		window.addEventListener("pointermove", onMove, { passive: true });
		window.addEventListener("click", onClick, true);
		return () => {
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("click", onClick, true);
			cancelAnimationFrame(frame);
		};
	}, []);

	useEffect(() => {
		const noDrag = (e: DragEvent) => {
			if (e.target instanceof Element && e.target.closest("img, a"))
				e.preventDefault();
		};
		document.addEventListener("dragstart", noDrag);
		return () => document.removeEventListener("dragstart", noDrag);
	}, []);

	usePlaytimeCounter();

	const [reached, setReached] = useState(0);
	const [progressLoaded, setProgressLoaded] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				const saved = JSON.parse(localStorage.getItem(PROGRESS_KEY) ?? "null");
				if (saved) {
					setReached((furthest) => Math.max(furthest, saved.reached ?? 0));
					setMoney(saved.money ?? STARTING_MONEY);
					setOwned([...new Set([...TEST_ITEMS, ...(saved.owned ?? [])])]);
					setDrawings(saved.drawings ?? []);
					setWearing(saved.wearing ?? null);
					setPinsOn(saved.pinsOn ?? false);
					setRibbonOn(saved.ribbonOn ?? false);
				}
			} catch {}
			setProgressLoaded(true);
		}, 0);
		return () => clearTimeout(timer);
	}, []);
	useEffect(() => {
		if (!progressLoaded) return;
		try {
			localStorage.setItem(
				PROGRESS_KEY,
				JSON.stringify({
					reached,
					money,
					owned,
					drawings,
					wearing,
					pinsOn,
					ribbonOn,
				}),
			);
		} catch {}
	}, [
		progressLoaded,
		reached,
		money,
		owned,
		drawings,
		wearing,
		pinsOn,
		ribbonOn,
	]);
	useEffect(() => {
		const timer = setTimeout(
			() => setReached((furthest) => Math.max(furthest, pageNumber)),
			0,
		);
		return () => clearTimeout(timer);
	}, [pageNumber]);
	const goBack = () => {
		if (!back || animationStage !== "idle") return;
		setNavOpen(false);
		goTo(back);
	};

	useEffect(() => {
		if (!openOnNewRoute.current) return;
		openOnNewRoute.current = false;
		setTimeout(() => openCurtains(ROUTE_OPEN_MS), ROUTE_OPEN_DELAY_MS);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [pathname]);

	const menuOnly: CSSProperties = {
		opacity: navOpen ? 1 : 0,
		visibility: navOpen ? "visible" : "hidden",
		transition: `opacity 300ms ease, visibility 0ms linear ${navOpen ? 0 : 300}ms, filter 900ms ease`,
	};

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
				myDrawing: drawings.at(-1)?.image ?? null,
				hat: wearing && owned.includes("hats") ? HATS[wearing].wear : null,
				wearing,
				equip,
				pins:
					pinsOn && owned.includes("pins")
						? asset("/imgs/zhenya/badges-wear.webp")
						: null,
				ribbon:
					ribbonOn && owned.includes("honorable-mention")
						? asset("/imgs/zhenya/ribbon-wear.webp")
						: null,
				goBack,
				reached,
			}}
		>
			<div className="relative h-svh overflow-clip">
				<button
					onClick={() => setNavOpen((open) => !open)}
					aria-expanded={navOpen}
					aria-controls="nav"
					aria-label={navOpen ? "Close menu" : "Open menu"}
					className="stage-control fixed top-[0.5svh] font-semibold right-[0.5vw] scribbler text-[2.5svh] cursor-pointer z-23 w-[6.5vw] h-[3vw] min-w-18 min-h-11 portrait:top-[1.5vw] portrait:right-[1.5vw] portrait:w-[18vw] portrait:text-[1.8svh] bg-white border-dashed border-[0.3svh] items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
					menu
				</button>

				{pageNumber > 0 && ticket === "gone" && (
					<button
						onClick={() => setNavOpen(true)}
						aria-label={`Page ${pageNumber} of ${PAGES.length} - open the page list`}
						className="stage-control fixed font-semibold bottom-[0.5svh] left-[0.5vw] portrait:bottom-[1.5vw] portrait:left-[1.5vw] z-23 h-[3.5vw] min-h-11 px-[1vw] portrait:px-[3vw] text-[2.5svh] portrait:text-[1.8svh] scribbler cursor-pointer bg-white border-dashed border-[0.3svh] items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
					>
						page {pageNumber} of {PAGES.length}
					</button>
				)}

				<button
					onClick={() => {
						sound.unlock();
						sound.setMuted(!muted);
					}}
					aria-pressed={!muted}
					aria-label={muted ? "Turn sound on" : "Turn sound off"}
					title={muted ? "Sound off" : "Sound on"}
					style={menuOnly}
					className="stage-control fixed top-[calc(1.5svh+max(3vw,44px))] right-[0.5vw] portrait:top-[calc(3vw+max(3vw,44px))] portrait:right-[1.5vw] text-[3svh] portrait:text-[2.4svh] cursor-pointer z-23 w-[3.5vw] h-[3.5vw] min-w-11 min-h-11 bg-white border-dashed border-[0.3svh] items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
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

				<button
					onClick={() => setReadable(!readableFont)}
					aria-pressed={readableFont}
					aria-label={
						readableFont
							? "Use the handwritten font"
							: "Use an easy-to-read font"
					}
					title={readableFont ? "Easy-to-read font" : "Handwritten font"}
					style={menuOnly}
					className="stage-control fixed top-[calc(2.5svh+max(3vw,44px)+max(3.5vw,44px))] right-[0.5vw] portrait:top-[calc(4.5vw+max(3vw,44px)+max(3.5vw,44px))] portrait:right-[1.5vw] text-[2.6svh] portrait:text-[2svh] cursor-pointer z-23 w-[3.5vw] h-[3.5vw] min-w-11 min-h-11 bg-white border-dashed border-[0.3svh] items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
				>
					<span
						className={
							readableFont ? "font-sample-hand" : "font-sample-readable"
						}
					>
						Aa
					</span>
				</button>

				<p role="status" aria-live="polite" className="sr-only">
					{note?.text}
				</p>

				{note &&
					(note.link ? (
						<button
							key={note.id}
							onClick={() => {
								setNote(null);
								setNavOpen(true);
							}}
							className={`${NOTE} border-dashed cursor-pointer`}
						>
							{note.text}, click to view {"->"}
						</button>
					) : (
						<p key={note.id} aria-hidden className={NOTE}>
							{note.text}
						</p>
					))}

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
						className="stage-control fixed top-[0.5svh] left-[0.5vw] text-[3.75svh] font-extrabold cursor-pointer z-23 w-[3.5vw] h-[3.5vw] min-w-11 min-h-11 portrait:top-[1.5vw] portrait:left-[1.5vw] portrait:text-[2.4svh] bg-white border-dashed border-[0.3svh] items-center justify-center flex drop-shadow-lg drop-shadow-black/60"
					>
						{"<-"}
					</a>
				)}

				<div
					onClick={() => setNavOpen(false)}
					aria-hidden
					className="fixed inset-0 z-21 bg-black/20 backdrop-blur-[1px] transition-opacity duration-700"
					style={{
						opacity: navOpen ? 1 : 0,
						pointerEvents: navOpen ? "auto" : "none",
					}}
				/>

				<nav
					id="nav"
					inert={!navOpen}
					className={`${navGliding ? "nav-smooth" : "nav-bounce"} fixed inset-x-0 bottom-[10svh] z-22 drop-shadow-lg drop-shadow-black/40 ${navOpen ? "test-shadow-darker" : ""}`}
					style={{
						transform: navOpen
							? allItems
								? `translateY(calc${ROW})`
								: "translateY(0)"
							: "translateY(-90svh)",
					}}
				>
					{pageLoaded && (
						<img
							src={asset("/imgs/stage/hidden-scribble.webp")}
							fetchPriority="low"
							className="absolute bottom-[90svh] left-0 w-screen h-[8svh] max-w-none pointer-events-none"
							style={{
								opacity: allItems ? 0 : 1,
								transition: allItems ? "none" : "opacity 0s 1100ms",
							}}
							alt=""
							aria-hidden
						/>
					)}

					<div className="absolute bottom-full inset-x-0 h-[60svh] bg-white -mb-px" />

					{pageLoaded && (
						<img
							src={asset("/imgs/stage/header.webp")}
							srcSet={srcSet([
								["/imgs/stage/header-1200.webp", 1200],
								["/imgs/stage/header-1600.webp", 1600],
								["/imgs/stage/header.webp", 2360],
							])}
							sizes="100vw"
							fetchPriority="low"
							className="w-screen block portrait:h-[85svh] portrait:object-cover portrait:object-bottom"
							alt="Theatre curtain valance"
						/>
					)}

					<div
						className={`${navGliding ? "nav-smooth" : "nav-bounce"} absolute inset-x-0 bottom-[45%] flex flex-col items-center gap-[2svh] text-[3svh] pt-[3svh]`}
						style={{
							transform:
								allItems && !twoRows ? `translateY(calc(-1 * ${ROW}))` : "none",
						}}
					>
						<div
							className={`flex portrait:flex-col items-end portrait:items-center gap-[3vw] portrait:gap-[2.5svh]`}
						>
							<section className="flex flex-col items-center gap-[2svh] portrait:gap-[1svh]">
								<div className="flex items-baseline gap-[1.2vw] portrait:gap-[3vw]">
									<h2 className="text-[4svh] portrait:text-[3svh]">Pages</h2>
									{allPages && !itemRows && tallPages && (
										<button
											onClick={() => reopenNav(false)}
											className="relative text-[2svh] portrait:text-[1.7svh] bg-white border-[0.2svh] border-black border-dashed px-[0.8vw] portrait:px-[2vw] cursor-pointer"
										>
											view less
										</button>
									)}
								</div>
								<div
									className={`${twoRows ? "h-[calc(2*var(--slot)+var(--slot-gap))]" : "h-(--slot)"} overflow-hidden w-[min(54svh,calc(96vw-4*var(--slot)-3*var(--slot-gap)-3vw))] portrait:h-auto portrait:w-[87.5vw] flex items-center px-[1.5svh] py-[1.2svh] bg-white/20 border-[0.3svh] border-black border-dashed text-[2.2svh] portrait:text-[1.9svh] leading-[1.15]`}
								>
									<ol
										className={`locked-pages w-full columns-2 gap-x-[2vw] portrait:gap-x-[3vw] [&>li]:break-inside-avoid [&>li]:mb-[0.4svh]`}
									>
										{windowPages.map(({ title, href, i }, k) => {
											const n = i + 1;
											if (
												(k === 0 && windowStart > 0) ||
												(k === windowLength - 1 &&
													windowStart + windowLength < PAGES.length)
											)
												return (
													<li key={href}>
														<button
															onClick={() => reopenNav(true)}
															aria-label="Show all pages"
															className="py-[0.15svh] tracking-[0.2em] font-extrabold cursor-pointer hover:underline decoration-dashed underline-offset-4"
														>
															...
														</button>
													</li>
												);
											const here = pathname === href;
											const isExtras = i === MAIN_PAGES.length;
											const isExtraPage = i >= MAIN_PAGES.length;

											return (
												<li key={href}>
													{isExtras && <div className="font-bold">Extras</div>}

													{n > reached + 1 && !here && !isExtraPage ? (
														<span
															aria-disabled
															title="Not yet - keep going through the story"
															className="block py-[0.15svh] text-black/35 cursor-not-allowed"
														>
															<span
																aria-hidden
															>{`${n}. ${title.replace(/\S/g, "x")}`}</span>
															<span className="sr-only">
																{`Page ${n}`} (locked)
															</span>
														</span>
													) : n > reached && !here && !isExtraPage ? (
														<span
															aria-disabled
															title="Not yet - keep going through the story"
															className="locked block py-[0.15svh] text-black/35 cursor-not-allowed"
														>
															<span aria-hidden>
																{[...`${n}. ${title}`].map((letter, j) => (
																	<span
																		key={j}
																		className="scatter"
																		style={
																			{
																				"--dx": `${(scatter(n, j, 1) * 0.05).toFixed(2)}em`,
																				"--dy": `${(scatter(n, j, 2) * 0.15).toFixed(2)}em`,
																				"--r": `${Math.round(scatter(n, j, 3) * 10)}deg`,
																				"--delay": `${(scatter(n, j, 4) * 0.7).toFixed(2)}s`,
																			} as React.CSSProperties
																		}
																	>
																		{letter}
																	</span>
																))}
															</span>
															<span className="sr-only">
																{`${n}. ${title}`} (locked)
															</span>
														</span>
													) : (
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
													)}
												</li>
											);
										})}
									</ol>
								</div>
							</section>

							<section className="flex flex-col items-center gap-[2svh] portrait:gap-[1svh]">
								<div className="flex items-baseline gap-[1.2vw] portrait:gap-[3vw]">
									{scrolling && (
										<button
											onClick={() => scrollInventory(-1)}
											disabled={firstColumn === 0}
											aria-label="Scroll inventory left"
											className={INVENTORY_ARROW}
										>
											{"<-"}
										</button>
									)}
									<h2 className="text-[4svh] portrait:text-[3svh]">
										Inventory
									</h2>
									{scrolling && (
										<button
											onClick={() => scrollInventory(1)}
											disabled={firstColumn === lastColumn}
											aria-label="Scroll inventory right"
											className={INVENTORY_ARROW}
										>
											{"->"}
										</button>
									)}
									{canViewAll && !scrolling && !allPages && (
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
								<ul
									className={`relative grid grid-cols-4 ${twoRows ? "h-[calc(2*var(--slot)+var(--slot-gap))]" : "h-(--slot)"} auto-rows-(--slot) gap-(--slot-gap)`}
								>
									{cells.map(({ g, entry }, k) => {
										if (g === 0)
											return (
												<li
													key="money"
													className="relative w-(--slot) h-(--slot) bg-white/20 border-[0.3svh] border-black border-dashed cursor-pointer"
													style={{
														opacity:
															slotsHidden || openItem?.slot === k ? 0 : 1,
														transition: instantSlot(k)
															? "none"
															: `opacity ${slotsHidden ? 300 : ITEM_FADE_MS}ms ease`,
													}}
													onClick={() => showItem("money", k)}
													onKeyDown={(e) => {
														if (e.key === "Enter" || e.key === " ")
															showItem("money", k);
													}}
													role="button"
													tabIndex={0}
													aria-label={`$${money} - ${bills.fives} $5 bills and ${bills.ones} $1 bills - details`}
												>
													{moneyBills.map((src, i, all) => (
														<img
															key={i}
															src={src}
															className="absolute top-[50%] h-[82%] w-auto max-w-none translate-x-[-50%] translate-y-[-50%] test-shadow-darker"
															style={{
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
											);
										const hidden = k >= columns && !allItems;
										return (
											<li
												key={entry?.key ?? `empty-${g}`}
												inert={hidden}
												className={`relative w-(--slot) h-(--slot) bg-white/20 border-[0.3svh] border-black border-dashed flex items-center justify-center ${entry ? "cursor-pointer" : ""}`}
												style={{
													opacity:
														slotsHidden || hidden || openItem?.slot === k
															? 0
															: 1,
													transition: instantSlot(k)
														? "none"
														: slotsHidden
															? "opacity 300ms ease"
															: openItem
																? `opacity ${ITEM_FADE_MS}ms ease`
																: `opacity ${hidden ? 200 : 450}ms ease ${k >= columns && !hidden ? 150 : 0}ms`,
												}}
												aria-label={entry ? undefined : "Empty slot"}
											>
												{entry && (
													<button
														onClick={() => {
															if (entry.item === "hats") openWardrobe();
															else showItem(entry.key, k);
														}}
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
									})}

									{openItem && opened && (
										<li
											className="absolute h-(--slot) portrait:h-auto border-[0.3svh] border-black border-dashed flex portrait:flex-col items-center portrait:items-start gap-[2vw] portrait:gap-0 overflow-hidden"
											style={{
												transition: [
													"left",
													"width",
													"top",
													"height",
													"max-height",
													"min-height",
												]
													.map((property) =>
														itemOpen
															? `${property} ${ITEM_GROW_MS}ms cubic-bezier(0.34, 1.1, 0.64, 1)`
															: `${property} ${ITEM_SHRINK_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
													)
													.concat(
														`background-color ${itemOpen ? ITEM_GROW_MS : ITEM_SHRINK_MS}ms ease`,
													)
													.join(", "),
												backgroundColor: itemOpen
													? "rgb(255 255 255 / 0.8)"
													: "rgb(255 255 255 / 0.2)",
												top:
													itemOpen && allItems
														? "0"
														: `calc(${Math.floor(openItem.slot / columns)} * ${ROW})`,
												left: itemOpen
													? "0"
													: `calc(${openItem.slot % columns} * ${ROW})`,
												width: itemOpen ? "100%" : "var(--slot)",
												height:
													itemOpen && allItems && !portrait
														? "calc(2 * var(--slot) + var(--slot-gap))"
														: undefined,
												maxHeight: portrait
													? itemOpen
														? "70svh"
														: "var(--slot)"
													: undefined,
												minHeight:
													portrait && itemOpen
														? "calc(2 * var(--slot) + var(--slot-gap))"
														: undefined,
											}}
										>
											<div
												className="relative shrink-0 w-[calc(var(--slot)-0.6svh)] h-[calc(var(--slot)-0.6svh)] flex items-center justify-center"
												style={{
													scale: itemOpen ? "0.85" : "1",
													transition: itemOpen
														? `scale ${ITEM_GROW_MS}ms cubic-bezier(0.34, 1.1, 0.64, 1)`
														: `scale ${ITEM_SHRINK_MS}ms cubic-bezier(0.4, 0, 0.2, 1)`,
												}}
											>
												{opened.key === "money" ? (
													moneyBills.map((src, i, all) => (
														<img
															key={i}
															src={src}
															className="absolute top-[50%] h-[82%] w-auto max-w-none translate-x-[-50%] translate-y-[-50%] test-shadow-darker"
															style={{
																left: `${50 + (i - (all.length - 1) / 2) * 12}%`,
																rotate: `${(i - (all.length - 1) / 2) * 8}deg`,
															}}
															alt=""
														/>
													))
												) : (
													<img
														key={opened.key}
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
														className={`max-h-[90%] max-w-[90%] w-auto h-auto test-shadow-darker ${opened.art ? "cursor-zoom-in" : ""}`}
														alt={opened.name}
													/>
												)}
											</div>
											<div
												className="flex flex-col gap-[1svh] text-left pr-[2svh] portrait:px-[3vw] portrait:pb-[3vw]"
												style={{
													opacity: itemOpen ? 1 : 0,
													transition: `opacity ${itemOpen ? 300 : 120}ms ease`,
												}}
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
													{opened.item === "pins" && (
														<button
															onClick={() => wearPins(!pinsOn)}
															className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
														>
															{pinsOn ? "Take off" : "Wear"}
														</button>
													)}
													{opened.item === "honorable-mention" && (
														<button
															onClick={() => wearRibbon(!ribbonOn)}
															className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
														>
															{ribbonOn ? "Take off" : "Wear"}
														</button>
													)}
													{opened.item === "mystery-box" && (
														<button
															onClick={openBox}
															className="text-[2.5svh] bg-white border-[0.3svh] border-black border-dashed px-[1vw] cursor-pointer"
														>
															Open
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

				{pageLoaded && (
					<img
						src={asset("/imgs/stage/open.webp")}
						srcSet={srcSet([
							["/imgs/stage/open-1200.webp", 1200],
							["/imgs/stage/open-1600.webp", 1600],
							["/imgs/stage/open.webp", 2360],
						])}
						sizes="100vw"
						fetchPriority="low"
						className="stage-curtain w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none fixed z-10 pointer-events-none scene-shadow"
						style={{
							visibility: animationStage === "idle" ? "visible" : "hidden",
						}}
						alt="Open theatre curtains"
					/>
				)}

				{animationStage === "loading" && (
					<img
						src={asset("/imgs/stage/closed.webp")}
						srcSet={srcSet([
							["/imgs/stage/closed-1200.webp", 1200],
							["/imgs/stage/closed-1600.webp", 1600],
							["/imgs/stage/closed.webp", 2360],
						])}
						sizes="100vw"
						fetchPriority="high"
						className="w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none fixed z-30"
						alt="Closed theatre curtains"
					/>
				)}

				<div
					aria-hidden
					className="fixed inset-0 z-35"
					style={{
						background:
							"radial-gradient(ellipse 38vw 34svh at 50% 40%, rgb(0 0 0 / 0.35), rgb(0 0 0 / 0.88))",
						opacity: lightsDown ? 1 : 0,
						pointerEvents: lightsDown ? "auto" : "none",
						transition: `opacity ${lightsDown ? 1400 : 1200}ms ease`,
					}}
				/>
				<PhoneCard shown={phoneCard} onChoose={chooseSound} />

				{ticket !== "gone" && (
					<button
						onClick={enter}
						aria-disabled={ticket !== "waiting"}
						className={`fixed top-[40svh] left-[20vw] portrait:left-[10vw] z-40 cursor-pointer drop-shadow-lg drop-shadow-black/60 test-shadow-darkest ${ticket === "waiting" ? "ticket-shake" : ""}`}
						aria-label="Enter"
					>
						<img
							src={asset("/imgs/stage/ticket2.webp")}
							data-hit
							srcSet={srcSet([
								["/imgs/stage/ticket2-700.webp", 700],
								["/imgs/stage/ticket2.webp", 1400],
							])}
							sizes="(orientation: portrait) 80vw, 50vw"
							fetchPriority="high"
							className="w-[50vw] portrait:w-[80vw] block"
							style={{
								visibility: ticket === "ripping" ? "hidden" : "visible",
							}}
							alt="Admit one ticket"
						/>
						<canvas
							ref={ripCanvasRef}
							className="absolute inset-0 w-full h-full"
						/>
					</button>
				)}

				<canvas
					ref={canvasRef}
					className="w-screen h-svh top-0 left-0 portrait:w-[125vw] portrait:left-[-12.5vw] max-w-none fixed z-30 pointer-events-none scene-shadow"
				/>

				<main className="bg-white/0 border-[0.3svh] border-black/0 w-[65vw] h-[75svh] mx-auto top-[25svh] portrait:w-full portrait:h-[80svh] portrait:top-[20svh] relative">
					{children}
				</main>

				<div className="-z-10 fixed top-0 left-0 h-svh w-screen">
					{pageLoaded && (
						<img
							src={asset("/imgs/stage/paper-bg-2560.webp")}
							srcSet={srcSet([
								["/imgs/stage/paper-bg-1280.webp", 1280],
								["/imgs/stage/paper-bg-1920.webp", 1920],
								["/imgs/stage/paper-bg-2560.webp", 2560],
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
