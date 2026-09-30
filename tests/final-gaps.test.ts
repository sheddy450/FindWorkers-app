import { describe, it, expect } from "vitest";
import { accountSchema, passwordChangeSchema } from "../src/lib/validation/profile";
import { allowed } from "../src/lib/auth/rbac";

describe("account update validation", () => {
  it("requires a real name", () => expect(accountSchema.safeParse({ name: "A" }).success).toBe(false));
  it("allows clearing the email (empty string)", () => expect(accountSchema.safeParse({ name: "Ada Obi", email: "" }).success).toBe(true));
  it("rejects a malformed email", () => expect(accountSchema.safeParse({ name: "Ada Obi", email: "not-an-email" }).success).toBe(false));
});

describe("password change validation", () => {
  it("requires the current password", () => expect(passwordChangeSchema.safeParse({ currentPassword: "", newPassword: "longenough1" }).success).toBe(false));
  it("enforces the same minimum length as registration", () => expect(passwordChangeSchema.safeParse({ currentPassword: "x", newPassword: "short" }).success).toBe(false));
  it("accepts a valid change", () => expect(passwordChangeSchema.safeParse({ currentPassword: "oldpass123", newPassword: "newpassword1" }).success).toBe(true));
});

describe("rbac covers the newly added protected screens", () => {
  it("/profile is open to all three logged-in roles", () => {
    expect(allowed("/profile", "CUSTOMER")).toBe(true);
    expect(allowed("/profile", "ARTISAN")).toBe(true);
    expect(allowed("/profile", "ADMIN")).toBe(true);
  });
  it("/profile requires a role (redirects a guest)", () => expect(allowed("/profile", undefined)).toBe(false));
  it("/location and /categories are public (no rbac rule matches them)", () => {
    expect(allowed("/location", undefined)).toBe(true);
    expect(allowed("/categories", undefined)).toBe(true);
  });
});
