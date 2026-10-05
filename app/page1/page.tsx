import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Meet Zhenya",
	"Meet Zhenya, a marionette doll on strings, and say hi to start the show.",
	"/page1",
);

export default function Page1Route() {
	return <StagePage page={1} />;
}
