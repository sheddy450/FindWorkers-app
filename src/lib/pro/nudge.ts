import { isPro } from "./rules";
import { PRO_POPUP } from "./popup-config";
export * from "./nudge-shared";

/**
 * Who sees the Pro ad pop-up (src/components/pro/ProPopup.tsx), and when. Pure, so it's unit-tested.
 * Shown on the home page, only to signed-in artisans: customers and visitors never get it.
 *
 * - Artisans only, and only while they don't have an active Pro plan.
 * - Only when payments are switched on (otherwise "Go Pro" leads nowhere useful).
 * - Not again for PRO_POPUP.snoozeDays after they close it or tap "Go Pro". This is stored on their
 *   account, so it holds on every device. A new `campaign` in popup-config.ts shows a new ad once.
 */
export function showProPopup(a: {
  role: string; proUntil: Date | null | undefined; paymentsConfigured: boolean;
  closedAt: Date | null | undefined; closedCampaign: string | null | undefined;
  enabled?: boolean; campaign?: string; snoozeDays?: number; now?: Date;
}): boolean {
  const now = a.now ?? new Date();
  const { enabled = PRO_POPUP.enabled, campaign = PRO_POPUP.campaign, snoozeDays = PRO_POPUP.snoozeDays } = a;
  if (!enabled || a.role !== "ARTISAN" || !a.paymentsConfigured || isPro(a.proUntil, now)) return false;
  if (!a.closedAt || a.closedCampaign !== campaign) return true;
  return now.getTime() - a.closedAt.getTime() >= snoozeDays * 86_400_000;
}
