"use client";

import { useState } from "react";
import Page1 from "@/components/Page1";
import Page2 from "@/components/Page2";
import Page3 from "@/components/Page3";

export default function Home() {
	const [currentPage, setCurrentPage] = useState(0);

	const pages = [Page1, Page2, Page3];

	const CurrentPage = pages[currentPage];

	const nextPage = () => {
		if (currentPage < pages.length - 1) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	const previousPage = () => {
		if (currentPage > 0) {
			setCurrentPage((prev) => prev - 1);
		}
	};

	return (
		<div className="relative min-h-screen">
			{/* Decorations */}
			<div className="fixed z-3 flex top-0 left-0">
				{Array.from({ length: 9 }).map((_, i) => (
					<div key={i} className="flex">
						<div className="bg-neutral-50 rounded-b-full h-[12.5vh] w-[12vh] shadow-neutral-900/40 shadow-md" />
						<div className="bg-neutral-500 rounded-b-full h-[12.5vh] w-[12vh] shadow-neutral-900/40 shadow-md" />
					</div>
				))}
			</div>

			<div className="fixed z-3 flex bottom-0 left-0">
				{Array.from({ length: 9 }).map((_, i) => (
					<div key={i} className="flex">
						<div className="bg-neutral-200 h-[8.5vh] w-[12vh] shadow-neutral-900/40 shadow-md" />
						<div className="bg-neutral-500 h-[8.5vh] w-[12vh] shadow-neutral-900/40 shadow-md" />
					</div>
				))}
			</div>

			{/* Content */}
			<div className="bg-white/60 border-2 border-black w-[80vw] h-[85vh] mx-auto top-[7.5vh] z-1 relative">
				<CurrentPage
					nextPage={nextPage}
					previousPage={previousPage}
					currentPage={currentPage}
					totalPages={pages.length}
				/>
			</div>

			{/* Background */}
			<div className="z-0 fixed top-0 left-0 h-screen w-screen">
				<img
					src="/imgs/paper-bg.jpg"
					alt=""
					className="w-full h-full object-cover"
				/>
			</div>
		</div>
	);
}
