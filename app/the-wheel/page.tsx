import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"The wheel",
	"Two paper circles, one turning behind the other.",
	"/the-wheel",
);

export default function Page10Route() {
	return <StagePage page={10} />;
}
