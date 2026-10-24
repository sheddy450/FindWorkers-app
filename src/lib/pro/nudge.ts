import { isPro, proDaysLeft } from "./rules";

/**
 * "Go Pro" pop-up for artisans on the home page: who sees it and how often. Pure, so it's unit-tested.
 * Copy rule: Pro gives a chance at a labelled Featured spot above search results and on the home page
 * (2 spots, rotated at random among matching Pro artisans). Never promise "top of the list" or "#1".
 */
import { RENEW_WITHIN_DAYS, dismissedRecently, type Nudge } from "./nudge-shared";
export * from "./nudge-shared";

/** Server side: is this account eligible at all? (Role, plan, a filled-in profile, payments switched on.) */
export function nudgeFor(a: {
  role: string; proUntil: Date | null | undefined; serviceCount: number; paymentsConfigured: boolean; now?: Date;
}): Nudge | null {
  const now = a.now ?? new Date();
  if (a.role !== "ARTISAN" || !a.paymentsConfigured || a.serviceCount < 1) return null;
  if (!isPro(a.proUntil, now)) return { kind: "upgrade" };
  const daysLeft = proDaysLeft(a.proUntil, now);
  return daysLeft <= RENEW_WITHIN_DAYS ? { kind: "renew", daysLeft } : null;
}

/** Both checks together (what the home page effectively does). */
export function shouldNudge(a: Parameters<typeof nudgeFor>[0] & { lastDismissed?: string | null }): Nudge | null {
  const n = nudgeFor(a);
  return n && !dismissedRecently(a.lastDismissed, (a.now ?? new Date()).getTime()) ? n : null;
}
