import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Every artist starts somewhere",
	"Zhenya tries making art for the first time - with a little help from Daphne, and whatever was bought in the souvenir shop.",
	"/page6",
);

export default function Page6Route() {
	return <StagePage page={6} />;
}
