"use client";

import Page1 from "@/components/Page1";
import Page2 from "@/components/Page2";
import Page3 from "@/components/Page3";
import { useStage } from "@/components/Stage";

const PAGES = [Page1, Page2, Page3];

// Renders Page1/2/3 for the /page1, /page2, /page3 routes. Next/previous go
// through the curtains to the neighbouring route
export default function StagePage({ page }: { page: number }) {
	const { curtainsOpen, goTo } = useStage();
	const Page = PAGES[page - 1];

	const goToPage = (target: number) => {
		if (target < 1 || target > PAGES.length) return;
		goTo(`/page${target}`);
	};

	return (
		<Page
			nextPage={() => goToPage(page + 1)}
			previousPage={() => goToPage(page - 1)}
			currentPage={page - 1}
			totalPages={PAGES.length}
			curtainsOpen={curtainsOpen}
		/>
	);
}
