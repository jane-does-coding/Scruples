import { asset } from "@/lib/asset";

// Everything that can be bought, and what it costs. Bought items show up in
// the inventory (the "?" menu)
export const ITEMS = {
	pins: {
		name: "Art Gallery button pins",
		price: 10,
		image: asset("/imgs/buttons.webp"),
		description:
			"Four button pins from the gallery shop: almond blossoms, the hands from The Creation of Adam, goldfish and a water lily.",
	},
	pens: {
		name: "Micron pens",
		price: 16,
		image: asset("/imgs/pens.webp"),
		description:
			"A pack of six Micron fine-liner pens, from the thinnest 005 nib up to 08 - the kind artists ink their drawings with.",
	},
	notebook: {
		name: "Ruled notebook",
		price: 8,
		image: asset("/imgs/notebook.webp"),
		description:
			"A ruled notebook with an elastic band and a bookmark ribbon. Good for notes, lists and first sketches.",
	},
	"mona-lisa": {
		name: "The Mona Lisa",
		price: 1_000_000_000,
		image: asset("/imgs/mona_lisa.webp"),
		description:
			"The Mona Lisa by Leonardo da Vinci, the most famous painting in the world. Somehow it was for sale.",
	},
	"daphne-drawing": {
		name: "Daphne's drawing",
		price: 10,
		image: asset("/imgs/drawing-smile.webp"),
		description:
			"A smiley face on an easel that Daphne drew for Zhenya, one stroke at a time.",
	},
} as const;

export type ItemId = keyof typeof ITEMS;

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
	five: asset("/imgs/money.webp"),
	one: asset("/imgs/money.webp"),
};
