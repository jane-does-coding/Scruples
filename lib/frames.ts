export type FrameSize = "tall" | "wide" | "extra-wide";

export type Frame = {
	// The frame's page is at /art-piece/<slug>
	slug: string;
	src: string;
	size: FrameSize;
	// Shown under the frame in the marquee and on its page
	label: string;
};

// Tall frames alternate with wide ones
export const FRAMES: Frame[] = [
	{
		slug: "scream",
		src: "/imgs/frame1.png",
		size: "tall",
		label: "Scream • 1893",
	},
	{
		slug: "sunflowers",
		src: "/imgs/frame3.png",
		size: "wide",
		label: "Sunflowers • 1887",
	},
	{
		slug: "girl-with-a-pearl-earring",
		src: "/imgs/frame2.png",
		size: "tall",
		label: "Girl with a Pearl Earring • 1665",
	},
	{
		slug: "the-starry-night",
		src: "/imgs/frame4.png",
		size: "extra-wide",
		label: "The Starry Night • 1889",
	},
	{
		slug: "the-persistence-of-memory",
		src: "/imgs/frame5.png",
		size: "tall",
		label: "The Persistence of Memory • 1931",
	},
	{
		slug: "the-water-lily-pond",
		src: "/imgs/frame6.png",
		size: "wide",
		label: "The Water Lily Pond • 1899",
	},
];

export const getFrame = (slug: string) =>
	FRAMES.find((frame) => frame.slug === slug);
