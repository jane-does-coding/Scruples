"use client";

import type { ComponentProps } from "react";
import { useStage } from "@/components/Stage";
export default function Zhenya({
	className,
	style,
	...props
}: ComponentProps<"img">) {
	const { hat } = useStage();
	return (
		<>
			<img className={className} style={style} {...props} />
			{hat && (
				<img
					key={hat}
					src={hat}
					className={`${(className ?? "").replace(/\S*shadow\S*/g, "")} pointer-events-none hat-on`}
					style={{ ...style, filter: "none" }}
					alt=""
					aria-hidden
					draggable={false}
				/>
			)}
		</>
	);
}
