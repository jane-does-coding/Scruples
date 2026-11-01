import type { Metadata } from "next";
import ProgressPage from "@/components/ProgressPage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"The progress",
	"Props, hats and pieces that were drawn for Scruples but never made it on stage.",
	"/the-progress",
);

export default function ProgressRoute() {
	return <ProgressPage />;
}
