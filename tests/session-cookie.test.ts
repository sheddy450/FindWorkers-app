import { describe, it, expect } from "vitest";
import { readSessionCookie } from "../src/lib/auth/session-cookie";

describe("readSessionCookie", () => {
  it("reads the https (secure) cookie", () =>
    expect(readSessionCookie([{ name: "__Secure-next-auth.session-token", value: "abc" }])).toBe("abc"));
  it("reads the http cookie", () =>
    expect(readSessionCookie([{ name: "next-auth.session-token", value: "xyz" }])).toBe("xyz"));
  it("prefers the secure cookie when both exist", () =>
    expect(readSessionCookie([
      { name: "next-auth.session-token", value: "old" },
      { name: "__Secure-next-auth.session-token", value: "new" },
    ])).toBe("new"));
  it("joins chunked cookies in order", () =>
    expect(readSessionCookie([
      { name: "__Secure-next-auth.session-token.1", value: "def" },
      { name: "__Secure-next-auth.session-token.0", value: "abc" },
    ])).toBe("abcdef"));
  it("returns null when not signed in", () =>
    expect(readSessionCookie([{ name: "next-auth.csrf-token", value: "x" }])).toBeNull());
});
