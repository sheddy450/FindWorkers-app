/** Browser-safe part of the "Go Pro" pop-up rules (no server imports). See nudge.ts. */
// v2: the price dropped, so artisans who closed the old pop-up see the new one once.
export const NUDGE_STORAGE_KEY = "fw:pro-nudge:v2";
export const NUDGE_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
export const RENEW_WITHIN_DAYS = 3;
export const NUDGE_DELAY_MS = 2000;

export type Nudge = { kind: "upgrade" } | { kind: "new_price" } | { kind: "renew"; daysLeft: number };

/**
 * Launch of the lower Pro price. While the live price (admin setting) is below the old one and the
 * window hasn't ended, the pop-up and the Pro page say "New price" and show the old price struck out.
 * After the end date, or if the price goes back up, everything returns to normal on its own.
 */
export const PREVIOUS_PRICE_KOBO = 300_000; // ₦3,000
export const NEW_PRICE_UNTIL = new Date("2026-12-08T00:00:00+01:00"); // midnight, Lagos time
export const newPriceActive = (priceKobo: number, now = new Date()) =>
  priceKobo < PREVIOUS_PRICE_KOBO && now.getTime() < NEW_PRICE_UNTIL.getTime();

/** Was it closed within the last 7 days? `lastDismissed` is a stored timestamp (ms) or junk. */
export function dismissedRecently(lastDismissed: string | null | undefined, now = Date.now()): boolean {
  const t = Number(lastDismissed);
  return Number.isFinite(t) && t > 0 && t <= now + 60_000 && now - t < NUDGE_EVERY_MS;
}
