import { useState, type CSSProperties, type ReactNode } from "react";
import { asset } from "@/lib/asset";
import usePortrait from "@/components/usePortrait";

type PopsicleButtonProps = {
	onClick: () => void;
	// Where it goes, if anywhere: then it's a real link (search engines can
	// follow it, and it can be opened in a new tab), while a plain click
	// still runs onClick - going through the curtains
	href?: string;
	children: ReactNode;
	// Which corner the sign sits in; the popsicle stick is mirrored to match
	side?: "left" | "right";
	// Positions the whole popsicle + button group
	className?: string;
	style?: CSSProperties;
};

// Wrapper is 15vw × 17.5svh and the popsicle is 18vw wide, 8svh below the
// bottom, so the stick bottom is 25.5svh (17.5svh + 8svh) below the button's top.
// Right side: popsicle at left -2vw → stick center 7vw from the left,
// i.e. 8vw in from the button's right edge.
// Left side: popsicle at right 0 → stick center 15vw − 9vw = 6vw from the left.
const PIVOT_Y = "25.5svh";
const BUTTON_PIVOT = {
	right: `calc(100% - 8vw) ${PIVOT_Y}`,
	left: `6vw ${PIVOT_Y}`,
};
// On portrait screens vw is tiny, so the sizes are in svh instead: wrapper
// 20svh wide, popsicle 24svh wide at -2.7svh / 0 → stick centre 9.3svh from
// the left (10.7svh from the right), or 8svh from the left on the left side
const PORTRAIT_PIVOT = {
	right: `calc(100% - 10.7svh) ${PIVOT_Y}`,
	left: `8svh ${PIVOT_Y}`,
};

export default function PopsicleButton({
	onClick,
	href,
	children,
	side = "right",
	className = "",
	style,
}: PopsicleButtonProps) {
	const right = side === "right";
	const portrait = usePortrait();

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
			className={`test-shadow-darker absolute bottom-0 min-w-fit h-[17.5svh] w-[15vw] portrait:w-[20svh] ${right ? "right-0" : "left-0"} ${className}`}
			style={style}
		>
			{/* Popsicle */}
			<div
				className={`absolute bottom-[-8svh] z-[-5] drop-shadow-md drop-shadow-black/40 ${right ? "left-[-2vw] portrait:left-[-2.7svh]" : "right-0"}`}
			>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					alt="Wooden popsicle stick holding up the sign"
					className="w-[18vw] portrait:w-[24svh] max-w-none"
					style={tilt("50% 100%")}
					{...hoverProps}
				/>
			</div>

			{/* Button */}
			<div
				className={`absolute top-0 z-20 drop-shadow-md drop-shadow-black/40 flex min-w-fit ${right ? "right-0" : "left-0"}`}
			>
				{href ? (
					<a
						href={href}
						onClick={(e) => {
							if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0)
								return;
							e.preventDefault();
							onClick();
						}}
						className="cursor-pointer bg-white border-[0.3svh] border-black border-dashed px-[2vw] portrait:px-[2.5svh] py-[1svh] text-[4svh] portrait:text-[2.8svh] flex whitespace-nowrap"
						style={tilt((portrait ? PORTRAIT_PIVOT : BUTTON_PIVOT)[side])}
						{...hoverProps}
					>
						{children}
					</a>
				) : (
					<button
						onClick={onClick}
						className="cursor-pointer bg-white border-[0.3svh] border-black border-dashed px-[2vw] portrait:px-[2.5svh] py-[1svh] text-[4svh] portrait:text-[2.8svh] flex whitespace-nowrap"
						style={tilt((portrait ? PORTRAIT_PIVOT : BUTTON_PIVOT)[side])}
						{...hoverProps}
					>
						{children}
					</button>
				)}
			</div>
		</div>
	);
}
