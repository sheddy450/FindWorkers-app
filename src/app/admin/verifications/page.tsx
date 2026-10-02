import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import { INFO } from "@/lib/verification/rules";
import { DecisionForm } from "./DecisionForm";
import { isPro } from "@/lib/pro/rules";

export default async function AdminVerifications() {
  await requirePageRole("ADMIN");
  const queue = await db.verificationRecord.findMany({
    where: { status: "PENDING" }, orderBy: { updatedAt: "asc" },
    include: { artisan: { include: { user: { select: { name: true, phoneE164: true } } } } },
  });
  // Pro artisans get priority review: they go first, and within each group it's still oldest first.
  const now = new Date();
  const pending = [...queue].sort((x, y) => Number(isPro(y.artisan.proUntil, now)) - Number(isPro(x.artisan.proUntil, now)));
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-indigo">Verification queue</h1>
      <AdminNav />
      <p className="text-muted">Pro artisans first, then oldest first. Open the document, check it matches the profile, then decide.</p>
      {pending.length === 0 && <EmptyState icon="shield" title="Nothing to review" body="New submissions will show up here." />}
      {pending.map((r) => (
        <Card key={r.id}>
          <div className="flex items-start justify-between gap-2">
            <div><p className="flex items-center gap-2 font-semibold">{r.artisan.businessName}{isPro(r.artisan.proUntil, now) && <Badge tone="warning">Pro</Badge>}</p>
              <p className="text-sm text-muted">{r.artisan.user.name} · {r.artisan.user.phoneE164} · {r.artisan.lga}, {r.artisan.state}</p></div>
            <Badge tone="warning">{INFO[r.type]?.label}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted">Submitted {r.updatedAt.toLocaleString("en-NG")}</p>
          <a href={`/api/admin/verifications/${r.id}/document`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-sm font-semibold text-indigo underline">Open document (opens in a new tab)</a>
          <DecisionForm id={r.id} />
        </Card>
      ))}
    </main>
  );
}
