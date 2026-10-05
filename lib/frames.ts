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
};

// Tall frames alternate with wide ones
export const FRAMES: Frame[] = [
	{
		slug: "scream",
		src: asset("/imgs/frame1.webp"),
		size: "tall",
		label: "Scream • 1893",
		artist: "Edvard Munch",
	},
	{
		slug: "sunflowers",
		src: asset("/imgs/frame3.webp"),
		size: "wide",
		label: "Sunflowers • 1887",
		artist: "Vincent van Gogh",
	},
	{
		slug: "girl-with-a-pearl-earring",
		src: asset("/imgs/frame2.webp"),
		size: "tall",
		label: "Girl with a Pearl Earring • 1665",
		artist: "Johannes Vermeer",
	},
	{
		slug: "the-starry-night",
		src: asset("/imgs/frame4.webp"),
		size: "extra-wide",
		label: "The Starry Night • 1889",
		artist: "Vincent van Gogh",
	},
	{
		slug: "the-persistence-of-memory",
		src: asset("/imgs/frame5.webp"),
		size: "tall",
		label: "The Persistence of Memory • 1931",
		artist: "Salvador Dalí",
	},
	{
		slug: "the-water-lily-pond",
		src: asset("/imgs/frame6.webp"),
		size: "wide",
		label: "The Water Lily Pond • 1899",
		artist: "Claude Monet",
	},
];

export const getFrame = (slug: string) =>
	FRAMES.find((frame) => frame.slug === slug);
