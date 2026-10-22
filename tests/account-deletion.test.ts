import { describe, it, expect } from "vitest";
import { FORMER_NAME, PENDING_REQUEST_STATUSES, canSelfDelete, confirmed, lockedPasswordHash } from "../src/lib/account/deletion";

describe("account deletion rules", () => {
  it("only customers and artisans can delete themselves", () => {
    expect(canSelfDelete("CUSTOMER")).toBe(true);
    expect(canSelfDelete("ARTISAN")).toBe(true);
    expect(canSelfDelete("ADMIN")).toBe(false);
  });
  it("needs an explicit true to confirm", () => {
    expect(confirmed(true)).toBe(true);
    for (const v of [false, "true", "on", 1, undefined, null]) expect(confirmed(v)).toBe(false);
  });
  it("leaves no name behind", () => {
    expect(FORMER_NAME.CUSTOMER).toBe("Former customer");
    expect(FORMER_NAME.ARTISAN).toBe("Former artisan");
  });
  it("cancels only requests still in progress", () => {
    expect([...PENDING_REQUEST_STATUSES].sort()).toEqual(["ACCEPTED", "ON_THE_WAY", "REQUESTED"]);
  });
  it("locks the password with a value that is not a real hash", () => {
    const h = lockedPasswordHash("abc");
    expect(h.startsWith("!deleted!")).toBe(true);
    expect(h.startsWith("$argon2")).toBe(false);
  });
});
