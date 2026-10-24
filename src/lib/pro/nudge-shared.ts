/** Browser-safe part of the "Go Pro" pop-up rules (no server imports). See nudge.ts. */
export const NUDGE_STORAGE_KEY = "fw:pro-nudge:v1";
export const NUDGE_EVERY_MS = 7 * 24 * 60 * 60 * 1000;
export const RENEW_WITHIN_DAYS = 3;
export const NUDGE_DELAY_MS = 2000;

export type Nudge = { kind: "upgrade" } | { kind: "renew"; daysLeft: number };

/** Was it closed within the last 7 days? `lastDismissed` is a stored timestamp (ms) or junk. */
export function dismissedRecently(lastDismissed: string | null | undefined, now = Date.now()): boolean {
  const t = Number(lastDismissed);
  return Number.isFinite(t) && t > 0 && t <= now + 60_000 && now - t < NUDGE_EVERY_MS;
}
