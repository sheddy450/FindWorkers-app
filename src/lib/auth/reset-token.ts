import { createHash, randomBytes } from "crypto";

/** Password reset links. Pure functions so they're unit-tested. */

export const RESET_TTL_MIN = 30;

/** 256 random bits, URL-safe. This is what goes in the email link; it's never stored. */
export function generateResetToken(): string {
  return randomBytes(32).toString("base64url");
}

/** Only this hash is stored, so a leaked database can't be used to reset anyone's password. */
export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Rejects anything that can't be one of our tokens before touching the database. */
export function looksLikeResetToken(token: unknown): token is string {
  return typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
}

export const resetExpiry = (now = new Date()) => new Date(now.getTime() + RESET_TTL_MIN * 60_000);

/**
 * A session is stale if it was issued before the password last changed (reset or change), which is
 * how a reset signs the account out everywhere else. `issuedAtSec` is the JWT "iat" (seconds).
 * A small grace window covers the session created right after the change on the same device.
 */
export function sessionIsStale(issuedAtSec: number | undefined, passwordChangedAt: Date | null | undefined): boolean {
  if (!passwordChangedAt || issuedAtSec == null) return false;
  return issuedAtSec * 1000 < passwordChangedAt.getTime() - 5_000;
}
