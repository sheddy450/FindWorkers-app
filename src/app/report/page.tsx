import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { ReportForm } from "./ReportForm";

const TYPES = ["USER", "REVIEW", "ARTISAN"] as const;

export default async function Report({ searchParams }: { searchParams: { type?: string; id?: string } }) {
  await requirePageRole("CUSTOMER", "ARTISAN");
  const type = TYPES.find((t) => t === searchParams.type);
  const id = searchParams.id;
  if (!type || !id) notFound();

  let subjectLabel = "this account";
  if (type === "REVIEW") {
    const review = await db.review.findUnique({ where: { id }, include: { artisan: { select: { businessName: true } } } });
    subjectLabel = review?.artisan.businessName ?? "this review's author";
  } else {
    const target = await db.user.findUnique({ where: { id }, include: { artisan: { select: { businessName: true } } } });
    subjectLabel = target?.artisan?.businessName ?? target?.name ?? "this account";
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-indigo">Report {type === "REVIEW" ? "a review" : subjectLabel}</h1>
      <p className="mt-1 text-muted">Tell us what's wrong. Reports are reviewed by our team, not shown publicly.</p>
      <div className="mt-6"><ReportForm targetType={type} targetId={id} subjectLabel={subjectLabel} /></div>
    </main>
  );
}
