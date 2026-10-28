import type { NextConfig } from "next";
import { STORY_PAGES } from "./lib/pages";

const SHORT_CACHE = "public, max-age=3600, stale-while-revalidate=86400";
const LONG_CACHE = "public, max-age=31536000, immutable";

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
	devIndicators: { position: "bottom-right" },
	env: {
		NEXT_PUBLIC_ASSET_VERSION:
			process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "",
	},
	redirects() {
		return STORY_PAGES.map(({ href }, i) => ({
			source: `/page${i + 1}`,
			destination: href,
			permanent: true,
		}));
	},
	headers() {
		return [
			{
				source: "/:path*",
				headers: SECURITY_HEADERS,
			},
			...ASSET_PATHS.map((source) => ({
				source,
				headers: [{ key: "Cache-Control", value: SHORT_CACHE }],
			})),
			...ASSET_PATHS.map((source) => ({
				source,
				has: [{ type: "query" as const, key: "v" }],
				headers: [{ key: "Cache-Control", value: LONG_CACHE }],
			})),
		];
	},
};

export default nextConfig;
