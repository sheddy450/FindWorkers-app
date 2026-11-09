import { describe, it, expect } from "vitest";
import { NEW_PRICE_UNTIL, NUDGE_EVERY_MS, NUDGE_STORAGE_KEY, PREVIOUS_PRICE_KOBO, dismissedRecently, newPriceActive, nudgeFor, shouldNudge } from "../src/lib/pro/nudge";
import { DEFAULT_PRO_PRICE_KOBO } from "../src/lib/pro/rules";

const now = new Date("2026-10-24T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);
const base = { role: "ARTISAN", proUntil: null as Date | null, serviceCount: 2, paymentsConfigured: true, priceKobo: 300_000, now };

describe("Go Pro pop-up", () => {
  it("never shows to customers, admins or anyone when payments are off", () => {
    expect(nudgeFor({ ...base, role: "CUSTOMER" })).toBeNull();
    expect(nudgeFor({ ...base, role: "ADMIN" })).toBeNull();
    expect(nudgeFor({ ...base, paymentsConfigured: false })).toBeNull();
  });
  it("waits until the artisan has at least one service", () => {
    expect(nudgeFor({ ...base, serviceCount: 0 })).toBeNull();
  });
  it("invites artisans who aren't Pro, including expired plans", () => {
    expect(nudgeFor(base)).toEqual({ kind: "upgrade" });
    expect(nudgeFor({ ...base, proUntil: days(-2) })).toEqual({ kind: "upgrade" });
  });
  it("leaves Pro artisans alone until 3 or fewer days are left, then asks them to renew", () => {
    expect(nudgeFor({ ...base, proUntil: days(10) })).toBeNull();
    expect(nudgeFor({ ...base, proUntil: days(4) })).toBeNull();
    expect(nudgeFor({ ...base, proUntil: days(3) })).toEqual({ kind: "renew", daysLeft: 3 });
    expect(nudgeFor({ ...base, proUntil: days(0.5) })).toEqual({ kind: "renew", daysLeft: 1 });
  });
  it("stays hidden for 7 days after being closed", () => {
    const t = now.getTime();
    expect(dismissedRecently(String(t - 86_400_000), t)).toBe(true);
    expect(dismissedRecently(String(t - NUDGE_EVERY_MS - 1), t)).toBe(false);
    for (const junk of [null, undefined, "", "abc", "-5", String(t + 10 * 86_400_000)]) expect(dismissedRecently(junk, t)).toBe(false);
    expect(shouldNudge({ ...base, lastDismissed: String(t - 3_600_000) })).toBeNull();
    expect(shouldNudge({ ...base, lastDismissed: null })).toEqual({ kind: "upgrade" });
  });

  it("announces the lower price until 8 Dec 2026, then goes back to the normal invite", () => {
    const cheap = { ...base, priceKobo: 150_000 };
    expect(nudgeFor(cheap)).toEqual({ kind: "new_price" });
    expect(nudgeFor({ ...cheap, now: new Date(NEW_PRICE_UNTIL.getTime() - 1) })).toEqual({ kind: "new_price" });
    expect(nudgeFor({ ...cheap, now: NEW_PRICE_UNTIL })).toEqual({ kind: "upgrade" });
    expect(nudgeFor({ ...base, priceKobo: PREVIOUS_PRICE_KOBO })).toEqual({ kind: "upgrade" });
    expect(nudgeFor({ ...base, priceKobo: 500_000 })).toEqual({ kind: "upgrade" });
    expect(newPriceActive(150_000, now)).toBe(true);
    expect(NEW_PRICE_UNTIL.toISOString()).toBe("2026-12-07T23:00:00.000Z");
  });
  it("renewal reminders still win over the new-price pop-up", () => {
    expect(nudgeFor({ ...base, priceKobo: 150_000, proUntil: days(2) })).toEqual({ kind: "renew", daysLeft: 2 });
    expect(nudgeFor({ ...base, priceKobo: 150_000, proUntil: days(10) })).toBeNull();
  });
  it("uses a new storage key, so a close of the old pop-up doesn't hide the new one", () => {
    expect(NUDGE_STORAGE_KEY).toBe("fw:pro-nudge:v2");
    expect(shouldNudge({ ...base, priceKobo: 150_000, lastDismissed: String(now.getTime() - 3_600_000) })).toBeNull();
    expect(shouldNudge({ ...base, priceKobo: 150_000, lastDismissed: null })).toEqual({ kind: "new_price" });
  });
  it("the fallback price is \u20a61,500", () => {
    expect(DEFAULT_PRO_PRICE_KOBO).toBe(150_000);
  });
});
