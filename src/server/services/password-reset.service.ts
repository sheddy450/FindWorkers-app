import { after } from "next/server";
import { hash } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getEmail } from "@/lib/providers/email";
import { resetEmail } from "@/lib/email/templates";
import { generateResetToken, hashResetToken, looksLikeResetToken, resetExpiry } from "@/lib/auth/reset-token";
import { LIMITS, minutesFrom } from "@/lib/security/rate-limit-rules";
import { absoluteUrl } from "@/lib/seo/site";
import { hitLimit } from "./rate-limit.service";

/**
 * Starts a reset. Always behaves the same whether or not the email has an account (same response,
 * and the email itself is sent after the response), so this can't be used to find out who's registered.
 */
export async function requestPasswordReset(rawEmail: string, ip: string): Promise<void> {
  const email = rawEmail.trim().toLowerCase();
  const [perIp, perEmail] = await Promise.all([
    hitLimit(LIMITS.resetRequestPerIp, ip),
    hitLimit(LIMITS.resetRequestPerEmail, email),
  ]);
  const blocked = !perIp.ok ? perIp : !perEmail.ok ? perEmail : null;
  if (blocked && !blocked.ok) throw new HttpError(429, `Too many reset requests. Try again in ${minutesFrom(blocked.retryAfterSec)} minutes.`);

  const user = await db.user.findUnique({ where: { email }, select: { id: true, name: true, status: true } });
  if (!user || user.status !== "ACTIVE") return;

  const token = generateResetToken();
  const now = new Date();
  await db.$transaction([
    // Only the newest link works: requesting another cancels earlier ones.
    db.passwordResetToken.updateMany({ where: { userId: user.id, usedAt: null }, data: { usedAt: now } }),
    db.passwordResetToken.create({ data: { userId: user.id, tokenHash: hashResetToken(token), expiresAt: resetExpiry(now) } }),
  ]);
  const message = resetEmail({ name: user.name, link: absoluteUrl(`/reset-password?token=${token}`) });
  after(async () => {
    try { await getEmail().send({ to: email, ...message }); }
    catch (e) { console.error("[reset] couldn't send reset email", e); }
  });
}

/** Whether a link is still usable (for showing the form vs. "this link has expired"). */
export async function resetLinkIsValid(token: unknown): Promise<boolean> {
  if (!looksLikeResetToken(token)) return false;
  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) }, select: { usedAt: true, expiresAt: true, user: { select: { status: true } } } });
  return !!row && !row.usedAt && row.expiresAt > new Date() && row.user.status === "ACTIVE";
}

/** Sets the new password, uses up the link, and signs the account out on every other device. */
export async function resetPassword(token: unknown, password: string, ip: string): Promise<void> {
  const limited = await hitLimit(LIMITS.resetSubmitPerIp, ip);
  if (!limited.ok) throw new HttpError(429, `Too many attempts. Try again in ${minutesFrom(limited.retryAfterSec)} minutes.`);
  const expired = new HttpError(410, "This reset link has expired or was already used. Request a new one.");
  if (!looksLikeResetToken(token)) throw expired;

  const row = await db.passwordResetToken.findUnique({ where: { tokenHash: hashResetToken(token) }, include: { user: { select: { id: true, status: true } } } });
  if (!row || row.usedAt || row.expiresAt <= new Date() || row.user.status !== "ACTIVE") throw expired;

  const passwordHash = await hash(password);
  const now = new Date();
  await db.$transaction(async (t) => {
    // Conditional update: if two tabs submit the same link at once, only one succeeds.
    const claimed = await t.passwordResetToken.updateMany({ where: { id: row.id, usedAt: null }, data: { usedAt: now } });
    if (claimed.count !== 1) throw expired;
    await t.user.update({ where: { id: row.userId }, data: { passwordHash, passwordChangedAt: now } });
    await t.passwordResetToken.updateMany({ where: { userId: row.userId, usedAt: null }, data: { usedAt: now } });
    await t.auditLog.create({ data: { actorId: row.userId, action: "auth.password_reset", entity: "User", entityId: row.userId } });
  });
}
