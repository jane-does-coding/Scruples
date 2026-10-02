type PageProps = {
	nextPage: () => void;
	previousPage: () => void;
	currentPage: number;
	totalPages: number;
	curtainsOpen: boolean;
};

export default function Page2({ nextPage, previousPage }: PageProps) {
	return (
		<div className="h-full flex flex-col items-center justify-center">
			<h1 className="text-[3.5vh] pt-serif">This is page 2!</h1>

			<img
				src="/imgs/popsicle.png"
				alt=""
				className="absolute w-[18vw] left-[-2vw] bottom-[-7vh] z-[-5]"
			/>
			<button
				onClick={previousPage}
				className="absolute bottom-[11vh] cursor-pointer left-[1vw] border-2 border-black px-6 py-2 z-20 bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] text-[4vh]"
			>
				{/* <span className="w-[0.1vw] bg-black/60 h-[63vh] top-[-63vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[60vh] top-[-60vh] right-0 absolute"></span> */}
				← Back
			</button>

			<img
				src="/imgs/popsicle.png"
				alt=""
				className="absolute w-[15vw] mx-auto bottom-[-13vh] z-[-5]"
			/>
			<button
				onClick={nextPage}
				className="absolute bottom-[3vh] cursor-pointer mx-auto border-2 border-black px-6 py-2 z-20 bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] text-[2.5vh]"
			>
				{/* <span className="w-[0.1vw] bg-black/60 h-[63vh] top-[-63vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[60vh] top-[-60vh] right-0 absolute"></span> */}
				Inventory
			</button>

			<img
				src="/imgs/popsicle.png"
				alt=""
				className="absolute w-[18vw] right-[0vw] bottom-[-7vh] z-[-5]"
			/>
			<button
				onClick={nextPage}
				className="absolute bottom-[11vh] cursor-pointer right-[1vw] border-2 border-black px-6 py-2 z-20 bg-white border-2 border-black border-dashed px-[2vw] py-[1vh] text-[4vh]"
			>
				{/* <span className="w-[0.1vw] bg-black/60 h-[63vh] top-[-63vh] left-0 absolute"></span>
				<span className="w-[0.1vw] bg-black/60 h-[60vh] top-[-60vh] right-0 absolute"></span> */}
				Continue →
			</button>
		</div>
	);
}
