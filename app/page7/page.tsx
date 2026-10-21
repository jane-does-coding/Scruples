import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"The art competition",
	"Zhenya signs up for an art competition - and has to choose which painting to submit.",
	"/page7",
);

export default function Page7Route() {
	return <StagePage page={7} />;
}
