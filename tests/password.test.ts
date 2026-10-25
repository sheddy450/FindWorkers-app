import { describe, it, expect } from "vitest";
import { PASSWORD_MIN, passwordProblem } from "../src/lib/validation/password";

describe("easier sign-up password rule", () => {
  it("accepts 6+ characters that aren't obvious", () => {
    expect(PASSWORD_MIN).toBe(6);
    for (const ok of ["mama2024", "Kunle7", "blue-gate", "829173", "Abuja@home"]) expect(passwordProblem(ok)).toBeNull();
  });
  it("refuses short and well-known passwords", () => {
    expect(passwordProblem("abc12")).toMatch(/at least 6/);
    for (const bad of ["123456", "12345678", "password", "PASSWORD", "qwerty", "000000", "aaaaaaa", "999999999"]) expect(passwordProblem(bad)).toMatch(/too easy/);
  });
  it("refuses the person's own phone number in any form", () => {
    for (const phone of ["+2348031234567", "08031234567", "0803 123 4567"]) {
      expect(passwordProblem("08031234567", phone)).toMatch(/phone number/);
      expect(passwordProblem("2348031234567", phone)).toMatch(/phone number/);
      expect(passwordProblem("8031234567", phone)).toMatch(/phone number/);
    }
    expect(passwordProblem("08031234567", "+2348099999999")).toBeNull();
    expect(passwordProblem("my08031234567", "+2348031234567")).toBeNull();
  });
});
