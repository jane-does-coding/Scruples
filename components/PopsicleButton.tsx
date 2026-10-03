import { useState, type CSSProperties, type ReactNode } from "react";

type PopsicleButtonProps = {
	onClick: () => void;
	children: ReactNode;
	// Which corner the sign sits in; the popsicle stick is mirrored to match
	side?: "left" | "right";
	// Positions the whole popsicle + button group
	className?: string;
	style?: CSSProperties;
};

// Wrapper is 15vw × 17.5vh and the popsicle is 18vw wide, 8vh below the
// bottom, so the stick bottom is 25.5vh (17.5vh + 8vh) below the button's top.
// Right side: popsicle at left -2vw → stick center 7vw from the left,
// i.e. 8vw in from the button's right edge.
// Left side: popsicle at right 0 → stick center 15vw − 9vw = 6vw from the left.
const PIVOT_Y = "25.5vh";
const BUTTON_PIVOT = {
	right: `calc(100% - 8vw) ${PIVOT_Y}`,
	left: `6vw ${PIVOT_Y}`,
};

export default function PopsicleButton({
	onClick,
	children,
	side = "right",
	className = "",
	style,
}: PopsicleButtonProps) {
	const right = side === "right";

	// Popsicle + button tilt together on hover
	const [hover, setHover] = useState(false);
	const hoverProps = {
		onMouseEnter: () => setHover(true),
		onMouseLeave: () => setHover(false),
	};
	// Both pivot around the bottom-center of the popsicle stick
	const tilt = (transformOrigin: string) => ({
		transition: "transform 250ms cubic-bezier(0.25, 0.8, 0.25, 1)",
		// Back buttons (left side) tilt the opposite way
		transform: hover ? `rotate(${right ? 3 : -3}deg)` : "rotate(0deg)",
		transformOrigin,
	});

	return (
		<div
			className={`test-shadow-darker absolute bottom-0 min-w-fit h-[17.5vh] w-[15vw] ${right ? "right-0" : "left-0"} ${className}`}
			style={style}
		>
			{/* Popsicle */}
			<div
				className={`absolute bottom-[-8vh] z-[-5] drop-shadow-md drop-shadow-black/40 ${right ? "left-[-2vw]" : "right-[-0vw]"}`}
			>
				<img
					src="/imgs/popsicle.png"
					alt=""
					className="w-[18vw] max-w-none"
					style={tilt("50% 100%")}
					{...hoverProps}
				/>
			</div>

			{/* Button */}
			<div
				className={`absolute top-0 z-20 drop-shadow-md drop-shadow-black/40 flex min-w-fit ${right ? "right-0" : "left-0"}`}
			>
				<button
					onClick={onClick}
					className="cursor-pointer bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] text-[4vh] flex whitespace-nowrap"
					style={tilt(BUTTON_PIVOT[side])}
					{...hoverProps}
				>
					{children}
				</button>
			</div>
		</div>
	);
}
