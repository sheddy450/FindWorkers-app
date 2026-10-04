import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import { paystackConfigured } from "@/lib/providers/paystack";
import { formatNaira } from "@/lib/pro/rules";
import { getProPriceKobo } from "@/server/services/pro.service";
import { PriceForm } from "./PriceForm";

const TONE = { SUCCESS: "verified", PENDING: "neutral", FAILED: "danger" } as const;

export default async function AdminPro() {
  await requirePageRole("ADMIN");
  const now = new Date(), since = new Date(now.getTime() - 30 * 86_400_000);
  const [priceKobo, activePro, revenue, payments] = await Promise.all([
    getProPriceKobo(),
    db.artisan.count({ where: { proUntil: { gt: now } } }),
    db.payment.aggregate({ where: { status: "SUCCESS", paidAt: { gte: since } }, _sum: { amountKobo: true }, _count: true }),
    db.payment.findMany({ orderBy: { createdAt: "desc" }, take: 20, include: { user: { select: { name: true } } } }),
  ]);

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-brand">Pro plan</h1>
      <AdminNav />
      {!paystackConfigured() && <Alert variant="warning" title="Paystack isn't connected">Set PAYSTACK_SECRET_KEY in Vercel to let artisans pay.</Alert>}
      <div className="grid grid-cols-2 gap-3">
        <Card><p className="text-3xl font-bold">{activePro}</p><p className="text-sm text-muted">Active Pro artisans</p></Card>
        <Card><p className="text-3xl font-bold">{formatNaira(revenue._sum.amountKobo ?? 0)}</p><p className="text-sm text-muted">Revenue, last 30 days ({revenue._count} payments)</p></Card>
      </div>
      <Card><PriceForm priceNaira={priceKobo / 100} /></Card>
      <section>
        <h2 className="mb-3 text-xl font-bold text-ink">Latest payments</h2>
        {payments.length === 0 ? <EmptyState icon="star" title="No payments yet" body="Payments show up here as soon as an artisan starts checkout." /> : (
          <div className="divide-y divide-line rounded-card border border-line bg-white">
            {payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <div><p className="font-semibold">{p.user.name}</p><p className="text-muted">{p.createdAt.toLocaleString("en-NG")} · {p.reference}</p></div>
                <div className="text-right"><p className="font-semibold">{formatNaira(p.amountKobo)}</p><Badge tone={TONE[p.status]}>{p.status.toLowerCase()}</Badge></div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
