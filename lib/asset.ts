// Adds this deploy's version to an image/font URL, e.g. "/imgs/doll3.webp"
// → "/imgs/doll3.webp?v=3f2a91c0". Versioned URLs are cached by browsers for a
// year (see next.config.ts) - safe, because every deploy changes the version,
// so updated images are always picked up. Locally there's no version and the
// URL is left as it is
const VERSION = process.env.NEXT_PUBLIC_ASSET_VERSION;

export const asset = (path: string) =>
	VERSION ? `${path}?v=${VERSION}` : path;

// For srcSet: [["/imgs/a-1200.webp", 1200], ["/imgs/a.webp", 2360]]
export const srcSet = (sources: [string, number][]) =>
	sources.map(([path, width]) => `${asset(path)} ${width}w`).join(", ");
