import { asset } from "@/lib/asset";

// Everything that can be bought, and what it costs. Bought items show up in
// the inventory (the "?" menu). `art` = a picture, which can be viewed big
// from the inventory
export const ITEMS = {
	pins: {
		name: "Art Gallery button pins",
		price: 10,
		image: asset("/imgs/shop/buttons.webp"),
		description:
			"Four button pins from the gallery shop: almond blossoms, the hands from The Creation of Adam, goldfish and a water lily.",
	},
	pens: {
		name: "Micron pens",
		price: 16,
		image: asset("/imgs/shop/pens.webp"),
		description:
			"A pack of six Micron fine-liner pens, from the thinnest 005 nib up to 08 - the kind artists ink their drawings with.",
	},
	notebook: {
		name: "Ruled notebook",
		price: 8,
		image: asset("/imgs/shop/notebook.webp"),
		description:
			"A ruled notebook with an elastic band and a bookmark ribbon. Good for notes, lists and first sketches.",
	},
	"mona-lisa": {
		name: "The Mona Lisa",
		art: true,
		price: 1_000_000_000,
		image: asset("/imgs/shop/mona_lisa.webp"),
		description:
			"The Mona Lisa by Leonardo da Vinci, the most famous painting in the world. Somehow it was for sale.",
	},
	"daphne-drawing": {
		name: "Daphne's drawing",
		art: true,
		price: 10,
		image: asset("/imgs/art/drawing-smile.webp"),
		description:
			"A smiley face on an easel that Daphne drew for Zhenya, one stroke at a time.",
	},
	// Opened from the inventory, it turns into the four hats (one "hats"
	// slot). After that it's sold out
	"mystery-box": {
		name: "Mystery box",
		price: 10,
		image: asset("/imgs/shop/mystery-box2.webp"),
		description: "A cardboard box with four hats inside. Open it to see them!",
	},
	// The four hats from the mystery box, kept together in one inventory
	// slot. Clicking it opens the wardrobe (see HATS). Price 0 - they can't
	// be sold
	hats: {
		name: "Hats",
		price: 0,
		image: asset("/imgs/hats/hats-preview.webp"),
		description:
			"A sailor hat, devil horns, a princess crown and a backwards cap, from the mystery box.",
	},
	// Not for sale - it's what the magic button makes on Page 5. Price 0 means
	// it can't be sold
	"magic-drawing": {
		name: "The magic button's drawing",
		art: true,
		price: 0,
		image: asset("/imgs/art/drawing-lilies.webp"),
		description:
			"A drawing of lilies in a frame. The magic button made it in a second - nobody drew it.",
	},
} as const;

export type ItemId = keyof typeof ITEMS;

// The hats in the mystery box, for Zhenya to try on in the wardrobe.
// `image` is its preview drawing, cropped close (in the wardrobe's boxes);
// `wear` is the hat drawn the same size as the doll's images, so it can be
// laid right over her
export const HATS = {
	sailor: {
		name: "Sailor hat",
		image: asset("/imgs/hats/hat-sailor-thumb.webp"),
		wear: asset("/imgs/hats/hat-sailor.webp"),
	},
	devil: {
		name: "Devil horns",
		image: asset("/imgs/hats/hat-devil-thumb.webp"),
		wear: asset("/imgs/hats/hat-devil.webp"),
	},
	crown: {
		name: "Princess crown",
		image: asset("/imgs/hats/hat-crown-thumb.webp"),
		wear: asset("/imgs/hats/hat-crown.webp"),
	},
	cap: {
		name: "Backwards cap",
		image: asset("/imgs/hats/hat-cap-thumb.webp"),
		wear: asset("/imgs/hats/hat-cap.webp"),
	},
};
export type HatId = keyof typeof HATS;

// You start with three $5 bills
export const STARTING_MONEY = 15;

// The bills to show for an amount: as many $5s as fit, the rest in $1s
// (e.g. $7 → one $5 and two $1s)
export const billsFor = (money: number) => ({
	fives: Math.floor(money / 5),
	ones: money % 5,
});

// Bill images. There's no $1 drawing yet, so $1s use the $5 image for now
export const BILL_IMAGES = {
	five: asset("/imgs/shop/money.webp"),
	one: asset("/imgs/shop/money.webp"),
};
