import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { RequestForm } from "./RequestForm";

export default async function NewRequest({ params }: { params: Promise<{ artisanId: string }> }) {
  await requirePageRole("CUSTOMER");
  const { artisanId } = await params;
  const [artisan, categories] = await Promise.all([
    db.artisan.findUnique({ where: { userId: artisanId }, select: { businessName: true, services: { select: { category: true } } } }),
    db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
  ]);
  if (!artisan) notFound();
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-brand">Request {artisan.businessName}</h1>
      <p className="mt-1 text-muted">They'll be notified and can accept or decline.</p>
      <RequestForm artisanId={artisanId} categories={categories.map((c) => ({ id: c.id, name: c.name }))} />
    </main>
  );
}
