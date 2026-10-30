import type { Metadata } from "next";
import AboutPage from "@/components/AboutPage";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"About the creator",
	"Who drew and built Scruples, the hand-drawn marionette theatre.",
	"/about",
);

export default function AboutRoute() {
	return <AboutPage />;
}
