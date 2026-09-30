import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import { ReviewRow } from "./ReviewRow";

export default async function AdminReviews({ searchParams }: { searchParams: { filter?: string } }) {
  await requirePageRole("ADMIN");
  const filter = searchParams.filter === "hidden" ? { hidden: true } : {};
  const reviews = await db.review.findMany({
    where: filter, orderBy: { createdAt: "desc" }, take: 50,
    include: { customer: { select: { name: true } }, artisan: { select: { businessName: true } } },
  });
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo">Reviews</h1>
      <AdminNav />
      <div className="flex gap-2 text-sm">
        <a href="/admin/reviews" className={`rounded-full border px-3 py-1 ${!searchParams.filter ? "border-indigo bg-indigo-soft text-indigo" : "border-line"}`}>All</a>
        <a href="/admin/reviews?filter=hidden" className={`rounded-full border px-3 py-1 ${searchParams.filter === "hidden" ? "border-indigo bg-indigo-soft text-indigo" : "border-line"}`}>Hidden</a>
      </div>
      {reviews.length === 0 && <EmptyState icon="star" title="No reviews here" body="Reviews appear once customers rate a completed job." />}
      <div className="space-y-3">
        {reviews.map((r) => <ReviewRow key={r.id} review={{ ...r, createdAt: r.createdAt.toISOString() }} />)}
      </div>
    </main>
  );
}
