import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Atkinson_Hyperlegible_Next } from "next/font/google";
import Stage from "@/components/Stage";
import { FONT_SCRIPT } from "@/lib/fontScript";
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
	metadataBase: new URL(SITE_URL),
	title: {
		default: SITE_NAME,
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
	viewportFit: "cover",
	themeColor: "#ffffff",
};

const jsonLd = {
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: SITE_NAME,
	description: SITE_DESCRIPTION,
	url: SITE_URL,
	inLanguage: "en",
};

const readable = Atkinson_Hyperlegible_Next({
	subsets: ["latin"],
	variable: "--font-readable",
	display: "swap",
});

export default function RootLayout({ children }: LayoutProps<"/">) {
	return (
		<html
			lang="en"
			className={`h-full antialiased ${readable.variable}`}
			suppressHydrationWarning
		>
			<head>
				<script dangerouslySetInnerHTML={{ __html: FONT_SCRIPT }} />
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
