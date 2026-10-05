import type { NextConfig } from "next";

// Images and fonts are cached by the browser for an hour (then refreshed in
// the background for up to a day), instead of being re-checked on every
// visit. Kept short because the files aren't renamed when they're updated
const ASSET_CACHE = "public, max-age=3600, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
	headers() {
		return [
			"/imgs/:path*",
			"/scribbler-font/:path*",
			"/og.jpg",
		].map((source) => ({
			source,
			headers: [{ key: "Cache-Control", value: ASSET_CACHE }],
		}));
	},
};

export default nextConfig;
