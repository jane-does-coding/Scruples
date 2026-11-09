import { useEffect, useRef } from "react";
import Strings from "@/components/Strings";
import { setReadable, useReadableFont } from "@/lib/font";

const BOUNCE = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const LIFT = "cubic-bezier(0.5, 0, 0.75, 0)";
const FONT_OPTION =
	"relative flex flex-col items-center leading-tight bg-white border-[0.3svh] border-black px-[1.5vw] portrait:px-[3vw] py-[0.8svh] cursor-pointer";
const BUTTON =
	"relative text-[3svh] portrait:text-[2.3svh] bg-white border-[0.3svh] border-black border-dashed px-[1.5vw] portrait:px-[4vw] py-[0.5svh] cursor-pointer";

export function PhoneCard({
	shown,
	onChoose,
}: {
	shown: boolean;
	onChoose: (on: boolean) => void;
}) {
	const readable = useReadableFont();
	const firstChoice = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!shown) return;
		const timer = setTimeout(() => firstChoice.current?.focus(), 1000);
		return () => clearTimeout(timer);
	}, [shown]);

	return (
		<div
			role="dialog"
			aria-labelledby="phones-card"
			aria-hidden={!shown}
			inert={!shown}
			className="fixed left-[50%] translate-x-[-50%] top-[19svh] z-45 w-max max-w-[80vw] scribbler bg-white border-[0.3svh] border-black px-[3vw] portrait:px-[6vw] py-[3svh] flex flex-col items-center gap-[1.5svh] text-center drop-shadow-lg drop-shadow-black/60 test-shadow-darkest"
			style={{
				visibility: shown ? "visible" : "hidden",
				transform: shown ? "translateY(0)" : "translateY(-110svh)",
				transition: shown
					? `transform 1000ms ${BOUNCE}, visibility 0s`
					: `transform 600ms ${LIFT}, visibility 0s 600ms`,
			}}
		>
			<Strings />
			<img src="/no-phone.png" alt="" className="w-[7vw]" />
			<h2
				id="phones-card"
				className="text-[5svh] portrait:text-[3.4svh] leading-tight"
			>
				Please silence your phones
			</h2>
			<p className="text-[2.6svh] portrait:text-[2svh] text-black/60">
				Which lettering would you like?
			</p>
			<div className="flex gap-[1.5vw] portrait:gap-[4vw]">
				<button
					ref={firstChoice}
					aria-pressed={!readable}
					className={`${FONT_OPTION} ${readable ? "border-dashed" : "border-solid"} shadow-md shadow-neutral-500/50`}
					onClick={() => setReadable(false)}
				>
					<span className="font-sample-hand text-[3.4svh] portrait:text-[2.6svh]">
						Handwritten
					</span>
					<span className="font-sample-hand text-[1.9svh] portrait:text-[1.5svh] text-black/60">
						recommended!
					</span>
				</button>
				<button
					aria-pressed={readable}
					className={`${FONT_OPTION} ${readable ? "border-solid" : "border-dashed"} opacity-70`}
					onClick={() => setReadable(true)}
				>
					<span className="font-sample-readable text-[3svh] portrait:text-[2.3svh]">
						Easy to read
					</span>
					<span className="font-sample-readable text-[1.7svh] portrait:text-[1.4svh] text-black/60">
						clearer letters
					</span>
				</button>
			</div>
			<p className="text-[2.6svh] portrait:text-[2svh] text-black/60 mt-[1svh]">
				The show is better with sound on... but if you wish, you can do without
			</p>
			<div className="flex gap-[1.5vw] portrait:gap-[4vw]">
				<button
					className={BUTTON + " shadow-sm shadow-neutral-500/40"}
					onClick={() => onChoose(true)}
				>
					Sound on
				</button>
				<button
					className={BUTTON + " opacity-60"}
					onClick={() => onChoose(false)}
				>
					Sound off
				</button>
			</div>
		</div>
	);
}
