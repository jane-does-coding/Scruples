import { notFound } from "next/navigation";
import ArtPiece from "@/components/ArtPiece";
import { FRAMES, getFrame } from "@/lib/frames";

// One page per frame in the marquee, e.g. /art-piece/the-starry-night
export function generateStaticParams() {
	return FRAMES.map(({ slug }) => ({ slug }));
}

// Any other /art-piece/something is a 404
export const dynamicParams = false;

export async function generateMetadata({
	params,
}: PageProps<"/art-piece/[slug]">) {
	const { slug } = await params;
	return { title: getFrame(slug)?.label };
}

export default async function FramePage({
	params,
}: PageProps<"/art-piece/[slug]">) {
	const { slug } = await params;
	const frame = getFrame(slug);
	if (!frame) notFound();

	return <ArtPiece frame={frame} />;
}
