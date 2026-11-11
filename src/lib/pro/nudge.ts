import { isPro, proDaysLeft } from "./rules";

/**
 * "Go Pro" pop-up for artisans on the home page: who sees it and how often. Pure, so it's unit-tested.
 * Copy rule: every Pro artisan matching a search is shown first, in the labelled Featured section, and
 * gets new jobs PRO_HEAD_START_MIN minutes early (src/lib/pro/priority.ts). Among several Pro artisans
 * the best match comes first, so never promise "#1" or "guaranteed".
 */
import { RENEW_WITHIN_DAYS, dismissedRecently, newPriceActive, type Nudge } from "./nudge-shared";
export * from "./nudge-shared";

/** Server side: is this account eligible at all? (Role, plan, a filled-in profile, payments switched on.) */
export function nudgeFor(a: {
  role: string; proUntil: Date | null | undefined; serviceCount: number; paymentsConfigured: boolean;
  /** The live Pro price (admin setting). Below the old price, during the launch window, non-Pro artisans get the "new price" version. */
  priceKobo: number; now?: Date;
}): Nudge | null {
  const now = a.now ?? new Date();
  if (a.role !== "ARTISAN" || !a.paymentsConfigured || a.serviceCount < 1) return null;
  if (!isPro(a.proUntil, now)) return newPriceActive(a.priceKobo, now) ? { kind: "new_price" } : { kind: "upgrade" };
  const daysLeft = proDaysLeft(a.proUntil, now);
  return daysLeft <= RENEW_WITHIN_DAYS ? { kind: "renew", daysLeft } : null;
}

/** Both checks together (what the home page effectively does). */
export function shouldNudge(a: Parameters<typeof nudgeFor>[0] & { lastDismissed?: string | null }): Nudge | null {
  const n = nudgeFor(a);
  return n && !dismissedRecently(a.lastDismissed, (a.now ?? new Date()).getTime()) ? n : null;
}
