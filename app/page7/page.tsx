import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Page 7",
	"A page of the Scruples story that's still being made.",
	"/page7",
);

export default function Page7Route() {
	return <StagePage page={7} />;
}
