"use client";

import type { ComponentProps, CSSProperties } from "react";
import { useStage } from "@/components/Stage";
export default function Zhenya({
	className,
	style,
	itemStyle,
	...props
}: ComponentProps<"img"> & { itemStyle?: CSSProperties }) {
	const { hat, pins, ribbon } = useStage();
	const overlay = `${(className ?? "").replace(/\S*shadow\S*/g, "")} pointer-events-none hat-on`;
	return (
		<>
			<img className={className} style={style} {...props} />
			{[pins, ribbon, hat].map(
				(src) =>
					src && (
						<img
							key={src}
							src={src}
							className={overlay}
							style={{ ...style, filter: "none", ...itemStyle }}
							alt=""
							aria-hidden
							draggable={false}
						/>
					),
			)}
		</>
	);
}
