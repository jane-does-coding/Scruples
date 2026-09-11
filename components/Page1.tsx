type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
};

export default function Page1({ nextPage }: PageProps) {
	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="text-[3.5vh] pt-serif max-w-[70%] mx-auto text-center">
				A Group of friends and/or family are having a lot of fun, and playing
				games, celebrating a friend getting into college, really happy for them.
			</h1>

			<button
				onClick={nextPage}
				className="absolute bottom-6 right-6 border-2 border-black px-6 py-2"
			>
				Next →
			</button>
		</div>
	);
}
