import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getSms } from "@/lib/providers/sms";
import { NotConfiguredError } from "@/lib/providers/storage";
import { LIMITS, minutesFrom } from "@/lib/security/rate-limit-rules";
import { OTP_MAX_ATTEMPTS, OTP_TTL_MIN, RESEND_AFTER_SEC, codeMatches, generateCode, hashCode, maskPhone, smsText } from "@/lib/phone/otp";
import { hitLimit } from "./rate-limit.service";

function otpSecret(): string {
  const s = process.env.NEXTAUTH_SECRET;
  if (!s) throw new HttpError(503, "Phone verification isn't available right now.");
  return s;
}

/** Texts a fresh 6-digit code to the user's phone. Older unused codes stop working. */
export async function sendPhoneCode(userId: string): Promise<{ sentTo: string; resendAfterSec: number }> {
  const user = await db.user.findUnique({ where: { id: userId }, select: { phoneE164: true, phoneVerifiedAt: true } });
  if (!user?.phoneE164) throw new HttpError(409, "Add a phone number to your account first.");
  if (user.phoneVerifiedAt) throw new HttpError(409, "Your phone number is already verified.");

  const [perUser, perPhone] = await Promise.all([
    hitLimit(LIMITS.phoneCodeSendPerUser, userId),
    hitLimit(LIMITS.phoneCodeSendPerPhone, user.phoneE164),
  ]);
  const blocked = !perUser.ok ? perUser : !perPhone.ok ? perPhone : null;
  if (blocked && !blocked.ok) throw new HttpError(429, `Too many codes requested. Try again in ${minutesFrom(blocked.retryAfterSec)} minutes.`);

  const code = generateCode();
  const now = new Date();
  const otp = await db.$transaction(async (t) => {
    await t.phoneOtp.updateMany({ where: { userId, consumedAt: null }, data: { consumedAt: now } });
    return t.phoneOtp.create({ data: {
      userId, phoneE164: user.phoneE164!, codeHash: hashCode(code, user.phoneE164!, otpSecret()),
      expiresAt: new Date(now.getTime() + OTP_TTL_MIN * 60_000),
    } });
  });

  try {
    await getSms().send(user.phoneE164, smsText(code));
  } catch (e) {
    await db.phoneOtp.delete({ where: { id: otp.id } }).catch(() => {});
    if (e instanceof NotConfiguredError) throw new HttpError(503, "Phone verification isn't available yet.");
    console.error("[phone] SMS send failed", e);
    throw new HttpError(502, "We couldn't send the text message. Check your number and try again in a minute.");
  }
  return { sentTo: maskPhone(user.phoneE164), resendAfterSec: RESEND_AFTER_SEC };
}

/** Checks a code. On success the phone is verified, and artisans get the "Phone Verified" badge. */
export async function confirmPhoneCode(userId: string, input: string): Promise<{ verified: true }> {
  const limited = await hitLimit(LIMITS.phoneCodeCheckPerUser, userId);
  if (!limited.ok) throw new HttpError(429, `Too many tries. Try again in ${minutesFrom(limited.retryAfterSec)} minutes.`);

  const user = await db.user.findUnique({ where: { id: userId }, select: { phoneE164: true, phoneVerifiedAt: true, role: true } });
  if (!user?.phoneE164) throw new HttpError(409, "Add a phone number to your account first.");
  if (user.phoneVerifiedAt) return { verified: true };

  const otp = await db.phoneOtp.findFirst({
    where: { userId, phoneE164: user.phoneE164, consumedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw new HttpError(410, "This code has expired. Send a new one.");
  if (otp.attempts >= OTP_MAX_ATTEMPTS) throw new HttpError(429, "Too many wrong codes. Send a new one.");

  // Count the attempt before comparing, so parallel guesses can't exceed the limit.
  const counted = await db.phoneOtp.updateMany({
    where: { id: otp.id, consumedAt: null, attempts: { lt: OTP_MAX_ATTEMPTS } },
    data: { attempts: { increment: 1 } },
  });
  if (counted.count !== 1) throw new HttpError(429, "Too many wrong codes. Send a new one.");

  if (!codeMatches(input, user.phoneE164, otp.codeHash, otpSecret())) {
    const left = OTP_MAX_ATTEMPTS - (otp.attempts + 1);
    throw new HttpError(422, left > 0 ? `That code isn't right. ${left} ${left === 1 ? "try" : "tries"} left.` : "That code isn't right. Send a new one.");
  }

  const now = new Date();
  await db.$transaction(async (t) => {
    await t.phoneOtp.update({ where: { id: otp.id }, data: { consumedAt: now } });
    await t.user.update({ where: { id: userId }, data: { phoneVerifiedAt: now } });
    if (user.role === "ARTISAN" && await t.artisan.findUnique({ where: { userId }, select: { userId: true } })) {
      await t.verificationRecord.upsert({
        where: { artisanId_type: { artisanId: userId, type: "PHONE" } },
        create: { artisanId: userId, type: "PHONE", status: "APPROVED", reviewedAt: now },
        update: { status: "APPROVED", reviewedAt: now, rejectReason: null, expiresAt: null },
      });
      await t.notification.create({ data: { userId, type: "verification.decision", payload: { type: "PHONE", decision: "APPROVED", reason: null } } });
    }
    await t.auditLog.create({ data: { actorId: userId, action: "phone.verified", entity: "User", entityId: userId } });
  });
  return { verified: true };
}
