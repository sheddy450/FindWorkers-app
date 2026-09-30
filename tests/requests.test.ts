import { describe, it, expect } from "vitest";
import { TRANSITIONS } from "../src/lib/requests/rules";
import { requestSchema } from "../src/lib/validation/request";
import { bayesianRating, verificationScore, availabilityScore } from "../src/lib/search/rank";

describe("request status transitions", () => {
  it("only the artisan can accept or reject", () => {
    const opts = TRANSITIONS.REQUESTED;
    expect(opts.find((o) => o.to === "ACCEPTED")?.by).toBe("ARTISAN");
    expect(opts.find((o) => o.to === "CANCELLED")?.by).toBe("CUSTOMER");
  });
  it("only the customer confirms completion", () => expect(TRANSITIONS.ON_THE_WAY[0]).toEqual({ to: "COMPLETED", by: "CUSTOMER" }));
  it("terminal states have no further transitions", () => {
    for (const s of ["REVIEWED", "REJECTED", "CANCELLED", "EXPIRED"] as const) expect(TRANSITIONS[s]).toHaveLength(0);
  });
});
describe("request form validation", () => {
  it("requires a real description, not a one-word stub", () =>
    expect(requestSchema.safeParse({ categoryId: "c1", description: "fix", address: "12 Example St" }).success).toBe(false));
  it("accepts a complete request", () =>
    expect(requestSchema.safeParse({ categoryId: "c1", description: "My kitchen sink is leaking badly", address: "12 Example St, Gwarinpa" }).success).toBe(true));
});
describe("search ranking", () => {
  it("Bayesian rating pulls a single 5-star review toward the prior, not to 5.0", () => expect(bayesianRating(5, 1)).toBeLessThan(4.5));
  it("many good reviews outweigh the prior", () => expect(bayesianRating(4.8, 100)).toBeGreaterThan(4.7));
  it("verification score caps at 1 and ignores background checks", () => {
    expect(verificationScore(["IDENTITY", "PHONE", "LOCATION", "BUSINESS"])).toBeLessThanOrEqual(1);
    expect(verificationScore(["BACKGROUND"])).toBe(0);
  });
  it("availability scores in the expected order", () => {
    expect(availabilityScore("AVAILABLE_NOW")).toBeGreaterThan(availabilityScore("BY_SCHEDULE"));
    expect(availabilityScore("BY_SCHEDULE")).toBeGreaterThan(availabilityScore("UNAVAILABLE"));
  });
});
