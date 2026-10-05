import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Zhenya likes art",
	"Zhenya loves famous paintings - browse The Scream, The Starry Night, the Mona Lisa and more, and click any of them to take a closer look.",
	"/page2",
);

export default function Page2Route() {
	return <StagePage page={2} />;
}
