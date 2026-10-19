import { describe, it, expect } from "vitest";
import { CITIES, cityOrState } from "../src/lib/places/cities";
const STATES = ["Lagos", "FCT (Abuja)", "Rivers", "Oyo", "Akwa Ibom", "Cross River", "Plateau"];
describe("browse by city", () => {
  it("finds cities by slug or name", () => {
    expect(cityOrState("port-harcourt", STATES)).toEqual({ label: "Port Harcourt", state: "Rivers" });
    expect(cityOrState("Port Harcourt", STATES)).toEqual({ label: "Port Harcourt", state: "Rivers" });
    expect(cityOrState("ABUJA", STATES)).toEqual({ label: "Abuja", state: "FCT (Abuja)" });
  });
  it("accepts a state name too", () => {
    expect(cityOrState("Akwa Ibom", STATES)).toEqual({ label: "Akwa Ibom", state: "Akwa Ibom" });
    expect(cityOrState("fct", STATES)).toEqual({ label: "Abuja", state: "FCT (Abuja)" });
  });
  it("unknown → null", () => {
    expect(cityOrState("Gotham", STATES)).toBeNull();
    expect(cityOrState("", STATES)).toBeNull();
  });
  it("slugs are unique", () => expect(new Set(CITIES.map((c) => c.slug)).size).toBe(CITIES.length));
});
