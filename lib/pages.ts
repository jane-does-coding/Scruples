// The story's pages, in order: each one's title (as listed in the menu) and
// address. The addresses say what's on the page; the old /page1 … /page9
// ones redirect here (see next.config.ts)
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
] as const;

// Page n's address (counting from 1)
export const storyHref = (n: number) => STORY_PAGES[n - 1].href;
