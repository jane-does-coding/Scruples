import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Zhenya",
	"Zhenya the marionette doll, waiting on stage for what comes next.",
	"/meet-daphne",
);

export default function Page5Route() {
	return <StagePage page={5} />;
}
