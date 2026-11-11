import { describe, it, expect } from "vitest";
import { OTP_LENGTH, codeMatches, generateCode, hashCode, maskPhone, smsText } from "../src/lib/phone/otp";

const secret = "test-secret", phone = "+2348031234567";

describe("codes", () => {
  it("are 6 digits, including leading zeros", () => {
    for (let i = 0; i < 500; i++) expect(generateCode()).toMatch(/^\d{6}$/);
  });
  it("vary", () => expect(new Set(Array.from({ length: 50 }, generateCode)).size).toBeGreaterThan(40));
});

describe("checking a code", () => {
  const stored = hashCode("042917", phone, secret);
  it("accepts the right code, even with spaces typed in", () => {
    expect(codeMatches("042917", phone, stored, secret)).toBe(true);
    expect(codeMatches("042 917", phone, stored, secret)).toBe(true);
  });
  it("rejects wrong, short or empty codes", () => {
    for (const bad of ["042918", "04291", "", "abcdef", "0429170"]) expect(codeMatches(bad, phone, stored, secret)).toBe(false);
  });
  it("is tied to the phone number and the secret", () => {
    expect(codeMatches("042917", "+2348099999999", stored, secret)).toBe(false);
    expect(codeMatches("042917", phone, stored, "other-secret")).toBe(false);
  });
  it("never stores the code itself", () => expect(stored).not.toContain("042917"));
});

describe("messages", () => {
  it("masks the phone number", () => expect(maskPhone(phone)).toBe("+234 803 *** 4567"));
  it("SMS includes the code, expiry and a do-not-share warning", () => {
    const t = smsText("123456");
    expect(t).toContain("123456"); expect(t).toContain("10 minutes"); expect(t.toLowerCase()).toContain("never share");
    expect(OTP_LENGTH).toBe(6);
  });
});
