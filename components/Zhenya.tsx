"use client";

import type { ComponentProps } from "react";
import { useStage } from "@/components/Stage";
export default function Zhenya({
	className,
	style,
	...props
}: ComponentProps<"img">) {
	const { hat, pins } = useStage();
	const overlay = `${(className ?? "").replace(/\S*shadow\S*/g, "")} pointer-events-none hat-on`;
	return (
		<>
			<img className={className} style={style} {...props} />
			{[pins, hat].map(
				(src) =>
					src && (
						<img
							key={src}
							src={src}
							className={overlay}
							style={{ ...style, filter: "none" }}
							alt=""
							aria-hidden
							draggable={false}
						/>
					),
			)}
		</>
	);
}
