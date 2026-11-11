import { describe, it, expect } from "vitest";
import { PRO_HEAD_START_MIN, canSeeJob, lagosTime, openToAllAt, proFirst, proFirstLookMessage } from "../src/lib/pro/priority";
import { quoteBlocker } from "../src/lib/jobs/rules";

const now = new Date("2026-11-10T14:10:00Z"); // 3:10 pm in Lagos

describe("Pro head start on new jobs", () => {
  it("opens to everyone 30 minutes later when a Pro artisan matched, at once otherwise", () => {
    expect(PRO_HEAD_START_MIN).toBe(30);
    expect(openToAllAt(2, now)?.toISOString()).toBe("2026-11-10T14:40:00.000Z");
    expect(openToAllAt(0, now)).toBeNull();
  });
  it("Pro artisans always see a job; free artisans only once it opens", () => {
    const opens = new Date("2026-11-10T14:40:00Z");
    expect(canSeeJob({ isPro: true, openToAllAt: opens, now })).toBe(true);
    expect(canSeeJob({ isPro: false, openToAllAt: opens, now })).toBe(false);
    expect(canSeeJob({ isPro: false, openToAllAt: opens, now: opens })).toBe(true);
    expect(canSeeJob({ isPro: false, openToAllAt: null, now })).toBe(true);
  });
  it("tells a free artisan when they can quote, in Lagos time", () => {
    const opens = new Date("2026-11-10T14:40:00Z");
    expect(lagosTime(opens)).toBe("3:40 pm");
    expect(proFirstLookMessage(opens)).toBe("Pro artisans get first look at new jobs. You can quote for this one from 3:40 pm.");
    const base = { view: "OPEN" as const, isOwnJob: false, offersService: true, sameState: true, quoteCount: 0, alreadyQuoted: false };
    expect(quoteBlocker({ ...base, proOnlyUntil: opens })).toContain("3:40 pm");
    expect(quoteBlocker({ ...base, proOnlyUntil: null })).toBeNull();
    // Stronger reasons still win (wrong service, closed job).
    expect(quoteBlocker({ ...base, offersService: false, proOnlyUntil: opens })).toMatch(/Add this service/);
  });
});

describe("Pro first in search", () => {
  it("puts Pro artisans first and keeps each group's order", () => {
    const rows = [{ id: "a", pro: false }, { id: "b", pro: true }, { id: "c", pro: false }, { id: "d", pro: true }];
    const { pro, rest } = proFirst(rows, (r) => r.pro);
    expect(pro.map((r) => r.id)).toEqual(["b", "d"]);
    expect(rest.map((r) => r.id)).toEqual(["a", "c"]);
  });
});
