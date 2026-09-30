import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { HttpError } from "@/lib/http";
import { ThreadClient } from "./ThreadClient";

export default async function Thread({ params }: { params: Promise<{ requestId: string }> }) {
  const user = await requirePageRole("CUSTOMER", "ARTISAN");
  const { requestId } = await params;
  const r = await db.serviceRequest.findUnique({ where: { id: requestId },
    include: { category: true, artisan: { select: { businessName: true } }, customer: { select: { name: true } } } });
  if (!r) notFound();
  const side = user.id === r.customerId ? "CUSTOMER" : user.id === r.artisanId ? "ARTISAN" : null;
  if (!side) throw new HttpError(403, "This isn't your conversation.");
  const otherId = side === "CUSTOMER" ? r.artisanId : r.customerId;
  const otherName = side === "CUSTOMER" ? r.artisan.businessName : r.customer.name;
  const blocked = !!(await db.block.findUnique({ where: { blockerId_blockedId: { blockerId: user.id, blockedId: otherId } } }));

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between gap-2">
        <div><h1 className="text-xl font-bold text-indigo">{otherName}</h1><p className="text-sm text-muted">{r.category.name}</p></div>
        <div className="flex flex-col items-end gap-1 text-sm">
          <Link href={`/requests/${r.id}`} className="font-semibold text-indigo underline">View request</Link>
          <Link href={`/report?type=USER&id=${otherId}`} className="text-muted underline">Report</Link>
        </div>
      </div>
      <ThreadClient requestId={r.id} selfId={user.id} otherId={otherId} otherName={otherName} initiallyBlocked={blocked} />
    </main>
  );
}
