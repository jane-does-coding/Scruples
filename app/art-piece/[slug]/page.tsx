import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArtPiece from "@/components/ArtPiece";
import { FRAMES, getFrame } from "@/lib/frames";
import { pageMetadata, SITE_URL } from "@/lib/site";

// One page per frame in the marquee, e.g. /art-piece/the-starry-night
export function generateStaticParams() {
	return FRAMES.map(({ slug }) => ({ slug }));
}

// Any other /art-piece/something is a 404
export const dynamicParams = false;

// "The Starry Night • 1889" → ["The Starry Night", "1889"]
const titleAndYear = (label: string) => label.split(" • ");

export async function generateMetadata({
	params,
}: PageProps<"/art-piece/[slug]">): Promise<Metadata> {
	const { slug } = await params;
	const frame = getFrame(slug);
	if (!frame) return {};

	const [title, year] = titleAndYear(frame.label);
	return pageMetadata(
		frame.label,
		`${title} by ${frame.artist}${year ? `, ${year}` : ""} - one of the famous paintings Zhenya loves, hanging in a hand-drawn picture frame.`,
		`/art-piece/${slug}`,
	);
}

export default async function FramePage({
	params,
}: PageProps<"/art-piece/[slug]">) {
	const { slug } = await params;
	const frame = getFrame(slug);
	if (!frame) notFound();

	const [title, year] = titleAndYear(frame.label);
	// Describes the painting for search engines
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "VisualArtwork",
		name: title,
		...(year && { dateCreated: year }),
		creator: { "@type": "Person", name: frame.artist },
		artform: "Painting",
		image: `${SITE_URL}${frame.src}`,
		url: `${SITE_URL}/art-piece/${slug}`,
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(jsonLd).replace(/</g, "\\u003c"),
				}}
			/>
			<ArtPiece frame={frame} />
		</>
	);
}
