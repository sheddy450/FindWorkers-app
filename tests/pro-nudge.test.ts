import { describe, it, expect } from "vitest";
import { showProPopup } from "../src/lib/pro/nudge";
import { PRO_POPUP } from "../src/lib/pro/popup-config";
import { DEFAULT_PRO_PRICE_KOBO } from "../src/lib/pro/rules";

const now = new Date("2026-11-11T10:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);
const base = { role: "ARTISAN", proUntil: null, paymentsConfigured: true, closedAt: null, closedCampaign: null, now };

describe("Pro ad pop-up: who sees it", () => {
  it("artisans without Pro see it", () => {
    expect(showProPopup(base)).toBe(true);
    expect(showProPopup({ ...base, proUntil: days(-2) })).toBe(true); // Pro has ended
  });
  it("never customers, admins, or artisans with an active Pro plan (even near the end)", () => {
    expect(showProPopup({ ...base, role: "CUSTOMER" })).toBe(false);
    expect(showProPopup({ ...base, role: "ADMIN" })).toBe(false);
    expect(showProPopup({ ...base, proUntil: days(20) })).toBe(false);
    expect(showProPopup({ ...base, proUntil: days(0.5) })).toBe(false);
  });
  it("not while payments are off, or when switched off in popup-config.ts", () => {
    expect(showProPopup({ ...base, paymentsConfigured: false })).toBe(false);
    expect(showProPopup({ ...base, enabled: false })).toBe(false);
  });
});

describe("Pro ad pop-up: no nagging", () => {
  const closed = (d: number, campaign: string = PRO_POPUP.campaign) => ({ ...base, closedAt: days(-d), closedCampaign: campaign });
  it("stays away for 7 days after it's closed (stored on the account)", () => {
    expect(PRO_POPUP.snoozeDays).toBe(7);
    expect(showProPopup(closed(0))).toBe(false);
    expect(showProPopup(closed(6.9))).toBe(false);
    expect(showProPopup(closed(7))).toBe(true);
  });
  it("a new ad (new campaign) shows once even if the old one was just closed", () => {
    expect(showProPopup(closed(1, "an-older-ad"))).toBe(true);
  });
});

describe("Pro ad pop-up: settings", () => {
  it("the image, its size and alt text live in one place", () => {
    expect(PRO_POPUP.image.src.startsWith("/promo/")).toBe(true);
    expect(PRO_POPUP.image.width / PRO_POPUP.image.height).toBeCloseTo(0.8);
    expect(PRO_POPUP.image.alt).toBe("FindWorkers Pro: shown first in search and first look at new jobs, ₦1,500 per month");
  });
  it("the fallback price is ₦1,500", () => {
    expect(DEFAULT_PRO_PRICE_KOBO).toBe(150_000);
  });
});
