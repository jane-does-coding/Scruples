import { asset } from "@/lib/asset";

export type FrameSize = "tall" | "wide" | "extra-wide";

export type Frame = {
	// The frame's page is at /art-piece/<slug>
	slug: string;
	src: string;
	size: FrameSize;
	// Shown under the frame in the marquee and on its page
	label: string;
	// Who painted it, shown on its page as "by <artist>"
	artist: string;
	// On its page, either side of the painting: the facts about the real
	// painting, and a few fun facts
	details: { medium: string; size: string; where: string };
	facts: string[];
};

// Tall frames alternate with wide ones
export const FRAMES: Frame[] = [
	{
		slug: "scream",
		src: asset("/imgs/art/frame1.webp"),
		size: "tall",
		label: "Scream • 1893",
		artist: "Edvard Munch",
		details: {
			medium: "Tempera and crayon on cardboard",
			size: "91 × 73.5 cm",
			where: "National Museum, Oslo",
		},
		facts: [
			"It was stolen in 1994. The thieves left a note: \"Thanks for the poor security\". It was found three months later.",
			"There's more than one Scream - Munch made two paintings, two pastels and a print of it.",
			"A tiny pencil note in the sky says \"Could only have been painted by a madman!\" In 2021, experts proved Munch wrote it himself.",
			"One of the pastel versions sold for almost $120 million in 2012.",
		],
	},
	{
		slug: "sunflowers",
		src: asset("/imgs/art/frame3.webp"),
		size: "wide",
		label: "Sunflowers • 1887",
		artist: "Vincent van Gogh",
		details: {
			medium: "Oil on canvas",
			size: "About 92 × 73 cm",
			where: "Versions in London, Amsterdam, Munich, Philadelphia and Tokyo",
		},
		facts: [
			"Van Gogh's first sunflowers (1887, in Paris) were cut flowers lying on a table - the famous vases came a year later.",
			"He painted the vases to decorate the bedroom of his friend Paul Gauguin, who was coming to stay with him.",
			"In 1987 one sold for almost $40 million - at the time, the most ever paid for a painting.",
			"This frame's version sneaks in irises and roses too - look closely!",
		],
	},
	{
		slug: "girl-with-a-pearl-earring",
		src: asset("/imgs/art/frame2.webp"),
		size: "tall",
		label: "Girl with a Pearl Earring • 1665",
		artist: "Johannes Vermeer",
		details: {
			medium: "Oil on canvas",
			size: "44.5 × 39 cm - smaller than a newspaper",
			where: "Mauritshuis, The Hague",
		},
		facts: [
			"It isn't a portrait of anyone - it's a \"tronie\", a painting of an imaginary face in a fancy costume. Nobody knows who modelled for it.",
			"The pearl is just a couple of brushstrokes - and some experts think it was really polished tin or glass.",
			"A 2018 study found tiny eyelashes, and that the dark background used to be a green curtain.",
			"It's often called \"the Mona Lisa of the North\".",
		],
	},
	{
		slug: "the-starry-night",
		src: asset("/imgs/art/frame4.webp"),
		size: "extra-wide",
		label: "The Starry Night • 1889",
		artist: "Vincent van Gogh",
		details: {
			medium: "Oil on canvas",
			size: "73.7 × 92.1 cm",
			where: "Museum of Modern Art, New York",
		},
		facts: [
			"It's the view from Van Gogh's window at a hospital in Saint-Rémy - but he painted it during the day, from memory.",
			"The little village isn't really there - he made it up.",
			"The brightest \"star\", next to the tree, is probably the planet Venus.",
			"Van Gogh called it a failure in a letter. Now it's one of the most famous paintings in the world.",
		],
	},
	{
		slug: "the-persistence-of-memory",
		src: asset("/imgs/art/frame5.webp"),
		size: "tall",
		label: "The Persistence of Memory • 1931",
		artist: "Salvador Dalí",
		details: {
			medium: "Oil on canvas",
			size: "24 × 33 cm - about the size of a sheet of paper",
			where: "Museum of Modern Art, New York",
		},
		facts: [
			"Dalí said the melting clocks came to him after watching Camembert cheese melt in the sun.",
			"The strange sleeping creature in the middle is often thought to be Dalí himself.",
			"The cliffs in the back are the coast of Catalonia, near where he grew up.",
			"The ants crawling on the closed orange watch were Dalí's favourite sign of decay.",
		],
	},
	{
		slug: "the-water-lily-pond",
		src: asset("/imgs/art/frame6.webp"),
		size: "wide",
		label: "The Water Lily Pond • 1899",
		artist: "Claude Monet",
		details: {
			medium: "Oil on canvas",
			size: "88.3 × 93.1 cm",
			where: "National Gallery, London",
		},
		facts: [
			"Monet dug the pond himself in his garden at Giverny - his neighbours worried his strange water plants would poison the river.",
			"The little bridge is Japanese-style, inspired by the Japanese prints he collected.",
			"He painted his water lilies about 250 times, over almost 30 years.",
			"As his eyesight got worse later in life, the colours in his paintings turned redder and blurrier.",
		],
	},
];

export const getFrame = (slug: string) =>
	FRAMES.find((frame) => frame.slug === slug);
