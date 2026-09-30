import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import { ReportActions } from "./ReportActions";

async function subjectFor(targetType: string, targetId: string) {
  if (targetType === "REVIEW") {
    const r = await db.review.findUnique({ where: { id: targetId }, include: { artisan: { select: { businessName: true } }, customer: { select: { name: true } } } });
    return r ? { label: `Review by ${r.customer.name} of ${r.artisan.businessName}`, href: `/artisan-profile/${r.artisanId}` } : { label: "Review (deleted)", href: null };
  }
  const u = await db.user.findUnique({ where: { id: targetId }, select: { name: true } });
  return u ? { label: u.name, href: `/admin/users/${targetId}` } : { label: "Account (deleted)", href: null };
}

export default async function AdminReports({ searchParams }: { searchParams: { filter?: string } }) {
  await requirePageRole("ADMIN");
  const status = searchParams.filter === "resolved" ? "RESOLVED" : searchParams.filter === "dismissed" ? "DISMISSED" : "OPEN";
  const reports = await db.report.findMany({ where: { status }, orderBy: { createdAt: status === "OPEN" ? "asc" : "desc" }, take: 50,
    include: { reporter: { select: { name: true } } } });
  const withSubjects = await Promise.all(reports.map(async (r) => ({ ...r, subject: await subjectFor(r.targetType, r.targetId) })));

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo">Reports</h1>
      <AdminNav />
      <div className="flex gap-2 text-sm">
        <a href="/admin/reports" className={`rounded-full border px-3 py-1 ${status === "OPEN" ? "border-indigo bg-indigo-soft text-indigo" : "border-line"}`}>Open</a>
        <a href="/admin/reports?filter=resolved" className={`rounded-full border px-3 py-1 ${status === "RESOLVED" ? "border-indigo bg-indigo-soft text-indigo" : "border-line"}`}>Resolved</a>
        <a href="/admin/reports?filter=dismissed" className={`rounded-full border px-3 py-1 ${status === "DISMISSED" ? "border-indigo bg-indigo-soft text-indigo" : "border-line"}`}>Dismissed</a>
      </div>
      {withSubjects.length === 0 && <EmptyState icon="alert" title="Nothing here" body="Reports from users will show up in this list." />}
      <div className="space-y-3">
        {withSubjects.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{r.targetType}: {r.subject.href ? <Link href={r.subject.href} className="text-indigo underline">{r.subject.label}</Link> : r.subject.label}</p>
                <p className="text-sm text-muted">Reported by {r.reporter.name} · {r.createdAt.toLocaleString("en-NG")}</p>
              </div>
              <Badge tone={r.status === "OPEN" ? "warning" : r.status === "RESOLVED" ? "verified" : "neutral"}>{r.status}</Badge>
            </div>
            <p className="mt-2 text-sm">{r.reason}</p>
            {r.resolutionNote && <p className="mt-2 text-sm text-muted">Note: {r.resolutionNote}</p>}
            {r.status === "OPEN" && <ReportActions id={r.id} />}
          </Card>
        ))}
      </div>
    </main>
  );
}
