"use client";

import Page1 from "@/components/Page1";
import Page2 from "@/components/Page2";
import Page3 from "@/components/Page3";
import { useStage } from "@/components/Stage";

const pages = [Page1, Page2, Page3];

export default function Home() {
	const { curtainsOpen, changeScene, homePage, setHomePage } = useStage();

	const CurrentPage = pages[homePage];

	const goToPage = (delta: number) => {
		const target = homePage + delta;
		if (target < 0 || target >= pages.length) return;
		// Swap the page while the curtains are closed
		changeScene(() => setHomePage(target));
	};

	return (
		<CurrentPage
			nextPage={() => goToPage(1)}
			previousPage={() => goToPage(-1)}
			currentPage={homePage}
			totalPages={pages.length}
			curtainsOpen={curtainsOpen}
		/>
	);
}
