import { describe, it, expect } from "vitest";
import { NUDGE_EVERY_MS, dismissedRecently, nudgeFor, shouldNudge } from "../src/lib/pro/nudge";

const now = new Date("2026-10-24T12:00:00Z");
const days = (n: number) => new Date(now.getTime() + n * 86_400_000);
const base = { role: "ARTISAN", proUntil: null as Date | null, serviceCount: 2, paymentsConfigured: true, now };

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
});
