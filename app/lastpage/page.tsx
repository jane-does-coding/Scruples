import type { Metadata } from "next";
import LastPage from "@/components/LastPage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Curtain call",
	"The end of Zhenya's story: everyone's drawings, and what art, social media and the magic button were really about.",
	"/lastpage",
);

export default function LastPageRoute() {
	return <LastPage />;
}
