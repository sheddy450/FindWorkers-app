import { Suspense } from "react";
import { db } from "@/lib/db";
import { SearchClient } from "./SearchClient";

export default async function SearchPage() {
  const categories = await db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { slug: true, name: true } });
  return <Suspense><SearchClient categories={categories} /></Suspense>;
}
