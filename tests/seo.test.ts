import { describe, it, expect } from "vitest";
import { absoluteUrl, clip, jsonLdString, serviceDescription, serviceHeading, stateFromSlug, stateLabel, stateSlug } from "../src/lib/seo/site";

const STATES = ["Akwa Ibom", "Cross River", "FCT (Abuja)", "Lagos", "Rivers"];

describe("state URLs", () => {
  it("makes clean slugs", () => {
    expect(stateSlug("Lagos")).toBe("lagos");
    expect(stateSlug("Akwa Ibom")).toBe("akwa-ibom");
    expect(stateSlug("FCT (Abuja)")).toBe("abuja");
  });
  it("round-trips every state and rejects unknown ones", () => {
    for (const s of STATES) expect(stateFromSlug(stateSlug(s), STATES)).toBe(s);
    expect(stateFromSlug("LAGOS", STATES)).toBe("Lagos");
    expect(stateFromSlug("london", STATES)).toBeNull();
  });
  it("labels the FCT the way people search for it", () => expect(stateLabel("FCT (Abuja)")).toBe("Abuja"));
});

describe("titles and descriptions", () => {
  it("reads like a search query", () => {
    expect(serviceHeading("Electrician", "Lagos")).toBe("Electrician in Lagos");
    expect(serviceHeading("Plumber", null)).toBe("Plumber in Nigeria");
  });
  it("mentions the count only when there are artisans", () => {
    expect(serviceDescription("Plumber", "Lagos", 3)).toContain("Compare 3 plumber artisans in Lagos");
    expect(serviceDescription("Plumber", null, 0)).toContain("Find a plumber in Nigeria");
  });
  it("clips long text at a word boundary", () => {
    const c = clip("word ".repeat(80), 155);
    expect(c.length).toBeLessThanOrEqual(155); expect(c.endsWith("…")).toBe(true);
    expect(clip("short")).toBe("short");
  });
  it("builds absolute URLs on the canonical domain", () => expect(absoluteUrl("/services/plumber")).toBe("https://findworkersapp.com/services/plumber"));
});

describe("structured data", () => {
  it("can't be broken out of with </script>", () => {
    const s = jsonLdString({ name: "Bad </script><script>alert(1)</script>" });
    expect(s).not.toContain("</script>"); expect(JSON.parse(s).name).toContain("</script>");
  });
});
