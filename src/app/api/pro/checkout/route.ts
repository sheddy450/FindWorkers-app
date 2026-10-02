import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { initializeTransaction, paystackConfigured } from "@/lib/providers/paystack";
import { getProPriceKobo, PRO_KIND } from "@/server/services/pro.service";

/** Starts a Pro payment: records it as PENDING, then hands back Paystack's checkout URL. */
export const POST = handle(async (req) => {
  const user = await requireRole("ARTISAN");
  if (!paystackConfigured()) throw new HttpError(503, "Payments aren't set up yet. Please try again later.");

  const [artisan, account] = await Promise.all([
    db.artisan.findUnique({ where: { userId: user.id }, select: { userId: true } }),
    db.user.findUnique({ where: { id: user.id }, select: { email: true } }),
  ]);
  if (!artisan) throw new HttpError(409, "Set up your artisan profile before upgrading.");
  if (!account?.email) throw new HttpError(409, "Add an email address in your Profile first. Paystack sends your receipt there.");

  const amountKobo = await getProPriceKobo();
  const reference = `pro_${randomUUID()}`;
  const payment = await db.payment.create({ data: { reference, userId: user.id, kind: PRO_KIND, amountKobo } });

  try {
    const url = await initializeTransaction({
      email: account.email, amountKobo, reference,
      callbackUrl: `${new URL(req.url).origin}/artisan/pro/callback`,
      metadata: { userId: user.id, kind: PRO_KIND },
    });
    return NextResponse.json({ url });
  } catch (e) {
    console.error("[pro] checkout failed", e);
    await db.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    throw new HttpError(502, "We couldn't reach Paystack. Please try again in a moment.");
  }
});
