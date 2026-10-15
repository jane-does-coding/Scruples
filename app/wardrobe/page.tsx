import type { Metadata } from "next";
import WardrobePage from "@/components/WardrobePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = {
	...pageMetadata(
		"Zhenya's hats",
		"Try the hats from the mystery box on Zhenya, a marionette doll.",
		"/wardrobe",
	),
	// Only useful with hats in the inventory, so it's left out of search
	robots: { index: false },
};

export default function WardrobeRoute() {
	return <WardrobePage />;
}
