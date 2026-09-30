import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import { LABEL } from "@/lib/requests/rules";
import type { RequestStatus } from "@prisma/client";

const TONE = { REQUESTED: "warning", ACCEPTED: "brand", ON_THE_WAY: "brand", COMPLETED: "verified", REVIEWED: "verified",
  REJECTED: "danger", CANCELLED: "danger", EXPIRED: "danger" } as const;
const FILTERS: { key: string; label: string; statuses?: RequestStatus[] }[] = [
  { key: "", label: "All" },
  { key: "active", label: "Active", statuses: ["REQUESTED", "ACCEPTED", "ON_THE_WAY"] },
  { key: "done", label: "Completed", statuses: ["COMPLETED", "REVIEWED"] },
  { key: "closed", label: "Closed", statuses: ["REJECTED", "CANCELLED", "EXPIRED"] },
];

export default async function AdminRequests({ searchParams }: { searchParams: { filter?: string } }) {
  await requirePageRole("ADMIN");
  const active = FILTERS.find((f) => f.key === searchParams.filter) ?? FILTERS[0];
  const rows = await db.serviceRequest.findMany({
    where: active.statuses ? { status: { in: active.statuses } } : {},
    orderBy: { createdAt: "desc" }, take: 50,
    include: { category: true, artisan: { select: { businessName: true } }, customer: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo">Service requests</h1>
      <AdminNav />
      <div className="flex gap-2 text-sm">
        {FILTERS.map((f) => (
          <a key={f.key} href={f.key ? `/admin/requests?filter=${f.key}` : "/admin/requests"}
            className={`rounded-full border px-3 py-1 ${active.key === f.key ? "border-indigo bg-indigo-soft text-indigo" : "border-line"}`}>{f.label}</a>
        ))}
      </div>
      {rows.length === 0 && <EmptyState icon="requests" title="No requests" body="Nothing matches this filter yet." />}
      <div className="space-y-2">
        {rows.map((r) => (
          <Link key={r.id} href={`/requests/${r.id}`}>
            <Card className="flex items-center justify-between gap-2">
              <div><p className="font-semibold">{r.category.name}</p>
                <p className="text-sm text-muted">{r.customer.name} → {r.artisan.businessName} · {r.createdAt.toLocaleDateString("en-NG")}</p></div>
              <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
