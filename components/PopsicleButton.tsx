import { useState, type CSSProperties, type ReactNode } from "react";
import { asset } from "@/lib/asset";
import usePortrait from "@/components/usePortrait";

type PopsicleButtonProps = {
	onClick: () => void;
	href?: string;
	children: ReactNode;
	side?: "left" | "right";
	className?: string;
	style?: CSSProperties;
};

const PIVOT_Y = "25.5svh";
const BUTTON_PIVOT = {
	right: `calc(100% - 8vw) ${PIVOT_Y}`,
	left: `6vw ${PIVOT_Y}`,
};
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

	const [hover, setHover] = useState(false);
	const hoverProps = {
		onMouseEnter: () => setHover(true),
		onMouseLeave: () => setHover(false),
	};
	const tilt = (transformOrigin: string) => ({
		transition: "transform 250ms cubic-bezier(0.25, 0.8, 0.25, 1)",
		transform: hover ? `rotate(${right ? 1.5 : -1.5}deg)` : "rotate(0deg)",
		transformOrigin,
	});

	return (
		<div
			className={`test-shadow-darker absolute bottom-0 min-w-fit h-[17.5svh] w-[15vw] portrait:w-[20svh] ${right ? "right-0" : "left-0"} ${className}`}
			style={style}
		>
			<div
				className={`absolute bottom-[-8svh] z-[-5] drop-shadow-md drop-shadow-black/40 ${right ? "left-[-2vw] portrait:left-[-2.7svh]" : "right-0"}`}
			>
				<img
					src={asset("/imgs/stage/popsicle.webp")}
					alt="Wooden popsicle stick holding up the sign"
					data-hit
					className="w-[18vw] portrait:w-[24svh] max-w-none cursor-pointer"
					style={tilt("50% 100%")}
					onClick={onClick}
					{...hoverProps}
				/>
			</div>

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
