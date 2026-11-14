import { useEffect, useState } from "react";
import { useStage } from "@/components/Stage";
import { loadCompetitor } from "@/lib/competitor";
import { useDrawings } from "@/lib/drawings";
import { STORY_PAGES } from "@/lib/pages";
import { formatPlaytime, loadPlaytime } from "@/lib/playtime";
import { HATS, ITEMS } from "@/lib/shop";
import { SECRETS, loadSecrets } from "@/lib/secrets";

const COLLECTIBLE = Object.keys(ITEMS).filter((item) => item !== "hats");
const PAGE_COUNT = STORY_PAGES.length;

export type Stat = [value: string, label: string];

export default function useStats(shown: boolean) {
	const { owned, money, reached } = useStage();
	const [seconds, setSeconds] = useState(0);
	useEffect(() => {
		if (!shown) return;
		const timer = setTimeout(() => setSeconds(loadPlaytime()), 0);
		return () => clearTimeout(timer);
	}, [shown]);
	const entry = shown ? loadCompetitor().entry : undefined;
	const secrets = shown ? loadSecrets().length : 0;
	const collected = new Set(
		owned.map((item) => (item === "hats" ? "mystery-box" : item)),
	).size;
	const made = useDrawings().filter((d) => !d.id.startsWith("sample")).length;
	const hats = owned.includes("hats") ? Object.keys(HATS).length : 0;
	const stats: { title: string; lines: Stat[] }[] = [
		{
			title: "Your stats",
			lines: [
				[`${collected}/${COLLECTIBLE.length}`, "items collected"],
				[`$${money}`, "total money"],
				[`${hats}/${Object.keys(HATS).length}`, "hats unlocked"],
				[`${made}`, made === 1 ? "drawing made" : "drawings made"],
			],
		},
		{
			title: "Your stats",
			lines: [
				[`${Math.min(reached, PAGE_COUNT)}/${PAGE_COUNT}`, "pages visited"],
				entry === "magic"
					? ["1st", "in the competition"]
					: entry === "yours"
						? ["1", "honorable mention"]
						: ["0", "paintings entered"],
				[formatPlaytime(seconds), "spent at the theatre"],
				[`${secrets}/${SECRETS.length}`, "secrets found"],
			],
		},
	];
	return stats;
}
