"use client";

import PopsicleButton from "@/components/PopsicleButton";
import { useStage } from "@/components/Stage";
import type { Frame } from "@/lib/frames";

// A single painting's page, opened by clicking its frame in the marquee
export default function ArtPiece({ frame }: { frame: Frame }) {
	const { goTo } = useStage();

	return (
		<div className="h-full flex flex-col items-center justify-center gap-[2vh]">
			<div className="absolute top-[-2vh] left-0">
				<img
					src={frame.src}
					className="max-h-[50vh] max-w-[40vw] test-shadow z-2 relative"
					alt=""
				/>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] left-[3vw] absolute z-1"></span>
				<span className="w-[0.1vw] bg-black/60 h-[30vh] top-[-25vh] right-[3vw] absolute z-1"></span>
			</div>
			<div className="absolute bottom-[10vh] right-0 test-shadow">
				<h1 className="border-[0.2vh] bg-white px-[1.5vw] py-[1vh] text-[3vh] text-center relative z-2 w-fit mx-auto">
					{frame.label}
				</h1>
				<h1 className="border-[0.2vh] bg-white px-[1.5vw] py-[1vh] text-[3vh] text-center relative z-2 mt-[2vh] w-fit mx-auto">
					by Someone Someone Someone
				</h1>
				<img
					src="/imgs/popsicle.png"
					className="absolute w-[27vw] bottom-[-19vh] left-[50%] -translate-x-[50%] z-0"
					alt=""
				/>
			</div>

			<PopsicleButton onClick={() => goTo("/")} side="left">
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
