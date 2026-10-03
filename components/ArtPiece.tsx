"use client";

import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import type { Frame } from "@/lib/frames";

// A single painting's page, opened by clicking its frame in the marquee
export default function ArtPiece({ frame }: { frame: Frame }) {
	const { goTo } = useStage();

	return (
		<div className="h-full flex flex-col items-center justify-center gap-[2vh]">
			<div className="relative">
				<img
					src={frame.src}
					className="max-h-[50vh] max-w-[40vw] test-shadow z-2 relative"
					alt=""
				/>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] left-[3vw] absolute z-1"></span>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] right-[3vw] absolute z-1"></span>
			</div>
			<h1 className="border-[0.2vh] bg-white px-[1.5vw] py-[1vh] text-[3vh] text-center test-shadow">
				{frame.label}
			</h1>

			<PopsicleButton onClick={() => goTo("/")} side="left">
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
