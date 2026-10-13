import type { Metadata, Viewport } from "next";
import "./globals.css";
import Stage from "@/components/Stage";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: SITE_NAME,
		// Each page's own title becomes e.g. "Souvenir shop · Scruples"
		template: `%s · ${SITE_NAME}`,
	},
	description: SITE_DESCRIPTION,
	applicationName: SITE_NAME,
	authors: [{ name: "Zhenya" }],
	keywords: [
		"marionette",
		"interactive story",
		"art",
		"paintings",
		"souvenir shop",
		"theatre",
	],
	openGraph: {
		type: "website",
		siteName: SITE_NAME,
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		locale: "en_US",
		images: [OG_IMAGE],
	},
	twitter: {
		card: "summary_large_image",
		title: SITE_NAME,
		description: SITE_DESCRIPTION,
		images: ["/og.jpg"],
	},
	formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	// Fill the whole screen on phones with rounded corners / notches
	viewportFit: "cover",
	// The browser bar's colour on phones - the white of the paper
	themeColor: "#ffffff",
};

// Describes the site for search engines
const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: SITE_NAME,
	description: SITE_DESCRIPTION,
	url: SITE_URL,
	inLanguage: "en",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html lang="en" className="h-full antialiased">
			<head>
				{/* The Scribbler font is used everywhere, so start downloading it
				    with the page instead of waiting for the CSS to ask for it */}
				<link
					rel="preload"
					href="/scribbler-font/Scribbler.woff2"
					as="font"
					type="font/woff2"
					crossOrigin="anonymous"
				/>
			</head>
			<body className="min-h-full flex flex-col">
				<script
					type="application/ld+json"
					dangerouslySetInnerHTML={{
						__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
					}}
				/>
				<Stage>{children}</Stage>
			</body>
		</html>
	);
}
