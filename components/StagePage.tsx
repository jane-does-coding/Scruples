"use client";

import Page1 from "@/components/Page1";
import Page2 from "@/components/Page2";
import Page3 from "@/components/Page3";
import Page4 from "@/components/Page4";
import Page5 from "@/components/Page5";
import Page6 from "@/components/Page6";
import Page7 from "@/components/Page7";
import Page8 from "@/components/Page8";
import Page9 from "@/components/Page9";
import Page10 from "@/components/Page10";
import Page11 from "@/components/Page11";
import { useStage } from "@/components/Stage";
import { storyHref } from "@/lib/pages";

const PAGES = [
	Page1,
	Page2,
	Page3,
	Page4,
	Page5,
	Page6,
	Page7,
	Page8,
	Page9,
	Page10,
	Page11,
];

export default function StagePage({ page }: { page: number }) {
	const { curtainsOpen, goTo } = useStage();
	const Page = PAGES[page - 1];

	const goToPage = (target: number) => {
		if (target < 1 || target > PAGES.length) return;
		goTo(storyHref(target));
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
