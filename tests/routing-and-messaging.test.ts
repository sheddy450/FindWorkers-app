import { describe, it, expect } from "vitest";
import { messageSchema } from "../src/lib/validation/message";
import { allowed } from "../src/lib/auth/rbac";

describe("role-appropriate landing pages", () => {
  // These aren't full route tests (no DB/session here), but they pin down the contract that
  // src/app/page.tsx and src/app/login/page.tsx rely on: "/" and "/admin" are gated so an
  // artisan or admin never gets stuck looking at the customer search homepage.
  it("/artisan is ARTISAN-only, so home redirects there only for artisans", () => {
    expect(allowed("/artisan/dashboard", "ARTISAN")).toBe(true);
    expect(allowed("/artisan/dashboard", "CUSTOMER")).toBe(false);
  });
  it("/admin is ADMIN-only", () => {
    expect(allowed("/admin", "ADMIN")).toBe(true);
    expect(allowed("/admin", "ARTISAN")).toBe(false);
  });
});

describe("message body validation (shared by request threads and direct conversations)", () => {
  it("rejects an empty message", () => expect(messageSchema.safeParse({ body: "  " }).success).toBe(false));
  it("accepts a normal message", () => expect(messageSchema.safeParse({ body: "Are you available Saturday?" }).success).toBe(true));
  it("rejects a message over 2000 characters", () => expect(messageSchema.safeParse({ body: "a".repeat(2001) }).success).toBe(false));
});
