import { useEffect, useRef } from "react";

const BOUNCE = "cubic-bezier(0.34, 1.25, 0.64, 1)";
const LIFT = "cubic-bezier(0.5, 0, 0.75, 0)";
const BUTTON =
	"relative text-[3svh] portrait:text-[2.3svh] bg-white border-[0.3svh] border-black border-dashed px-[1.5vw] portrait:px-[4vw] py-[0.5svh] cursor-pointer";

export function PhoneCard({
	shown,
	onChoose,
}: {
	shown: boolean;
	onChoose: (on: boolean) => void;
}) {
	const soundOn = useRef<HTMLButtonElement>(null);
	useEffect(() => {
		if (!shown) return;
		const timer = setTimeout(() => soundOn.current?.focus(), 1000);
		return () => clearTimeout(timer);
	}, [shown]);

	return (
		<div
			role="dialog"
			aria-labelledby="phones-card"
			aria-hidden={!shown}
			inert={!shown}
			className="fixed left-[50%] translate-x-[-50%] top-[22svh] z-45 w-max max-w-[80vw] scribbler bg-white border-[0.3svh] border-black px-[3vw] portrait:px-[6vw] py-[3svh] flex flex-col items-center gap-[1.5svh] text-center drop-shadow-lg drop-shadow-black/60 test-shadow-darkest"
			style={{
				visibility: shown ? "visible" : "hidden",
				transform: shown ? "translateY(0)" : "translateY(-110svh)",
				transition: shown
					? `transform 1000ms ${BOUNCE}, visibility 0s`
					: `transform 600ms ${LIFT}, visibility 0s 600ms`,
			}}
		>
			<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] left-0 absolute"></span>
			<span className="w-[0.1vw] min-w-px bg-black/60 h-svh top-[-100svh] right-0 absolute"></span>
			<div aria-hidden className="w-[9svh] h-[9svh] bg-black/20" />
			<h2
				id="phones-card"
				className="text-[5svh] portrait:text-[3.4svh] leading-tight"
			>
				Please silence your phones
			</h2>
			<p className="text-[2.6svh] portrait:text-[2svh] text-black/60">
				The show is better with sound on... but if you wish, you can do without
			</p>
			<div className="flex gap-[1.5vw] portrait:gap-[4vw] mt-[1svh]">
				<button ref={soundOn} className={BUTTON} onClick={() => onChoose(true)}>
					Sound on
				</button>
				<button className={BUTTON} onClick={() => onChoose(false)}>
					Sound off
				</button>
			</div>
		</div>
	);
}
