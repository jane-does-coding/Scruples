import type { Metadata } from "next";
import StagePage from "@/components/StagePage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Meet Daphne",
	"Zhenya meets Daphne, an artist who draws by hand - and a magic button that makes perfect pictures in a second.",
	"/meet-daphne",
);

export default function Page5Route() {
	return <StagePage page={5} />;
}
