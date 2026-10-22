import { NextResponse } from "next/server";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { confirmed } from "@/lib/account/deletion";
import { LIMITS, minutesFrom } from "@/lib/security/rate-limit-rules";
import { hitLimit } from "@/server/services/rate-limit.service";
import { deleteOwnAccount } from "@/server/services/account-deletion.service";

/** A customer or artisan deletes their own account. Needs their password and an explicit confirm. */
export const POST = handle(async (req) => {
  const user = await requireRole("CUSTOMER", "ARTISAN");
  // Same limit as password changes: stops someone on an unlocked phone guessing the password.
  const limited = await hitLimit(LIMITS.passwordChangePerUser, `delete:${user.id}`);
  if (!limited.ok) throw new HttpError(429, `Too many tries. Wait ${minutesFrom(limited.retryAfterSec)} minutes and try again.`);
  const body = (await req.json().catch(() => ({}))) as { password?: unknown; confirm?: unknown };
  if (typeof body.password !== "string" || !body.password) throw new HttpError(422, "Enter your password.");
  if (!confirmed(body.confirm)) throw new HttpError(422, "Tick the box to confirm you understand.");
  await deleteOwnAccount(user.id, body.password);
  return NextResponse.json({ ok: true });
});
