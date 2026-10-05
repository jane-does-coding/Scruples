import type { MetadataRoute } from "next";
import { FRAMES } from "@/lib/frames";
import { SITE_URL } from "@/lib/site";

// Served as /sitemap.xml - the four story pages and every painting's page
export default function sitemap(): MetadataRoute.Sitemap {
	const pages = [1, 2, 3, 4].map((n) => ({
		url: `${SITE_URL}/page${n}`,
		changeFrequency: "monthly" as const,
		priority: n === 1 ? 1 : 0.8,
	}));
	const paintings = FRAMES.map(({ slug }) => ({
		url: `${SITE_URL}/art-piece/${slug}`,
		changeFrequency: "yearly" as const,
		priority: 0.6,
	}));
	return [...pages, ...paintings];
}
