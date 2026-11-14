import { asset } from "@/lib/asset";

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
	"mystery-box": {
		name: "Mystery box",
		price: 10,
		image: asset("/imgs/shop/mystery-box2.webp"),
		description: "A cardboard box with four hats inside. Open it to see them!",
	},
	hats: {
		name: "Hats",
		price: 0,
		image: asset("/imgs/hats/hats-preview.webp"),
		description:
			"The Spongebob Hat, the Star vs the Forces of Evil Horns, the Adventure time crown and the Gravity Falls hat, from the mystery box.",
	},
	"magic-drawing": {
		name: "The magic button's drawing",
		art: true,
		price: 0,
		image: asset("/imgs/art/drawing-lilies.webp"),
		description:
			"A drawing of lilies in a frame. The magic button made it in a second - nobody drew it.",
	},
	prize: {
		name: "1st place trophy",
		price: 0,
		image: asset("/imgs/awards/prize.webp"),
		description:
			"The first place ribbon from the Annual Art Competition, won with the magic button's drawing.",
	},
	"honorable-mention": {
		name: "Honorable mention ribbon",
		price: 0,
		image: asset("/imgs/awards/honorable-mention.webp"),
		description:
			"An honorable mention from the Annual Art Competition, for a drawing Zhenya made herself.",
	},
	key: {
		name: "Old key",
		price: 0,
		image: asset("/imgs/stage/key.webp"),
		description:
			"An old key Zhenya found under the corner of the carpet backstage. I wonder what it could be for...",
	},
	secret: {
		name: "Secret",
		price: 0,
		image: asset("/imgs/stage/keyhole.webp"),
		description: "Something that was hidden behind the little keyhole...",
	},
	"bird-secret": {
		name: "Bird's secret",
		price: 0,
		image: asset("/imgs/stage/bird.webp"),
		description: "Something the little bird by the souvenir shop was keeping...",
	},
} as const;

export type ItemId = keyof typeof ITEMS;

export const HATS = {
	sailor: {
		name: "Spongebob Hat",
		image: asset("/imgs/hats/hat-sailor-thumb.webp"),
		wear: asset("/imgs/hats/hat-sailor.webp"),
	},
	devil: {
		name: "Star vs the Forces of Evil Horns",
		image: asset("/imgs/hats/hat-devil-thumb.webp"),
		wear: asset("/imgs/hats/hat-devil.webp"),
	},
	crown: {
		name: "Adventure time crown",
		image: asset("/imgs/hats/hat-crown-thumb.webp"),
		wear: asset("/imgs/hats/hat-crown.webp"),
	},
	cap: {
		name: "Gravity Falls hat",
		image: asset("/imgs/hats/hat-cap-thumb.webp"),
		wear: asset("/imgs/hats/hat-cap.webp"),
	},
};
export type HatId = keyof typeof HATS;

export const STARTING_MONEY = 15;

export const billsFor = (money: number) => ({
	fives: Math.floor(money / 5),
	ones: money % 5,
});

export const BILL_IMAGES = {
	five: asset("/imgs/shop/money.webp"),
	one: asset("/imgs/shop/money.webp"),
};
