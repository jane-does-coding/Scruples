import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Backstage",
	"Zhenya takes you through the curtains and into the room behind the stage.",
	"/backstage",
);

export default function Page10Route() {
	return <StagePage page={10} />;
}
