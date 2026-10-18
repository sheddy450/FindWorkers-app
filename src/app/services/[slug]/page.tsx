import type { Metadata } from "next";
import { listingMetadata, renderListing } from "../listing";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  return listingMetadata(slug);
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  return renderListing(slug);
}
