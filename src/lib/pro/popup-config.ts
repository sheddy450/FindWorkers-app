/**
 * The Pro ad pop-up artisans see on the home page after login. Everything you might change lives here.
 *
 * - Turn it off: set `enabled: false`.
 * - Swap the ad: put the new image in /public/promo/, then change `src`, `width`, `height` and `alt`.
 *   Give the new file a new name (don't overwrite the old one), so phones don't keep a cached copy.
 * - Show the new ad to artisans who closed the old one: change `campaign` (any new word).
 *
 * Who sees it and when: src/lib/pro/nudge.ts. The pop-up itself: src/components/pro/ProPopup.tsx.
 */
export const PRO_POPUP = {
  enabled: true,
  campaign: "pro-2026-11",
  image: {
    src: "/promo/pro-ad-2026-11.png",
    width: 1080,
    height: 1350,
    alt: "FindWorkers Pro: shown first in search and first look at new jobs, ₦1,500 per month",
  },
  /** After "Not now", ×, Escape, a tap outside or "Go Pro", it stays away this long (per account). */
  snoozeDays: 7,
} as const;
