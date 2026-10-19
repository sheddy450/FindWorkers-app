import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { AdminNav } from "@/components/AdminNav";
import { pricesToText, type PriceRow } from "@/lib/guides/rules";
import { GuideEditor } from "./GuideEditor";

export const metadata = { title: "Edit guide" };

export default async function EditGuide({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("ADMIN");
  const { id } = await params;
  const [g, categories] = await Promise.all([
    id === "new" ? null : db.guide.findUnique({ where: { id } }),
    db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (id !== "new" && !g) notFound();
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6 pb-28">
      <h1 className="text-3xl font-bold text-brand">{g ? "Edit guide" : "New guide"}</h1>
      <AdminNav />
      <GuideEditor id={g?.id ?? null} categories={categories} initial={{
        title: g?.title ?? "", slug: g?.slug ?? "", summary: g?.summary ?? "", categoryId: g?.categoryId ?? "", audience: g?.audience ?? "CUSTOMER",
        body: g?.body ?? "", prices: pricesToText((Array.isArray(g?.prices) ? g?.prices : []) as unknown as PriceRow[]), pricesNote: g?.pricesNote ?? "",
        questions: (g?.questions ?? []).join("\n"), redFlags: (g?.redFlags ?? []).join("\n"), checklist: (g?.checklist ?? []).join("\n"),
        published: g?.status === "PUBLISHED",
      }} />
    </main>
  );
}
