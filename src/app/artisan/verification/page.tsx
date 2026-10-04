import { db } from "@/lib/db";
import { redirect } from "next/navigation";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { INFO, SUBMITTABLE, canSubmit } from "@/lib/verification/rules";
import { UploadForm } from "./UploadForm";
import Link from "next/link";
import { smsConfigured } from "@/lib/providers/sms";

const TONE = { NONE: "neutral", PENDING: "warning", APPROVED: "verified", REJECTED: "danger", EXPIRED: "danger" } as const;
const TEXT = { NONE: "Not submitted", PENDING: "Under review", APPROVED: "Approved", REJECTED: "Not approved", EXPIRED: "Expired" } as const;

export default async function Verification() {
  const user = await requirePageRole("ARTISAN");
  if (!(await db.artisan.findUnique({ where: { userId: user.id }, select: { userId: true } }))) redirect("/artisan/profile");
  const recs = await db.verificationRecord.findMany({ where: { artisanId: user.id } });
  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-3xl font-bold text-brand">Get verified</h1>
      <p className="text-muted">Our team checks each document by hand, usually within a few working days. Only approved checks show as badges on your profile.</p>
      {SUBMITTABLE.map((t) => {
        const r = recs.find((x) => x.type === t); const status = r?.status ?? "NONE";
        return (
          <Card key={t}>
            <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">{INFO[t].label}</h2><Badge tone={TONE[status]}>{TEXT[status]}</Badge></div>
            <p className="mt-1 text-sm text-muted">{INFO[t].help}</p>
            {status === "REJECTED" && r?.rejectReason && <div className="mt-3"><Alert variant="error" title="What to fix">{r.rejectReason}</Alert></div>}
            {canSubmit(status) && <UploadForm type={t} label={INFO[t].label} />}
          </Card>);
      })}
      {(() => {
        const status = recs.find((x) => x.type === "PHONE")?.status ?? "NONE";
        return (
          <Card>
            <div className="flex items-center justify-between gap-2"><h2 className="text-lg font-semibold">Phone</h2><Badge tone={TONE[status]}>{TEXT[status]}</Badge></div>
            <p className="mt-1 text-sm text-muted">{status === "APPROVED" ? "Your phone number is verified." : smsConfigured()
              ? "Confirm your number with a 6-digit code by SMS. It takes under a minute, no documents needed."
              : "Phone verification by SMS is coming soon."}</p>
            {status !== "APPROVED" && smsConfigured() && <Link href="/profile" className="mt-3 inline-flex min-h-11 items-center rounded-ctl bg-brand px-4 font-semibold text-white">Verify by SMS</Link>}
          </Card>);
      })()}
      <Card><h2 className="text-lg font-semibold">Background checks</h2>
        <p className="mt-1 text-sm text-muted">Background checks aren't available yet. We'll tell you when they are.</p></Card>
    </main>
  );
}
