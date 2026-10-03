import PopsicleButton from "@/components/PopsicleButton";

type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

export default function Page3({ previousPage }: PageProps) {
	return (
		<div className="h-full flex flex-col items-center justify-center">
			<img
				src={"/imgs/wiggle.webp"}
				className="h-[100vh] absolute top-[-32.5vh] left-[50%] translate-x-[-50%] test-shadow-darker z-5"
				/* style={{
					...drop(step >= 1, 900, DOLL_DROP),
					transform: step >= 1 ? "translateY(0)" : "translateY(-120vh)",
				}} */
				alt="Zhenya, a marionette doll on strings"
			/>

			<img
				src="/imgs/boxes.webp"
				className="right-[-5vw] top-[5vh] absolute h-[60vh] w-[25vw]"
				alt="Stack of cardboard boxes"
			/>
			<img
				src="/imgs/boxes.webp"
				className="left-[-5vw] top-[5vh] absolute h-[60vh] w-[25vw] -scale-x-[1]"
				alt="Stack of cardboard boxes"
			/>

			<PopsicleButton onClick={previousPage} side="left">
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
