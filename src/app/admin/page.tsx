import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { AdminNav } from "@/components/AdminNav";

async function count<T>(p: Promise<T>) { return p; }

export default async function AdminHome() {
  await requirePageRole("ADMIN");
  const [users, artisans, pendingVerifications, openReports, activeRequests, hiddenReviews] = await Promise.all([
    count(db.user.count({ where: { status: "ACTIVE" } })),
    count(db.artisan.count()),
    count(db.verificationRecord.count({ where: { status: "PENDING" } })),
    count(db.report.count({ where: { status: "OPEN" } })),
    count(db.serviceRequest.count({ where: { status: { in: ["REQUESTED", "ACCEPTED", "ON_THE_WAY"] } } })),
    count(db.review.count({ where: { hidden: true } })),
  ]);

  const tiles: { label: string; value: number; href: string; urgent?: boolean }[] = [
    { label: "Active users", value: users, href: "/admin/users" },
    { label: "Artisans", value: artisans, href: "/admin/users?role=ARTISAN" },
    { label: "Pending verifications", value: pendingVerifications, href: "/admin/verifications", urgent: pendingVerifications > 0 },
    { label: "Open reports", value: openReports, href: "/admin/reports", urgent: openReports > 0 },
    { label: "Active requests", value: activeRequests, href: "/admin/requests" },
    { label: "Hidden reviews", value: hiddenReviews, href: "/admin/reviews" },
  ];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-indigo">Admin</h1>
      <div className="mt-4"><AdminNav /></div>
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <Link key={t.label} href={t.href}>
            <Card className={t.urgent ? "border-marigold" : ""}>
              <p className="text-3xl font-bold">{t.value}</p>
              <p className="text-sm text-muted">{t.label}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
