import type { Metadata } from "next";
import DrawingGallery from "@/components/DrawingGallery";
import { pageMetadata } from "@/lib/site";

export const metadata: Metadata = pageMetadata(
	"Everyone's drawings",
	"Every drawing made on the Scruples stage, framed and hung on one wall.",
	"/gallery",
);

export default function GalleryRoute() {
	return <DrawingGallery />;
}
