import { describe, it, expect } from "vitest";
import { LIMITS, accountKey, clientIp, minutesFrom, retryAfterSec, windowStart } from "../src/lib/security/rate-limit-rules";

const toE164 = (s: string) => (/^0?(\d{10})$/.test(s.replace(/\s/g, "")) ? `+234${s.replace(/\s/g, "").replace(/^0/, "")}` : null);

describe("windows", () => {
  it("groups times into fixed windows", () => {
    expect(windowStart(1000, 900)).toBe(900);
    expect(windowStart(1799, 900)).toBe(900);
    expect(windowStart(1800, 900)).toBe(1800);
  });
  it("says how long until the window resets", () => {
    expect(retryAfterSec(1000, 900)).toBe(800);
    expect(minutesFrom(800)).toBe(14);
    expect(minutesFrom(5)).toBe(1);
  });
});

describe("keys", () => {
  it("treats differently typed versions of one login as the same account", () => {
    expect(accountKey(" Ada@Example.COM ", toE164)).toBe("ada@example.com");
    expect(accountKey("0803 123 4567", toE164)).toBe(accountKey("8031234567", toE164));
  });
  it("reads the client IP from proxy headers", () => {
    const h = (m: Record<string, string>) => (n: string) => m[n];
    expect(clientIp(h({ "x-forwarded-for": "41.58.1.2, 10.0.0.1" }))).toBe("41.58.1.2");
    expect(clientIp(h({ "x-real-ip": "41.58.9.9" }))).toBe("41.58.9.9");
    expect(clientIp(h({}))).toBe("unknown");
  });
});

describe("limits", () => {
  it("are tighter per account than per IP (shared mobile IPs)", () => {
    expect(LIMITS.loginPerAccount.max).toBeLessThan(LIMITS.loginPerIp.max);
  });
});
