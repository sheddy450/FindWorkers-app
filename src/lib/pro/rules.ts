import { createHmac, timingSafeEqual } from "crypto";

/** Rules for the artisan Pro plan. Pure functions (no DB, no network) so they're unit-tested. */

export const PRO_DAYS = 30;
export const DEFAULT_PRO_PRICE_KOBO = 300_000; // ₦3,000
export const MIN_PRO_PRICE_KOBO = 10_000; // ₦100: guards against a typo making Pro free
export const MAX_PRO_PRICE_KOBO = 10_000_000; // ₦100,000
const DAY_MS = 24 * 60 * 60 * 1000;

export function isPro(proUntil: Date | null | undefined, now = new Date()): boolean {
  return !!proUntil && proUntil.getTime() > now.getTime();
}

/** Paying early stacks: days left on the current period are kept, not lost. */
export function extendProUntil(current: Date | null | undefined, now = new Date(), days = PRO_DAYS): Date {
  const start = isPro(current, now) ? current!.getTime() : now.getTime();
  return new Date(start + days * DAY_MS);
}

/** Whole days left (rounded up), 0 when not Pro. */
export function proDaysLeft(proUntil: Date | null | undefined, now = new Date()): number {
  return isPro(proUntil, now) ? Math.ceil((proUntil!.getTime() - now.getTime()) / DAY_MS) : 0;
}

export const formatNaira = (kobo: number) => `₦${(kobo / 100).toLocaleString("en-NG")}`;

/** Parses the admin-entered price (in naira, e.g. "3000" or "3,000") into kobo, or null if invalid. */
export function parseNairaPrice(input: string): number | null {
  const cleaned = input.replace(/[₦,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const kobo = Math.round(Number(cleaned) * 100);
  return kobo >= MIN_PRO_PRICE_KOBO && kobo <= MAX_PRO_PRICE_KOBO ? kobo : null;
}

/** Reads the stored price setting, falling back to the default if it's missing or corrupt. */
export function priceFromSetting(value: string | null | undefined): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= MIN_PRO_PRICE_KOBO && n <= MAX_PRO_PRICE_KOBO ? n : DEFAULT_PRO_PRICE_KOBO;
}

/**
 * Paystack signs each webhook with HMAC-SHA512 of the raw body using your secret key.
 * Compared in constant time so the signature can't be guessed byte by byte.
 */
export function isValidPaystackSignature(rawBody: string, signature: string | null, secret: string): boolean {
  if (!signature || !secret) return false;
  const expected = createHmac("sha512", secret).update(rawBody).digest("hex");
  const a = Buffer.from(expected, "utf8"), b = Buffer.from(signature, "utf8");
  return a.length === b.length && timingSafeEqual(a, b);
}

/** What Paystack's verify endpoint reports for a transaction (only the fields we check). */
export type PaystackTx = { status: string; amount: number; currency: string; reference: string };

/** A payment counts only if Paystack says it succeeded, for exactly the amount we asked, in naira. */
export function paymentMatches(tx: PaystackTx, expected: { reference: string; amountKobo: number }): boolean {
  return tx.status === "success" && tx.reference === expected.reference && tx.amount === expected.amountKobo && tx.currency === "NGN";
}

/** Picks up to `n` items at random (Fisher–Yates), so every Pro artisan gets a fair share of the featured slot. */
export function pickRandom<T>(items: readonly T[], n: number, rand: () => number = Math.random): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.max(0, n));
}

/** Start of today in UTC, used as the key for daily stat counters. */
export function statDay(now = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
