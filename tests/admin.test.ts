import { describe, it, expect } from "vitest";
import { allowed } from "../src/lib/auth/rbac";
import { toSlug, categorySchema } from "../src/lib/validation/category";
import { reportSchema } from "../src/lib/validation/report";

describe("rbac: admin can view request detail, still can't reach customer/artisan-only creation flows", () => {
  it("admins are allowed under /requests", () => expect(allowed("/requests/abc123", "ADMIN")).toBe(true));
  it("customers and artisans still allowed under /requests", () => {
    expect(allowed("/requests/abc123", "CUSTOMER")).toBe(true);
    expect(allowed("/requests/abc123", "ARTISAN")).toBe(true);
  });
  it("admin cannot reach /artisan (artisan-only dashboard)", () => expect(allowed("/artisan/dashboard", "ADMIN")).toBe(false));
});

describe("category slugs", () => {
  it("slugifies names for search links", () => {
    expect(toSlug("Solar Installer")).toBe("solar-installer");
    expect(toSlug("AC / Fridge Technician")).toBe("ac-fridge-technician");
  });
  it("rejects a name with no letters or numbers once slugified", () => expect(toSlug("---")).toBe(""));
  it("rejects a too-short category name", () => expect(categorySchema.safeParse({ name: "A" }).success).toBe(false));
});

describe("report validation", () => {
  it("requires real detail, not a one-word reason", () =>
    expect(reportSchema.safeParse({ targetType: "USER", targetId: "u1", reason: "bad" }).success).toBe(false));
  it("accepts a complete report", () =>
    expect(reportSchema.safeParse({ targetType: "REVIEW", targetId: "r1", reason: "This review names a different artisan than the one on the job." }).success).toBe(true));
  it("only allows the three defined target types", () =>
    expect(reportSchema.safeParse({ targetType: "REQUEST", targetId: "x", reason: "1234567890" }).success).toBe(false));
});
