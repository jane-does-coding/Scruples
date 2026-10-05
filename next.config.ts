import type { NextConfig } from "next";

// Images and fonts in public/ aren't renamed when they change, so by default
// they're only cached for an hour (then refreshed in the background for up to
// a day)
const SHORT_CACHE = "public, max-age=3600, stale-while-revalidate=86400";
// URLs made with asset() carry ?v=<this deploy's version>, which changes on
// every deploy - so those can safely be cached for a year
const LONG_CACHE = "public, max-age=31536000, immutable";

const ASSET_PATHS = ["/imgs/:path*", "/scribbler-font/:path*", "/og.jpg"];

const nextConfig: NextConfig = {
	env: {
		// The deploy's git commit on Vercel; empty locally (no versioning)
		NEXT_PUBLIC_ASSET_VERSION:
			process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "",
	},
	headers() {
		return [
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
