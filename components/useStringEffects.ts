"use client";

import { useEffect } from "react";
import * as sound from "@/lib/sound";

export const STRING =
	'[data-string], span[class*="bg-black/60"][class*="w-[0.1vw]"]';
export const PANEL =
	'[class*="bg-white"][class*="border-black"]:not([class*="bg-white/0"]), [data-panel]';
const OWN_STRING =
	':scope > [data-string], :scope > span[class*="bg-black/60"]';

export function useDropSounds() {
	useEffect(() => {
		const hangs = (el: Element) => !!el.querySelector(OWN_STRING);
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
}

export function useStringLayering() {
	useEffect(() => {
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
		const settle = () => {
			const seeked: [Animation, CSSNumberish | null][] = [];
			document.getAnimations().forEach((animation) => {
				const end = Number(animation.effect?.getComputedTiming().endTime);
				if (!Number.isFinite(end) || animation.playState === "finished") return;
				seeked.push([animation, animation.currentTime]);
				animation.currentTime = end - 0.01;
			});
			return () =>
				seeked.forEach(([animation, time]) => (animation.currentTime = time));
		};
		const order = () => {
			const started = performance.now();
			try {
				orderNow();
			} finally {
				const stats = (window as unknown as { __layer?: number[] }).__layer;
				stats?.push(performance.now() - started);
			}
		};
		const orderNow = () => {
			raised.forEach((z, el) => (el.style.zIndex = z));
			raised.clear();
			const strings = [...document.querySelectorAll<HTMLElement>(STRING)];
			if (!strings.length) return;
			const owners = [
				...new Set([
					...strings.flatMap((string) => {
						const owner =
							string.parentElement?.closest(PANEL) ?? string.parentElement;
						return owner ? [owner] : [];
					}),
					...document.querySelectorAll("[data-tug-with]"),
				]),
			];
			const elements = [
				...new Set([...owners, ...document.querySelectorAll(PANEL)]),
			];
			const now = new Map(
				elements.map((el) => [el, el.getBoundingClientRect()]),
			);
			const restore = settle();
			const rest = new Map(
				elements.map((el) => [el, el.getBoundingClientRect()]),
			);
			const shown = new Set(
				elements.filter(
					(el) => visible(el, now.get(el)!) || visible(el, rest.get(el)!),
				),
			);
			restore();
			const pairs: { lower: Element; upper: HTMLElement }[] = [];
			owners.forEach((owner) => {
				if (!shown.has(owner)) return;
				const o = rest.get(owner)!;
				const layer = owner.closest("[aria-modal]");
				elements.forEach((panel) => {
					const p = rest.get(panel)!;
					if (
						panel === owner ||
						!shown.has(panel) ||
						!panel.matches(PANEL) ||
						panel.closest("[aria-modal]") !== layer ||
						owner.contains(panel) ||
						panel.contains(owner) ||
						p.right <= o.left ||
						p.left >= o.right ||
						p.top >= o.top
					)
						return;
					const pair = branches(owner, panel);
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
		const events = [
			"transitionrun",
			"transitionend",
			"animationstart",
			"animationend",
		];
		events.forEach((name) => document.addEventListener(name, schedule, true));
		schedule();
		return () => {
			cancelAnimationFrame(frame);
			observer.disconnect();
			window.removeEventListener("resize", schedule);
			events.forEach((name) =>
				document.removeEventListener(name, schedule, true),
			);
		};
	}, []);
}

export function useStringTug() {
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
				if (el.querySelector(OWN_STRING)) break;
				el = el.parentElement;
			}
			if (!el || el === document.body) return;
			tug(el);
		};
		document.addEventListener("pointerdown", onPointerDown);
		return () => document.removeEventListener("pointerdown", onPointerDown);
	}, []);
}
