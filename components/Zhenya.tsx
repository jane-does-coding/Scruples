"use client";

import type { ComponentProps } from "react";
import { useStage } from "@/components/Stage";

// Zhenya's image, plus the hat she's wearing (from a mystery box) if any.
// The hat images are the same size as hers, with her head in the same spot
// in every one of her animations, so the hat is just a second image with
// exactly the same classes and styles, laid right on top - it drops in,
// flips and walks off with her
export default function Zhenya({
	className,
	style,
	...props
}: ComponentProps<"img">) {
	const { hat } = useStage();
	return (
		<>
			{/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
			<img className={className} style={style} {...props} />
			{hat && (
				// eslint-disable-next-line @next/next/no-img-element
				<img
					key={hat}
					src={hat}
					// Without her shadow (the shadow classes, or a filter like
					// Page 7's) - the hat is part of her silhouette already
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
