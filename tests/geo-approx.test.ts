import { describe, it, expect } from "vitest";
import { approxCoord, inNigeria } from "../src/lib/geo/approx";

describe("approximate artisan location", () => {
  it("rounds to 2 decimals (~1 km)", () => {
    expect(approxCoord(6.524379)).toBe(6.52);
    expect(approxCoord(3.379206)).toBe(3.38);
    expect(approxCoord(-0.005)).toBe(-0);
  });
  it("never moves a point by more than ~0.6 km", () => {
    for (const v of [6.5249, 9.0765, 12.0022, 3.3792]) expect(Math.abs(approxCoord(v) - v)).toBeLessThanOrEqual(0.005);
  });
});

describe("Nigeria bounds", () => {
  it("contains Lagos, Abuja and Kano", () => {
    expect(inNigeria(6.5244, 3.3792)).toBe(true);
    expect(inNigeria(9.0765, 7.3986)).toBe(true);
    expect(inNigeria(12.0022, 8.592)).toBe(true);
  });
  it("excludes Accra and London", () => {
    expect(inNigeria(5.6037, -0.187)).toBe(false);
    expect(inNigeria(51.5, -0.12)).toBe(false);
  });
});
