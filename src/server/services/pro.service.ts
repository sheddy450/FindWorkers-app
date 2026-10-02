import { db } from "@/lib/db";
import { verifyTransaction } from "@/lib/providers/paystack";
import { DEFAULT_PRO_PRICE_KOBO, PRO_DAYS, paymentMatches, priceFromSetting, statDay } from "@/lib/pro/rules";

export const PRO_PRICE_KEY = "pro_price_kobo";
export const PRO_KIND = "PRO_MONTH";

export async function getProPriceKobo(): Promise<number> {
  const row = await db.appSetting.findUnique({ where: { key: PRO_PRICE_KEY } }).catch(() => null);
  return row ? priceFromSetting(row.value) : DEFAULT_PRO_PRICE_KOBO;
}

export type ConfirmResult =
  | { state: "paid"; proUntil: Date | null }
  | { state: "pending" }
  | { state: "failed" }
  | { state: "not_found" };

/**
 * Confirms a Pro payment with Paystack and, if it really succeeded, adds 30 days of Pro.
 * Called by both the callback page and the webhook; safe to call any number of times.
 */
export async function confirmProPayment(reference: string): Promise<ConfirmResult> {
  const payment = await db.payment.findUnique({ where: { reference } });
  if (!payment || payment.kind !== PRO_KIND) return { state: "not_found" };
  if (payment.status === "SUCCESS") return { state: "paid", proUntil: await proUntilOf(payment.userId) };
  if (payment.status === "FAILED") return { state: "failed" };

  const tx = await verifyTransaction(reference);
  if (!paymentMatches(tx, payment)) {
    // "abandoned"/"ongoing" may still complete (e.g. a bank transfer); only clear failures are final.
    if (tx.status === "failed" || tx.status === "reversed") {
      await db.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
      return { state: "failed" };
    }
    if (tx.status === "success") {
      // Paid, but not the amount/currency we asked for: never grant Pro automatically.
      console.error("[pro] payment mismatch", { reference, expected: payment.amountKobo, got: tx.amount, currency: tx.currency });
      await db.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "FAILED" } });
      return { state: "failed" };
    }
    return { state: "pending" };
  }

  await db.$transaction(async (t) => {
    // The conditional update is the lock: only one caller can flip PENDING → SUCCESS.
    const flipped = await t.payment.updateMany({ where: { id: payment.id, status: "PENDING" }, data: { status: "SUCCESS", paidAt: new Date() } });
    if (flipped.count !== 1) return;
    // Atomic in SQL so two payments confirmed at once both count. Same rule as extendProUntil():
    // start from the later of now and the current end date, then add PRO_DAYS.
    await t.$executeRaw`
      UPDATE "Artisan"
      SET "proUntil" = GREATEST(COALESCE("proUntil", now() AT TIME ZONE 'UTC'), now() AT TIME ZONE 'UTC') + make_interval(days => ${PRO_DAYS}::int),
          "updatedAt" = now() AT TIME ZONE 'UTC'
      WHERE "userId" = ${payment.userId}`;
    await t.notification.create({ data: { userId: payment.userId, type: "pro.activated", payload: { reference } } });
    await t.auditLog.create({ data: { actorId: payment.userId, action: "pro.payment_confirmed", entity: "Payment", entityId: payment.id,
      meta: { amountKobo: payment.amountKobo } } });
  });
  return { state: "paid", proUntil: await proUntilOf(payment.userId) };
}

async function proUntilOf(userId: string) {
  return (await db.artisan.findUnique({ where: { userId }, select: { proUntil: true } }))?.proUntil ?? null;
}

/** Bumps one of today's counters for an artisan. Never throws: stats must not break the page. */
export async function bumpStat(artisanId: string, field: "profileViews" | "contactReveals" | "messagesStarted") {
  const day = statDay();
  try {
    const one = (f: typeof field) => (f === field ? 1 : 0);
    await db.artisanDailyStat.upsert({
      where: { artisanId_day: { artisanId, day } },
      create: { artisanId, day, profileViews: one("profileViews"), contactReveals: one("contactReveals"), messagesStarted: one("messagesStarted") },
      update: {
        profileViews: { increment: one("profileViews") },
        contactReveals: { increment: one("contactReveals") },
        messagesStarted: { increment: one("messagesStarted") },
      },
    });
  } catch (e) {
    console.error("[pro] couldn't record stat", field, e);
  }
}
