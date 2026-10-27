"use client";

import { useEffect, useRef } from "react";

// The hand-drawn cursor, drawn by the page itself (on computers - touch
// screens don't have a cursor). The system cursor is hidden everywhere
// while it's running (.custom-cursor in globals.css), so the browser can
// never swap it for its own, not even by the window's edges.
//
// White normally, yellow over anything clickable, red over anything that
// can't be clicked yet (like locked pages). Clicking shrinks it to 90%, and
// letting go springs it back with a little bounce, around its middle

const CURSORS = {
	plain: "/imgs/stage/cursor2@2x.png?v=5",
	pointer: "/imgs/stage/cursor2-pointer@2x.png?v=5",
	locked: "/imgs/stage/cursor2-locked@2x.png?v=5",
};
type Kind = keyof typeof CURSORS;
// Its size on screen (the images are drawn at twice that, for sharp
// screens), and where its tip - the point that clicks - is in it
const WIDTH = 30;
const HEIGHT = 39;
const TIP = 3;

// What's under the pointer: something clickable, something locked, or
// neither (the same things the CSS cursors go by)
const kindOf = (target: EventTarget | null): Kind => {
	if (!(target instanceof Element)) return "plain";
	if (target.closest(".cursor-not-allowed")) return "locked";
	const clickable = target.closest(
		'a[href], button, [role="button"], summary, .cursor-pointer',
	);
	if (!clickable || clickable.matches(":disabled, .cursor-default"))
		return "plain";
	return "pointer";
};

export default function CustomCursor() {
	const holder = useRef<HTMLDivElement>(null);
	const arrow = useRef<HTMLImageElement>(null);

	useEffect(() => {
		// Only with a real mouse (or trackpad)
		if (!matchMedia("(pointer: fine)").matches) return;
		const root = document.documentElement;
		root.classList.add("custom-cursor");
		// The three colours, ready before they're needed
		for (const src of Object.values(CURSORS)) new Image().src = src;

		let frame = 0;
		let x = -100;
		let y = -100;
		let kind: Kind = "plain";
		const draw = () => {
			frame = 0;
			const el = holder.current;
			const img = arrow.current;
			if (!el || !img) return;
			el.style.transform = `translate3d(${x - TIP}px, ${y - TIP}px, 0)`;
			if (img.dataset.kind !== kind) {
				img.dataset.kind = kind;
				img.src = CURSORS[kind];
			}
		};
		const onMove = (e: PointerEvent) => {
			if (e.pointerType !== "mouse") return;
			x = e.clientX;
			y = e.clientY;
			kind = kindOf(e.target);
			holder.current?.style.setProperty("opacity", "1");
			if (!frame) frame = requestAnimationFrame(draw);
		};
		// Off the page: hide it until the mouse comes back
		const onLeave = (e: MouseEvent) => {
			if (!e.relatedTarget) holder.current?.style.setProperty("opacity", "0");
		};
		// Pressing shrinks it; letting go springs it back
		const press = (e: PointerEvent) => {
			if (e.pointerType !== "mouse" || !arrow.current) return;
			arrow.current.style.transition = "scale 80ms ease-out";
			arrow.current.style.scale = "0.9";
		};
		const release = () => {
			if (!arrow.current) return;
			arrow.current.style.transition =
				"scale 260ms cubic-bezier(0.34, 1.4, 0.64, 1)";
			arrow.current.style.scale = "1";
		};
		window.addEventListener("pointermove", onMove, { passive: true });
		// The thing under the pointer can change without it moving (a click
		// opens something, a page changes): check again on every press
		window.addEventListener("pointerdown", onMove, { passive: true });
		window.addEventListener("pointerdown", press);
		window.addEventListener("pointerup", release);
		window.addEventListener("pointercancel", release);
		document.addEventListener("mouseout", onLeave);
		return () => {
			root.classList.remove("custom-cursor");
			window.removeEventListener("pointermove", onMove);
			window.removeEventListener("pointerdown", onMove);
			window.removeEventListener("pointerdown", press);
			window.removeEventListener("pointerup", release);
			window.removeEventListener("pointercancel", release);
			document.removeEventListener("mouseout", onLeave);
			cancelAnimationFrame(frame);
		};
	}, []);

	return (
		<div
			ref={holder}
			aria-hidden
			className="fixed top-0 left-0 z-[2147483647] pointer-events-none"
			style={{ opacity: 0, willChange: "transform" }}
		>
			{/* eslint-disable-next-line @next/next/no-img-element */}
			<img
				ref={arrow}
				src={CURSORS.plain}
				data-kind="plain"
				alt=""
				width={WIDTH}
				height={HEIGHT}
				draggable={false}
				className="block max-w-none"
			/>
		</div>
	);
}
