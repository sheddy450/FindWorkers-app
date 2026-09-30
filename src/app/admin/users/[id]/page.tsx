import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AdminNav } from "@/components/AdminNav";
import { StatusControls } from "./StatusControls";

const STATUS_TONE = { ACTIVE: "verified", SUSPENDED: "warning", DEACTIVATED: "danger" } as const;

export default async function AdminUserDetail({ params }: { params: Promise<{ id: string }> }) {
  await requirePageRole("ADMIN");
  const { id } = await params;
  const user = await db.user.findUnique({ where: { id }, include: {
    artisan: { include: { verifications: true, reviews: { take: 5, orderBy: { createdAt: "desc" } } } },
    requests: { take: 5, orderBy: { createdAt: "desc" }, include: { category: true } },
    reportsMade: { take: 5, orderBy: { createdAt: "desc" } },
  } });
  if (!user) notFound();
  const reportsAgainst = await db.report.findMany({
    where: { OR: [{ targetType: "USER", targetId: user.id }, ...(user.artisan ? [{ targetType: "ARTISAN" as const, targetId: user.id }] : [])] },
    orderBy: { createdAt: "desc" }, take: 10,
  });

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo">User</h1>
      <AdminNav />
      <Card>
        <div className="flex items-start justify-between gap-2">
          <div><p className="text-xl font-semibold">{user.name}</p>
            <p className="text-sm text-muted">{user.email ?? "No email"} · {user.phoneE164 ?? "No phone"} · {user.role}</p>
            <p className="text-sm text-muted">Joined {user.createdAt.toLocaleDateString("en-NG")}</p></div>
          <Badge tone={STATUS_TONE[user.status]}>{user.status}</Badge>
        </div>
        {user.role !== "ADMIN" && <div className="mt-4"><StatusControls userId={user.id} status={user.status} /></div>}
      </Card>

      {user.artisan && (
        <Card>
          <p className="font-semibold">{user.artisan.businessName}</p>
          <p className="text-sm text-muted">Rating {Number(user.artisan.avgRating).toFixed(1)} ({user.artisan.reviewCount} reviews) · {user.artisan.completedJobs} completed jobs</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.artisan.verifications.map((v) => <Badge key={v.id} tone={v.status === "APPROVED" ? "verified" : v.status === "PENDING" ? "warning" : "neutral"}>{v.type}: {v.status}</Badge>)}
          </div>
          <Link href={`/artisan-profile/${user.id}`} className="mt-2 inline-block text-sm font-semibold text-indigo underline">View public profile</Link>
        </Card>
      )}

      <Card>
        <p className="font-semibold">Recent service requests</p>
        {user.requests.length === 0 && <p className="mt-1 text-sm text-muted">None yet.</p>}
        {user.requests.map((r) => <Link key={r.id} href={`/requests/${r.id}`} className="block py-1 text-sm text-indigo underline">{r.category.name} — {r.status}</Link>)}
      </Card>

      <Card>
        <p className="font-semibold">Reports against this account</p>
        {reportsAgainst.length === 0 && <p className="mt-1 text-sm text-muted">None.</p>}
        {reportsAgainst.map((r) => (
          <div key={r.id} className="border-t border-line py-2 first:border-0 first:pt-0">
            <p className="text-sm">{r.reason}</p>
            <p className="text-xs text-muted">{r.status} · {r.createdAt.toLocaleDateString("en-NG")}</p>
          </div>
        ))}
      </Card>

      <Card>
        <p className="font-semibold">Reports filed by this user</p>
        {user.reportsMade.length === 0 && <p className="mt-1 text-sm text-muted">None.</p>}
        {user.reportsMade.map((r) => <p key={r.id} className="py-1 text-sm text-muted">{r.targetType} · {r.status} · {r.createdAt.toLocaleDateString("en-NG")}</p>)}
      </Card>
    </main>
  );
}
