import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { AdminNav } from "@/components/AdminNav";
import { CategoryManager } from "./CategoryManager";

export default async function AdminCategories() {
  await requirePageRole("ADMIN");
  const categories = await db.serviceCategory.findMany({ orderBy: { name: "asc" } });
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-brand">Service categories</h1>
      <AdminNav />
      <p className="text-muted">Hiding a category removes it from search and sign-up, but doesn't delete existing artisan services under it.</p>
      <CategoryManager initial={categories} />
    </main>
  );
}
