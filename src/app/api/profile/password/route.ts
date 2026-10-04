import { NextResponse } from "next/server";
import { hash, verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { passwordChangeSchema } from "@/lib/validation/profile";
import { LIMITS, minutesFrom } from "@/lib/security/rate-limit-rules";
import { hitLimit } from "@/server/services/rate-limit.service";

export const POST = handle(async (req) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to continue.");
  // Stops someone with a stolen session from guessing the current password.
  const limited = await hitLimit(LIMITS.passwordChangePerUser, user.id);
  if (!limited.ok) throw new HttpError(429, `Too many attempts. Try again in ${minutesFrom(limited.retryAfterSec)} minutes.`);
  const parsed = passwordChangeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ errors: parsed.error.flatten().fieldErrors }, { status: 422 });

  const full = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!full || !(await verify(full.passwordHash, parsed.data.currentPassword))) throw new HttpError(401, "Current password is incorrect.");

  await db.user.update({ where: { id: user.id }, data: { passwordHash: await hash(parsed.data.newPassword) } });
  return NextResponse.json({ ok: true });
});
