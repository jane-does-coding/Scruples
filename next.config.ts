import type { NextConfig } from "next";
import { STORY_PAGES } from "./lib/pages";

// Images and fonts in public/ aren't renamed when they change, so by default
// they're only cached for an hour (then refreshed in the background for up to
// a day)
const SHORT_CACHE = "public, max-age=3600, stale-while-revalidate=86400";
// URLs made with asset() carry ?v=<this deploy's version>, which changes on
// every deploy - so those can safely be cached for a year
const LONG_CACHE = "public, max-age=31536000, immutable";

// Don't let browsers guess file types, don't send full URLs to other sites,
// don't allow the site to be framed by others, and switch off device
// features it never uses
const SECURITY_HEADERS = [
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "X-Frame-Options", value: "SAMEORIGIN" },
	{
		key: "Permissions-Policy",
		value: "camera=(), microphone=(), geolocation=(), payment=()",
	},
];

const ASSET_PATHS = ["/imgs/:path*", "/scribbler-font/:path*", "/og.jpg"];

const nextConfig: NextConfig = {
	// The dev-only "N" badge goes bottom-right, out of the page marker's way
	devIndicators: { position: "bottom-right" },
	env: {
		// The deploy's git commit on Vercel; empty locally (no versioning)
		NEXT_PUBLIC_ASSET_VERSION:
			process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "",
	},
	// The story's pages used to be /page1 … /page9: those addresses (old
	// links, bookmarks, search results) go to the new ones for good
	redirects() {
		return STORY_PAGES.map(({ href }, i) => ({
			source: `/page${i + 1}`,
			destination: href,
			permanent: true,
		}));
	},
	headers() {
		return [
			// Basic security headers on every page and file
			{
				source: "/:path*",
				headers: SECURITY_HEADERS,
			},
			...ASSET_PATHS.map((source) => ({
				source,
				headers: [{ key: "Cache-Control", value: SHORT_CACHE }],
			})),
			// Later rules win, so versioned requests get the long cache
			...ASSET_PATHS.map((source) => ({
				source,
				has: [{ type: "query" as const, key: "v" }],
				headers: [{ key: "Cache-Control", value: LONG_CACHE }],
			})),
		];
	},
};

export default nextConfig;
