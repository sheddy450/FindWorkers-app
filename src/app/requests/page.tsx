import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { LABEL } from "@/lib/requests/rules";
import { RequestsTabs } from "@/components/RequestsTabs";

const TONE = { REQUESTED: "warning", ACCEPTED: "brand", ON_THE_WAY: "brand", COMPLETED: "verified", REVIEWED: "verified",
  REJECTED: "danger", CANCELLED: "danger", EXPIRED: "danger" } as const;

export default async function Requests() {
  const user = await requirePageRole("CUSTOMER", "ARTISAN");
  const rows = await db.serviceRequest.findMany({
    where: user.role === "CUSTOMER" ? { customerId: user.id } : { artisanId: user.id },
    orderBy: { createdAt: "desc" }, include: { category: true, artisan: { select: { businessName: true } }, customer: { select: { name: true } } },
  });
  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-brand">Requests</h1>
      <RequestsTabs current="requests" role={user.role === "ARTISAN" ? "ARTISAN" : "CUSTOMER"} />
      {user.role === "CUSTOMER" && (
        <Link href="/jobs/new" className="mt-4 flex items-center justify-between gap-3 rounded-card bg-gradient-to-br from-brand to-brand-700 p-4 text-white shadow-soft hover:brightness-105">
          <span><span className="block font-semibold">Not sure who to hire?</span><span className="text-sm text-white/85">Post a job and let artisans send you quotes. It&apos;s free.</span></span>
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white text-xl font-bold text-brand">+</span>
        </Link>
      )}
      {rows.length === 0 && <div className="mt-6"><EmptyState icon="requests" title="No requests yet" body={user.role === "CUSTOMER" ? "When you request a service, you can track it here." : "New requests from customers will show up here."} action={user.role === "CUSTOMER" ? { label: "Find an artisan", href: "/search" } : { label: "See the job board", href: "/jobs" }} /></div>}
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <Link key={r.id} href={`/requests/${r.id}`}>
            <Card className="flex items-center justify-between gap-2">
              <div><p className="font-semibold">{r.category.name}</p>
                <p className="text-sm text-muted">{user.role === "CUSTOMER" ? r.artisan.businessName : r.customer.name}</p></div>
              <Badge tone={TONE[r.status]}>{LABEL[r.status]}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
