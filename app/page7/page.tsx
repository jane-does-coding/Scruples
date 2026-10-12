import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"In the spotlight",
	"Zhenya alone on the stage, under the spotlight.",
	"/page7",
);

export default function Page7Route() {
	return <StagePage page={7} />;
}
