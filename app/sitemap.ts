import type { MetadataRoute } from "next";
import { FRAMES } from "@/lib/frames";
import { STORY_PAGES } from "@/lib/pages";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
	const pages = STORY_PAGES.map(({ href }, i) => ({
		url: `${SITE_URL}${href}`,
		changeFrequency: "monthly" as const,
		priority: i === 0 ? 1 : 0.8,
	}));
	const ending = ["/lastpage", "/gallery"].map((path) => ({
		url: `${SITE_URL}${path}`,
		changeFrequency: "weekly" as const,
		priority: 0.7,
	}));
	const paintings = FRAMES.map(({ slug }) => ({
		url: `${SITE_URL}/art-piece/${slug}`,
		changeFrequency: "yearly" as const,
		priority: 0.6,
	}));
	return [...pages, ...ending, ...paintings];
}
