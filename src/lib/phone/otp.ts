import { createHmac, randomInt, timingSafeEqual } from "crypto";

/** Phone verification codes. Pure functions (no DB, no SMS) so they're unit-tested. */

export const OTP_LENGTH = 6;
export const OTP_TTL_MIN = 10;
export const OTP_MAX_ATTEMPTS = 5;
export const RESEND_AFTER_SEC = 60;

/** 6 random digits from a cryptographically secure source (leading zeros allowed). */
export function generateCode(): string {
  return String(randomInt(0, 10 ** OTP_LENGTH)).padStart(OTP_LENGTH, "0");
}

/**
 * Only a keyed hash of the code is stored, tied to the phone number it was sent to, so a leaked
 * database row can't be used to verify, and a code sent to one number can't verify another.
 */
export function hashCode(code: string, phoneE164: string, secret: string): string {
  return createHmac("sha256", secret).update(`${phoneE164}:${code}`).digest("hex");
}

export function codeMatches(input: string, phoneE164: string, storedHash: string, secret: string): boolean {
  const clean = input.replace(/\D/g, "");
  if (clean.length !== OTP_LENGTH) return false;
  const a = Buffer.from(hashCode(clean, phoneE164, secret), "hex"), b = Buffer.from(storedHash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

export function smsText(code: string): string {
  return `Your FindWorkers code is ${code}. It expires in ${OTP_TTL_MIN} minutes. Never share this code with anyone, including FindWorkers staff.`;
}

/** "+2348031234567" → "+234 803 *** 4567", for "we sent a code to …" without exposing the full number. */
export function maskPhone(e164: string): string {
  const m = e164.match(/^\+234(\d{3})\d{3}(\d{4})$/);
  return m ? `+234 ${m[1]} *** ${m[2]}` : `${e164.slice(0, 4)}***${e164.slice(-3)}`;
}
