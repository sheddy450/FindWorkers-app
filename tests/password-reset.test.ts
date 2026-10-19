import { describe, it, expect } from "vitest";
import { RESET_TTL_MIN, generateResetToken, hashResetToken, looksLikeResetToken, resetExpiry, sessionIsStale } from "../src/lib/auth/reset-token";
import { resetEmail } from "../src/lib/email/templates";

describe("reset tokens", () => {
  it("are long, URL-safe and unique", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 200; i++) { const t = generateResetToken(); expect(looksLikeResetToken(t)).toBe(true); seen.add(t); }
    expect(seen.size).toBe(200);
  });
  it("are stored only as a hash", () => {
    const t = generateResetToken();
    expect(hashResetToken(t)).toMatch(/^[0-9a-f]{64}$/);
    expect(hashResetToken(t)).not.toContain(t);
    expect(hashResetToken(t)).toBe(hashResetToken(t));
  });
  it("rejects junk before any database lookup", () => {
    for (const bad of [undefined, "", "abc", "x".repeat(43) + "!", "a b".repeat(15), 123]) expect(looksLikeResetToken(bad)).toBe(false);
  });
  it(`expire after ${RESET_TTL_MIN} minutes`, () => {
    const now = new Date("2026-10-19T10:00:00Z");
    expect(resetExpiry(now).toISOString()).toBe("2026-10-19T10:30:00.000Z");
  });
});

describe("signing out other devices", () => {
  const changed = new Date("2026-10-19T10:00:00Z");
  it("rejects sessions from before the password changed", () => expect(sessionIsStale(changed.getTime() / 1000 - 3600, changed)).toBe(true));
  it("keeps sessions created after the change (and just around it)", () => {
    expect(sessionIsStale(changed.getTime() / 1000 + 60, changed)).toBe(false);
    expect(sessionIsStale(changed.getTime() / 1000 - 2, changed)).toBe(false);
  });
  it("ignores accounts that never changed their password", () => expect(sessionIsStale(1, null)).toBe(false));
});

describe("reset email", () => {
  const link = "https://findworkersapp.com/reset-password?token=abc";
  it("includes the link, expiry and a safety note", () => {
    const e = resetEmail({ name: "Ada", link });
    expect(e.subject).toContain("Reset");
    expect(e.html).toContain(link); expect(e.text).toContain(link);
    expect(e.text).toContain("30 minutes"); expect(e.text.toLowerCase()).toContain("ignore");
  });
  it("escapes the user's name so it can't inject HTML", () => {
    const e = resetEmail({ name: '<img src=x onerror=alert(1)>', link });
    expect(e.html).not.toContain("<img src=x"); expect(e.html).toContain("&lt;img");
  });
});
