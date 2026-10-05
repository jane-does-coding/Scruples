import type { Metadata, Viewport } from "next";
import { PT_Serif } from "next/font/google";
import "./globals.css";
import Stage from "@/components/Stage";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

// PT Serif is self-hosted by Next instead of loaded from Google's stylesheet,
// so it doesn't block the first render or need extra domains. .pt-serif in
// globals.css uses this variable
const ptSerif = PT_Serif({
	weight: ["400", "700"],
	style: ["normal", "italic"],
	subsets: ["latin"],
	display: "swap",
	variable: "--font-pt-serif",
	// Almost every label also has .scribbler, which wins, so PT Serif is rarely
	// shown - don't let its four files jump ahead of the ticket and curtains
	preload: false,
});

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
		<html lang="en" className={`${ptSerif.variable} h-full antialiased`}>
			<head>
				{/* The Scribbler font is used everywhere, so start downloading it
				    with the page instead of waiting for the CSS to ask for it */}
				<link
					rel="preload"
					href="/scribbler-font/Scribbler.otf"
					as="font"
					type="font/otf"
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
