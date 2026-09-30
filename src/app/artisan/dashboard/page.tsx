import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { EmptyState } from "@/components/ui/States";
import { VerificationBadges } from "@/components/VerificationBadges";

const STATUS_TONE: Record<string, "brand" | "verified" | "danger"> = {
  REQUESTED: "brand", ACCEPTED: "brand", ON_THE_WAY: "brand", COMPLETED: "verified", REVIEWED: "verified",
  REJECTED: "danger", CANCELLED: "danger", EXPIRED: "danger",
};

export default async function Dashboard() {
  const user = await requirePageRole("ARTISAN");
  const a = await db.artisan.findUnique({ where: { userId: user.id }, include: { verifications: true, services: true } });
  if (!a) redirect("/artisan/profile");
  const submitted = a.verifications.filter((v) => v.status !== "NONE").length;

  const requests = await db.serviceRequest.findMany({
    where: { artisanId: user.id, status: { in: ["REQUESTED", "ACCEPTED", "ON_THE_WAY"] } },
    orderBy: { createdAt: "desc" }, take: 10,
    include: { category: true, customer: { select: { name: true } } },
  });

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo">{a.businessName}</h1>
      <Card className="space-y-3">
        <StarRating value={Number(a.avgRating)} count={a.reviewCount} />
        <VerificationBadges records={a.verifications} />
        <p className="text-sm text-muted">{a.completedJobs} completed jobs · {a.services.length} services</p>
      </Card>
      {submitted === 0 && <Card><p className="font-semibold">Get your first badge</p><p className="text-sm text-muted">Verified artisans get more trust from customers.</p>
        <Link href="/artisan/verification" className="mt-3 inline-flex min-h-11 items-center rounded-ctl bg-marigold px-4 font-semibold">Start verification</Link></Card>}
      <div className="flex gap-3 text-sm font-semibold text-indigo underline"><Link href="/artisan/profile">Edit profile</Link><Link href="/artisan/verification">Verification</Link></div>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Active requests</h2>
          <Link href="/requests" className="text-sm font-semibold text-indigo underline">See all</Link>
        </div>
        {requests.length === 0 ? (
          <EmptyState icon="requests" title="No active requests" body="When a customer requests you from search or your profile, it'll show up here." />
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <Link key={r.id} href={`/requests/${r.id}`}>
                <Card>
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{r.customer.name}</p>
                    <Badge tone={STATUS_TONE[r.status]}>{r.status.replace("_", " ")}</Badge>
                  </div>
                  <p className="text-sm text-muted">{r.category.name} · {r.createdAt.toLocaleDateString("en-NG")}</p>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
