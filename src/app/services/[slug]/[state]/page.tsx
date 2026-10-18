import type { Metadata } from "next";
import { listingMetadata, renderListing } from "../../listing";

type Props = { params: Promise<{ slug: string; state: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, state } = await params;
  return listingMetadata(slug, state);
}

export default async function ServiceInStatePage({ params }: Props) {
  const { slug, state } = await params;
  return renderListing(slug, state);
}
