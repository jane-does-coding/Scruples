import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Souvenir shop",
	"Step into Zhenya's little souvenir shop and browse art button pins, Micron pens, a ruled notebook and the Mona Lisa herself.",
	"/page3",
);

export default function Page3Route() {
	return <StagePage page={3} />;
}
