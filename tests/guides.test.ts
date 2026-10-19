import { describe, it, expect } from "vitest";
import { inline, parseBody, readMinutes, slugify } from "../src/lib/guides/format";
import { parseGuide, parsePrices, pricesToText } from "../src/lib/guides/rules";

describe("guide text format", () => {
  it("turns headings, paragraphs, lists and bold into blocks", () => {
    const b = parseBody("Intro line one\nline two.\n\n## What it costs\n- Tap: **cheap**\n- Toilet\n\n## What it costs\nAfter.");
    expect(b.map((x) => x.type)).toEqual(["p", "h2", "ul", "h2", "p"]);
    expect(b[0]).toEqual({ type: "p", parts: [{ text: "Intro line one line two.", bold: false }] });
    expect(b[1]).toEqual({ type: "h2", id: "what-it-costs", text: "What it costs" });
    expect(b[3]).toMatchObject({ id: "what-it-costs-2" });
    expect((b[2] as { items: unknown[] }).items[0]).toEqual([{ text: "Tap: ", bold: false }, { text: "cheap", bold: true }]);
  });
  it("never produces HTML: tags stay as text", () => {
    expect(inline("<script>x</script>")).toEqual([{ text: "<script>x</script>", bold: false }]);
  });
  it("slugs and reading time", () => {
    expect(slugify("AC servicing: what it costs & how often!")).toBe("ac-servicing-what-it-costs-how-often");
    expect(readMinutes("word ".repeat(450), ["a", "b"])).toBe(2);
    expect(readMinutes("")).toBe(1);
  });
});

describe("price table lines", () => {
  it("parses naira amounts with commas and the ₦ sign, plus an optional note", () => {
    expect(parsePrices("Fix a tap | ₦5,000 | 15,000 | parts extra\nUnblock toilet | 8000 | 25000")).toEqual({ error: null, rows: [
      { item: "Fix a tap", low: 5000, high: 15000, note: "parts extra" }, { item: "Unblock toilet", low: 8000, high: 25000 }] });
  });
  it("says which line is wrong", () => {
    expect(parsePrices("ok | 1 | 2\nbroken line").error).toMatch(/line 2/);
    expect(parsePrices("x | 500 | 100").error).toMatch(/highest/);
  });
  it("round-trips for the editor", () => {
    const rows = [{ item: "Tap", low: 5000, high: 15000, note: "parts extra" }];
    expect(parsePrices(pricesToText(rows)).rows).toEqual(rows);
  });
});

describe("guide validation", () => {
  const good = { title: "How to hire a good plumber", summary: "What to ask, what it should cost and the warning signs to watch for.", body: "x".repeat(300),
    prices: "Tap | 5000 | 15000", pricesNote: "Estimates, Lagos, Oct 2026", questions: "- Are you available?\nHow long?", redFlags: "", checklist: "", publish: "on" };
  it("accepts a good guide and makes the slug from the title", () => {
    const r = parseGuide(good);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toMatchObject({ slug: "how-to-hire-a-good-plumber", questions: ["Are you available?", "How long?"], publish: true, audience: "CUSTOMER" });
  });
  it("prices need a note saying they're estimates for a place and time", () => {
    const r = parseGuide({ ...good, pricesNote: "" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.pricesNote).toBeTruthy();
  });
  it("rejects short or broken fields", () => {
    const r = parseGuide({ ...good, title: "Short", summary: "tiny", body: "small", slug: "Bad Slug!!" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["body", "summary", "title"]);
  });
});

import { STARTER_GUIDES } from "../src/lib/guides/starter";
describe("starter guides", () => {
  it.each(STARTER_GUIDES.map((g) => [g.slug, g] as const))("%s passes the same checks as the editor", (_s, g) => {
    const r = parseGuide({ ...g, prices: pricesToText(g.prices), questions: g.questions.join("\n"), redFlags: g.redFlags.join("\n"), checklist: g.checklist.join("\n"), publish: "on" });
    if (!r.ok) throw new Error(JSON.stringify(r.errors));
    expect(r.value.slug).toBe(g.slug);
  });
  it("every customer guide with prices says they are estimates", () => {
    for (const g of STARTER_GUIDES.filter((x) => x.prices.length)) expect(g.pricesNote).toMatch(/estimate/i);
  });
  it("no phone numbers or links in the content", () => {
    for (const g of STARTER_GUIDES) expect(JSON.stringify(g)).not.toMatch(/https?:\/\/|0[789][01]\d{8}/);
  });
});
