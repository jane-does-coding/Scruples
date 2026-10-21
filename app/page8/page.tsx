import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"The results",
	"The results of the art competition - and how it feels to win, or lose, against a magic button.",
	"/page8",
);

export default function Page8Route() {
	return <StagePage page={8} />;
}
