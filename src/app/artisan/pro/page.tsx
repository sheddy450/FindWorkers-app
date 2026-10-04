import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Icon, type IconName } from "@/components/ui/Icon";
import { paystackConfigured } from "@/lib/providers/paystack";
import { formatNaira, isPro, PRO_DAYS, proDaysLeft } from "@/lib/pro/rules";
import { getProPriceKobo } from "@/server/services/pro.service";
import { UpgradeButton } from "./UpgradeButton";

const BENEFITS: { icon: IconName; title: string; body: string }[] = [
  { icon: "star", title: "Featured placement", body: "Appear in the Featured slot at the top of search and on the home page, clearly labelled for customers." },
  { icon: "eye", title: "See who's finding you", body: "Daily profile views, phone/WhatsApp reveals and new messages on your dashboard." },
  { icon: "shield", title: "Faster verification", body: "Your verification documents go to the front of our review queue." },
];

export default async function ProPage() {
  const user = await requirePageRole("ARTISAN");
  const [artisan, account, priceKobo] = await Promise.all([
    db.artisan.findUnique({ where: { userId: user.id }, select: { proUntil: true } }),
    db.user.findUnique({ where: { id: user.id }, select: { email: true } }),
    getProPriceKobo(),
  ]);
  if (!artisan) redirect("/artisan/profile");
  const active = isPro(artisan.proUntil);
  const until = artisan.proUntil?.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });
  const daysLeft = proDaysLeft(artisan.proUntil);

  return (
    <main className="mx-auto max-w-md space-y-5 p-6">
      <div>
        <div className="flex items-center gap-2"><h1 className="text-3xl font-bold text-brand">FindWorkers Pro</h1>{active && <Badge tone="warning">Active</Badge>}</div>
        <p className="mt-1 text-muted">Get found by more customers in your area.</p>
      </div>

      {active
        ? <Alert variant="success" title={`Pro until ${until}`}>{daysLeft} day{daysLeft === 1 ? "" : "s"} left. Paying again now adds {PRO_DAYS} days to that date, so you don't lose any.</Alert>
        : artisan.proUntil && <Alert variant="warning" title="Your Pro plan has ended">Renew to get back into the Featured slot.</Alert>}

      <Card className="space-y-4">
        <p><span className="font-display text-4xl font-bold text-ink">{formatNaira(priceKobo)}</span> <span className="text-muted">for {PRO_DAYS} days</span></p>
        <ul className="space-y-3">
          {BENEFITS.map((b) => (
            <li key={b.title} className="flex gap-3">
              <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-highlight-soft text-ink"><Icon name={b.icon} size={18} /></span>
              <span><span className="block font-semibold">{b.title}</span><span className="text-sm text-muted">{b.body}</span></span>
            </li>
          ))}
        </ul>
        {paystackConfigured()
          ? <UpgradeButton label={active ? `Add ${PRO_DAYS} days · ${formatNaira(priceKobo)}` : `Upgrade for ${formatNaira(priceKobo)}`} needsEmail={!account?.email} />
          : <Alert variant="info" title="Payments aren't set up yet">Pro will be available soon.</Alert>}
      </Card>

      <p className="text-sm text-muted">No automatic renewals: you pay for {PRO_DAYS} days at a time; your dashboard reminds you a few days before it ends. Featured placement never changes your star rating or your position in normal search results.</p>
    </main>
  );
}
