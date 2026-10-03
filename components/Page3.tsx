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
			<h1 className="text-[3.5vh] pt-serif">Last page!</h1>

			<PopsicleButton onClick={previousPage} side="left">
				{"<-"} Back
			</PopsicleButton>
		</div>
	);
}
