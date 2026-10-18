import { Suspense } from "react";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { og } from "@/lib/seo/site";
import { SearchClient } from "./SearchClient";

export const metadata: Metadata = {
  title: "Find an artisan near you",
  description: "Search verified artisans by service and distance. Filter by rating, availability and verification, on a list or a map of your area.",
  alternates: { canonical: "/search" },
  openGraph: og({ title: "Find an artisan near you", description: "Search verified artisans by service and distance. Filter by rating, availability and verification, on a list or a map of your area.", url: "/search" }),
};

export default async function SearchPage() {
  const categories = await db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } });
  return <Suspense><SearchClient categories={categories} /></Suspense>;
}
