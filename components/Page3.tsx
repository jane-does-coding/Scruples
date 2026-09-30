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

			<button
				onClick={previousPage}
				className="absolute bottom-6 left-6 border-2 border-black px-6 py-2 z-20"
			>
				← Back
			</button>
		</div>
	);
}
