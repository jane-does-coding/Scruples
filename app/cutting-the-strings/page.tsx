import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Cutting the strings",
	"Zhenya cuts her own strings, and the whole theatre comes into view.",
	"/cutting-the-strings",
);

export default function Page11Route() {
	return <StagePage page={11} />;
}
