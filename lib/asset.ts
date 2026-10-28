const VERSION = process.env.NEXT_PUBLIC_ASSET_VERSION;

export const asset = (path: string) =>
	VERSION ? `${path}?v=${VERSION}` : path;

export const srcSet = (sources: [string, number][]) =>
	sources.map(([path, width]) => `${asset(path)} ${width}w`).join(", ");
