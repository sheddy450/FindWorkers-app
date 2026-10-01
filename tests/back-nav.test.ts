import { describe, it, expect } from "vitest";
import { fallbackFor, isHomeFor, previousInApp, recordVisit, roleHome } from "../src/lib/nav/back";

describe("back nav: role homes", () => {
  it("customers and visitors use /", () => {
    expect(roleHome("CUSTOMER")).toBe("/");
    expect(roleHome(undefined)).toBe("/");
  });
  it("artisans and admins have their own home", () => {
    expect(roleHome("ARTISAN")).toBe("/artisan/dashboard");
    expect(roleHome("ADMIN")).toBe("/admin");
  });
  it("no Back button on a role's home page", () => {
    expect(isHomeFor("/", undefined)).toBe(true);
    expect(isHomeFor("/artisan/dashboard", "ARTISAN")).toBe(true);
    expect(isHomeFor("/admin", "ADMIN")).toBe(true);
    expect(isHomeFor("/search", "CUSTOMER")).toBe(false);
  });
});

describe("back nav: fallback parents for deep links", () => {
  const cases: [string, Parameters<typeof fallbackFor>[1], string][] = [
    ["/requests/abc", "CUSTOMER", "/requests"],
    ["/requests/new/art1", "CUSTOMER", "/artisan-profile/art1"],
    ["/messages/req1", "CUSTOMER", "/messages"],
    ["/messages/inquiry/x", "ARTISAN", "/messages"],
    ["/admin/users/u1", "ADMIN", "/admin/users"],
    ["/admin/reports", "ADMIN", "/admin"],
    ["/artisan/profile", "ARTISAN", "/artisan/dashboard"],
    ["/artisan/verification", "ARTISAN", "/artisan/dashboard"],
    ["/artisan-profile/a1", undefined, "/search"],
    ["/categories", undefined, "/"],
    ["/search", "CUSTOMER", "/"],
    ["/login", undefined, "/"],
    ["/register", undefined, "/"],
    ["/requests", "CUSTOMER", "/"],
    ["/profile", "ARTISAN", "/artisan/dashboard"],
    ["/notifications", "ADMIN", "/admin"],
  ];
  it.each(cases)("%s (%s) → %s", (path, role, want) => expect(fallbackFor(path, role)).toBe(want));

  it("never sends artisans or admins to the customer homepage", () => {
    for (const p of ["/search", "/categories", "/requests", "/profile", "/login"]) {
      expect(fallbackFor(p, "ARTISAN")).not.toBe("/");
      expect(fallbackFor(p, "ADMIN")).not.toBe("/");
    }
  });
});

describe("back nav: visit stack", () => {
  const visit = (paths: string[]) => paths.reduce<string[]>((s, p) => recordVisit(s, p), []);

  it("home → search → profile, then back twice lands on home", () => {
    let s = visit(["/", "/search", "/artisan-profile/a1"]);
    expect(previousInApp(s, "CUSTOMER")).toBe("/search");
    s = recordVisit(s, "/search");
    expect(previousInApp(s, "CUSTOMER")).toBe("/");
    s = recordVisit(s, "/");
    expect(s).toEqual(["/"]);
  });
  it("a refresh doesn't add a step", () => expect(visit(["/search", "/search"])).toEqual(["/search"]));
  it("opened directly (no history) → use fallback", () => expect(previousInApp(visit(["/requests/abc"]), "CUSTOMER")).toBeNull());
  it("never goes back to login or register", () => {
    expect(previousInApp(visit(["/login", "/profile"]), "CUSTOMER")).toBeNull();
    expect(previousInApp(visit(["/register", "/search"]), undefined)).toBeNull();
  });
  it("artisans and admins never go back to the customer homepage", () => {
    expect(previousInApp(visit(["/", "/requests"]), "ARTISAN")).toBeNull();
    expect(previousInApp(visit(["/", "/requests"]), "ADMIN")).toBeNull();
    expect(previousInApp(visit(["/", "/requests"]), "CUSTOMER")).toBe("/");
  });
});
