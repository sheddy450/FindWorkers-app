import { NextResponse } from "next/server";
import { handle } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { db } from "@/lib/db";
import { PRO_POPUP } from "@/lib/pro/popup-config";

/** The artisan closed the Pro ad pop-up (or tapped Go Pro): keep it away for a week, on every device. */
export const POST = handle(async () => {
  const user = await requireRole("ARTISAN");
  await db.artisan.updateMany({ where: { userId: user.id }, data: { proPopupClosedAt: new Date(), proPopupCampaign: PRO_POPUP.campaign } });
  return NextResponse.json({ ok: true });
});
