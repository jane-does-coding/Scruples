import { useEffect, useState } from "react";

const DROP = "cubic-bezier(0.34, 1.1, 0.64, 1)";
const MS = 800;

export default function ArtViewer({
	image,
	name,
	onClose,
}: {
	image: string;
	name: string;
	onClose: () => void;
}) {
	const [shown, setShown] = useState(false);
	useEffect(() => {
		const timer = setTimeout(() => setShown(true), 20);
		return () => clearTimeout(timer);
	}, []);

	const close = () => {
		setShown(false);
		setTimeout(onClose, MS);
	};
	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") close();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	});

	return (
		<div
			role="dialog"
			aria-modal
			aria-label={name}
			onClick={close}
			className="fixed inset-0 z-25 flex items-center justify-center bg-black/40 backdrop-blur-[1px] transition-opacity duration-500"
			style={{ opacity: shown ? 1 : 0 }}
		>
			<div
				className="relative flex flex-col items-center gap-[2svh]"
				onClick={(e) => e.stopPropagation()}
				style={{
					transition: `transform ${MS}ms ${DROP}`,
					transform: shown ? "translateY(0)" : "translateY(-110svh)",
				}}
			>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] bottom-[calc(100%-12svh)] left-[30%] absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[100svh] bottom-[calc(100%-12svh)] right-[30%] absolute"></span>
				<img
					src={image}
					className="relative z-1 max-h-[70svh] max-w-[80vw] w-auto h-auto test-shadow-darker"
					alt={name}
				/>
				<div className="relative z-0 flex items-center gap-[1vw]">
					<p className="relative text-[3svh] portrait:text-[2.3svh] scribbler bg-white border-[0.2svh] border-black px-[1vw] py-[0.5svh] drop-shadow-md drop-shadow-black/40">
						<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] left-0 absolute"></span>
						<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] right-0 absolute"></span>
						{name}
					</p>
					<button
						onClick={close}
						autoFocus
						className="relative text-[3svh] portrait:text-[2.3svh] scribbler bg-white border-[0.3svh] border-black border-dashed px-[1vw] py-[0.5svh] cursor-pointer drop-shadow-md drop-shadow-black/40"
					>
						<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] left-0 absolute"></span>
						<span className="w-[0.1vw] bg-black/60 h-[100svh] top-[-100svh] right-0 absolute"></span>
						Close
					</button>
				</div>
			</div>
		</div>
	);
}
