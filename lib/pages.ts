export const STORY_PAGES = [
	{ title: "Meet Zhenya", href: "/meet-zhenya" },
	{ title: "Zhenya likes art", href: "/zhenya-likes-art" },
	{ title: "Souvenir shop", href: "/souvenir-shop" },
	{ title: "Art on social media", href: "/art-on-social-media" },
	{ title: "Meet Daphne", href: "/meet-daphne" },
	{
		title: "Every artist starts somewhere",
		href: "/every-artist-starts-somewhere",
	},
	{ title: "The art competition", href: "/art-competition" },
	{ title: "The results", href: "/competition-results" },
	{ title: "In the spotlight", href: "/in-the-spotlight" },
	{ title: "Cutting the strings", href: "/cutting-the-strings" },
	{ title: "About the creator", href: "/about", extra: true },
	{ title: "The progress", href: "/the-progress", extra: true },
	{ title: "The gallery", href: "/gallery", extra: true },
] as const;

export const storyHref = (n: number) => STORY_PAGES[n - 1].href;
