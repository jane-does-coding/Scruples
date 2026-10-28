export const SITE_NAME = "Scruples";

export const ALWAYS_PLAY_OPENING = true;

export const SITE_DESCRIPTION =
	"Step through the curtains and meet Zhenya, a marionette doll who loves art - wander past famous paintings, browse a tiny souvenir shop, and see how artists share their work online.";

export const SITE_URL = process.env.VERCEL_PROJECT_PRODUCTION_URL
	? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
	: "http://localhost:3000";

export const OG_IMAGE = {
	url: "/og.jpg",
	width: 1200,
	height: 630,
	alt: "A theatre ticket on closed stage curtains",
};

export const pageMetadata = (
	title: string,
	description: string,
	path: string,
	image: {
		url: string;
		alt: string;
		width?: number;
		height?: number;
	} = OG_IMAGE,
) => ({
	title,
	description,
	alternates: { canonical: path },
	openGraph: {
		type: "website" as const,
		siteName: SITE_NAME,
		locale: "en_US",
		title: `${title} · ${SITE_NAME}`,
		description,
		url: path,
		images: [image],
	},
	twitter: {
		card: "summary_large_image" as const,
		title: `${title} · ${SITE_NAME}`,
		description,
		images: [image.url],
	},
});
