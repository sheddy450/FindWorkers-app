import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { formatNaira, MAX_PRO_PRICE_KOBO, MIN_PRO_PRICE_KOBO, parseNairaPrice } from "@/lib/pro/rules";
import { PRO_PRICE_KEY } from "@/server/services/pro.service";

/** Admin: change the Pro price. Applies to new checkouts only; payments already started keep their amount. */
export const PATCH = handle(async (req) => {
  const admin = await requireRole("ADMIN");
  const body = await req.json().catch(() => null) as { price?: unknown } | null;
  const kobo = parseNairaPrice(String(body?.price ?? ""));
  if (kobo == null) throw new HttpError(422, `Enter a price between ${formatNaira(MIN_PRO_PRICE_KOBO)} and ${formatNaira(MAX_PRO_PRICE_KOBO)}.`);
  await db.$transaction([
    db.appSetting.upsert({ where: { key: PRO_PRICE_KEY }, create: { key: PRO_PRICE_KEY, value: String(kobo) }, update: { value: String(kobo) } }),
    db.auditLog.create({ data: { actorId: admin.id, action: "pro.price_changed", entity: "AppSetting", entityId: PRO_PRICE_KEY, meta: { kobo } } }),
  ]);
  return NextResponse.json({ priceKobo: kobo });
});
