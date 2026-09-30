import { describe, it, expect } from "vitest";
import { toE164NG, registerSchema } from "../src/lib/validation/auth";
import { allowed } from "../src/lib/auth/rbac";

describe("phone normalisation", () => {
  it("handles common Nigerian formats", () => {
    for (const n of ["08031234567", "8031234567", "+2348031234567", "234 803 123 4567"])
      expect(toE164NG(n)).toBe("+2348031234567");
  });
  it("rejects invalid numbers", () => expect(toE164NG("12345")).toBeNull());
});
describe("registration", () => {
  it("blocks self-registering as ADMIN", () =>
    expect(registerSchema.safeParse({ name: "Ada", phone: "08031234567", password: "longenough1", role: "ADMIN" }).success).toBe(false));
});
describe("rbac", () => {
  it("restricts /admin to admins", () => {
    expect(allowed("/admin/users", "CUSTOMER")).toBe(false);
    expect(allowed("/admin/users", "ADMIN")).toBe(true);
    expect(allowed("/admin", undefined)).toBe(false);
  });
});

describe("registration validation messages", () => {
  const ok = { name: "Ada Obi", phone: "08031234567", password: "longenough1", role: "CUSTOMER" as const };
  it("accepts valid input and normalises phone", () => {
    const r = registerSchema.safeParse(ok);
    expect(r.success && r.data.phone).toBe("+2348031234567");
  });
  it("rejects short passwords and bad phones", () => {
    expect(registerSchema.safeParse({ ...ok, password: "short" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...ok, phone: "123" }).success).toBe(false);
  });
});

describe("rbac (artisan area)", () => {
  it("keeps /artisan for artisans only", () => {
    expect(allowed("/artisan/profile", "CUSTOMER")).toBe(false);
    expect(allowed("/artisan/verification", "ARTISAN")).toBe(true);
  });
});
