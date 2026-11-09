"use client";
import Strings from "@/components/Strings";

import { useEffect, useState } from "react";
import { useStage } from "@/components/Stage";
import usePortrait from "@/components/usePortrait";
import { useDrawings, type Drawing } from "@/lib/drawings";

const LABEL =
	"text-center scribbler bg-white border-[0.2svh] border-black px-[1vw] portrait:px-[2.5vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40 test-shadow-darker";

const STRING =
	"absolute h-[0.1vw] min-h-px bg-black/50 pointer-events-none test-shadow-darker";

const CLOSE_MS = 500;

const when = (ms: number) =>
	ms
		? new Date(ms).toLocaleDateString(undefined, {
				day: "numeric",
				month: "short",
				year: "numeric",
			})
		: "";

export default function DrawingGallery() {
	const { curtainsOpen, goTo } = useStage();
	const [shown, setShown] = useState(false);
	useEffect(() => {
		if (!curtainsOpen) return;
		const timer = setTimeout(() => setShown(true), 0);
		return () => clearTimeout(timer);
	}, [curtainsOpen]);
	const drawings = useDrawings();
	const [open, setOpen] = useState<Drawing | null>(null);
	const [closeUp, setCloseUp] = useState(false);
	const view = (drawing: Drawing) => {
		setOpen(drawing);
		requestAnimationFrame(() => requestAnimationFrame(() => setCloseUp(true)));
	};
	const close = () => {
		setCloseUp(false);
		setTimeout(() => setOpen(null), CLOSE_MS);
	};
	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [open]);
	const onlySamples = drawings.every((d) => d.id.startsWith("sample"));
	const columns = usePortrait() ? 2 : 4;
	const rows = Array.from(
		{ length: Math.ceil(drawings.length / columns) },
		(_, i) => drawings.slice(i * columns, (i + 1) * columns),
	);

	return (
		<div className="h-full">
			<h1
				className={`absolute top-[-4svh] left-[50%] -translate-x-[50%] w-max text-[4svh] portrait:text-[2.8svh] z-[9] ${LABEL}`}
				style={{
					visibility: shown ? "visible" : "hidden",
					transition: "transform 800ms cubic-bezier(0.34, 1.25, 0.64, 1)",
					transform: shown ? "translateY(0)" : "translateY(-110svh)",
				}}
			>
				<Strings />
				{"The Gallery of Everyone's Art"}
			</h1>

			<div
				className="absolute left-[50%] -translate-x-[50%] w-screen top-[-13svh] pt-[18vh] bottom-0 overflow-y-auto scrollbar-hide overscroll-contain px-[18.5vw] portrait:px-[1vw] pb-[6svh]"
				style={{
					opacity: shown ? 1 : 0,
					transition: "opacity 600ms ease 300ms",
				}}
			>
				<div className="flex flex-col gap-[6svh] portrait:gap-[5svh] py-[2vh]">
					{rows.map((row, i) => (
						<div key={i} className="relative">
							<span
								aria-hidden
								className={`${STRING} top-[4.5vh] w-screen left-[50%] -translate-x-[50%]`}
							></span>
							<span
								aria-hidden
								className={`${STRING} bottom-[9.5vh] w-screen left-[50%] -translate-x-[50%]`}
							></span>
							<span
								aria-hidden
								className={`${STRING} bottom-[2vh] w-screen left-[50%] -translate-x-[50%]`}
							></span>
							<ul className="grid grid-cols-4 portrait:grid-cols-2 gap-[3svh] portrait:gap-[3vw] items-start">
								{row.map((drawing) => (
									<li
										key={drawing.id}
										className="flex flex-col items-center gap-[1svh]"
									>
										<button
											onClick={() => view(drawing)}
											aria-label={`See the drawing by ${drawing.by.toLowerCase()} up close`}
											className="w-full cursor-zoom-in"
										>
											<img
												src={drawing.image}
												className="w-full h-auto test-shadow-darker"
												alt={`A drawing by ${drawing.by.toLowerCase()}, in a picture frame`}
											/>
										</button>
										<p
											className={`text-[2svh] portrait:text-[1.7svh] ${LABEL}`}
										>
											{drawing.by}
											{drawing.madeAt ? ` · ${when(drawing.madeAt)}` : ""}
										</p>
									</li>
								))}
							</ul>
						</div>
					))}
				</div>

				{onlySamples && (
					<p className="mt-[4svh] text-center text-[3svh] portrait:text-[2.3svh]">
						<a
							href="/every-artist-starts-somewhere"
							onClick={(e) => {
								if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
									return;
								e.preventDefault();
								goTo("/every-artist-starts-somewhere");
							}}
							className="inline-block bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[2.5vw] py-[0.5svh] cursor-pointer"
						>
							No drawings yet - go make one {"->"}
						</a>
					</p>
				)}
			</div>
			{open && (
				<div
					role="dialog"
					aria-modal
					aria-label={`The drawing by ${open.by.toLowerCase()}, up close`}
					className="fixed inset-0 z-21 flex flex-col items-center justify-center gap-[2svh] bg-black/20 backdrop-blur-[1px] cursor-zoom-out"
					style={{
						opacity: closeUp ? 1 : 0,
						transition: `opacity ${CLOSE_MS}ms ease`,
					}}
					onClick={close}
				>
					<div
						className="relative"
						style={{
							transition: `transform ${CLOSE_MS}ms cubic-bezier(0.34, 1.1, 0.64, 1)`,
							transform: closeUp ? "translateY(0)" : "translateY(-110svh)",
						}}
					>
						<Strings inset="20%" place="h-svh bottom-[90%]" />
						<img
							src={open.image}
							className="relative max-h-[72svh] max-w-[90vw] w-auto h-auto test-shadow-darker"
							alt={`A drawing by ${open.by.toLowerCase()}, in a picture frame`}
						/>
					</div>
					<p
						className={`text-[2.6svh] portrait:text-[2svh] ${LABEL}`}
						style={{
							transition: `transform ${CLOSE_MS}ms cubic-bezier(0.34, 1.1, 0.64, 1) 80ms`,
							transform: closeUp ? "translateY(0)" : "translateY(110svh)",
						}}
					>
						{open.by}
						{open.madeAt ? ` · ${when(open.madeAt)}` : ""}
					</p>
					<button
						onClick={close}
						autoFocus
						className="fixed top-[0.5svh] left-[50%] -translate-x-[50%] portrait:top-[1.5vw] bg-white border-[0.3svh] border-black border-dashed px-[1vw] portrait:px-[3vw] text-[2.5svh] portrait:text-[1.8svh] scribbler cursor-pointer drop-shadow-lg drop-shadow-black/60"
					>
						close x
					</button>
				</div>
			)}
		</div>
	);
}
