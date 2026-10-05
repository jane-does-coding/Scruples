import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Art on social media",
	"See how artists share their digital and traditional art on social media today.",
	"/page4",
);

export default function Page4Route() {
	return <StagePage page={4} />;
}
