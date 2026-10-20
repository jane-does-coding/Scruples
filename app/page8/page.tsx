import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Page 8",
	"A page of the Scruples story that's still being made.",
	"/page8",
);

export default function Page8Route() {
	return <StagePage page={8} />;
}
