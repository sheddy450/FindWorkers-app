import { describe, it, expect } from "vitest";
import { MAX_QUOTES_PER_JOB, budgetText, expiryFrom, hasPhoneNumber, hiredRequestDescription, jobView, parseJob, parseQuote, quoteBlocker } from "../src/lib/jobs/rules";
import { DRAFT_MAX_AGE_MS, decodeDraft, encodeDraft, safeNext } from "../src/lib/jobs/draft";

const STATES = ["Lagos", "FCT (Abuja)", "Plateau"];
const NOW = new Date("2026-10-19T10:00:00Z");
const good = { categoryId: "c1", title: "Fix leaking kitchen sink", description: "Water drips under the sink and the cabinet floor is wet.",
  state: "Lagos", lga: "Ikeja", budgetMinNaira: "5,000", budgetMaxNaira: "15000", timing: "THIS_WEEK", preferredDate: "" };

describe("job post validation", () => {
  it("accepts a normal job and cleans the budget", () => {
    const r = parseJob(good, STATES, NOW);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toMatchObject({ budgetMinNaira: 5000, budgetMaxNaira: 15000, timing: "THIS_WEEK", preferredDate: null });
  });
  it("budget is optional", () => {
    const r = parseJob({ ...good, budgetMinNaira: "", budgetMaxNaira: "" }, STATES, NOW);
    expect(r.ok && r.value.budgetMinNaira === null && r.value.budgetMaxNaira === null).toBe(true);
  });
  it("explains each problem in plain words", () => {
    const r = parseJob({ ...good, title: "fix", description: "short", state: "Gotham", lga: "", budgetMinNaira: "20000", budgetMaxNaira: "5000", timing: "SOON" }, STATES, NOW);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(Object.keys(r.errors).sort()).toEqual(["budgetMaxNaira", "description", "lga", "state", "timing", "title"]);
  });
  it("a specific date must be today or later, within 4 months", () => {
    expect(parseJob({ ...good, timing: "ON_DATE", preferredDate: "2026-10-18" }, STATES, NOW).ok).toBe(false);
    expect(parseJob({ ...good, timing: "ON_DATE", preferredDate: "2027-06-01" }, STATES, NOW).ok).toBe(false);
    const r = parseJob({ ...good, timing: "ON_DATE", preferredDate: "2026-10-25" }, STATES, NOW);
    expect(r.ok && r.value.preferredDate).toBe("2026-10-25");
  });
  it("keeps phone numbers out of job posts and quotes", () => {
    expect(parseJob({ ...good, description: "Call me on 0803 123 4567 for the leaking sink please" }, STATES, NOW).ok).toBe(false);
    expect(parseQuote({ priceNaira: "8000", message: "I can do it, reach me +234-803-123-4567" }).ok).toBe(false);
  });
});

describe("phone number detection", () => {
  it.each(["08031234567", "0803 123 4567", "+234 803 123 4567", "2348031234567", "(0803) 123-4567", "0703-123-4567"])("finds %s", (t) => expect(hasPhoneNumber(`text ${t} text`)).toBe(true));
  it.each(["₦5,000 – ₦15,000", "2 bedrooms, 3 taps, 1 toilet", "Plot 12, 3rd Avenue", "2026-10-25"])("ignores %s", (t) => expect(hasPhoneNumber(t)).toBe(false));
});

describe("quotes", () => {
  it("validates price and message", () => {
    expect(parseQuote({ priceNaira: "12,500", message: "Includes new trap and labour, 2 hours", canStart: "Tomorrow" })).toEqual({ ok: true, value: { priceNaira: 12500, message: "Includes new trap and labour, 2 hours", canStart: "Tomorrow" } });
    const bad = parseQuote({ priceNaira: "abc", message: "ok" });
    expect(bad.ok).toBe(false);
    if (!bad.ok) expect(Object.keys(bad.errors).sort()).toEqual(["message", "priceNaira"]);
  });
  const base = { view: "OPEN" as const, isOwnJob: false, offersService: true, sameState: true, quoteCount: 2, alreadyQuoted: false };
  it("lets a matching artisan quote an open job", () => expect(quoteBlocker(base)).toBeNull());
  it("explains why an artisan can't quote", () => {
    expect(quoteBlocker({ ...base, view: "HIRED" })).toMatch(/already hired/);
    expect(quoteBlocker({ ...base, view: "EXPIRED" })).toMatch(/no longer/);
    expect(quoteBlocker({ ...base, offersService: false })).toMatch(/Add this service/);
    expect(quoteBlocker({ ...base, sameState: false })).toMatch(/outside the state/);
    expect(quoteBlocker({ ...base, quoteCount: MAX_QUOTES_PER_JOB })).toMatch(/most quotes/);
  });
  it("an artisan who already quoted can still update their quote when the job is full", () =>
    expect(quoteBlocker({ ...base, quoteCount: MAX_QUOTES_PER_JOB, alreadyQuoted: true })).toBeNull());
});

describe("job lifecycle", () => {
  it("open jobs expire after 14 days without a background task", () => {
    const exp = expiryFrom(NOW);
    expect(jobView({ status: "OPEN", expiresAt: exp }, new Date(exp.getTime() - 1))).toBe("OPEN");
    expect(jobView({ status: "OPEN", expiresAt: exp }, exp)).toBe("EXPIRED");
    expect(jobView({ status: "HIRED", expiresAt: exp }, new Date(exp.getTime() + 1e9))).toBe("HIRED");
  });
  it("budget text", () => {
    expect(budgetText(500000, 1500000)).toBe("₦5,000 – ₦15,000");
    expect(budgetText(500000, null)).toBe("From ₦5,000");
    expect(budgetText(null, 1500000)).toBe("Up to ₦15,000");
    expect(budgetText(null, null)).toBeNull();
  });
  it("carries the job and agreed price into the request", () => {
    expect(hiredRequestDescription({ title: "Fix sink", description: "Leaks" }, { priceKobo: 1250000, canStart: "Tomorrow" }))
      .toBe("Fix sink\n\nLeaks\n\nAgreed quote: ₦12,500 · Can start: Tomorrow");
  });
});


describe("job draft kept while a visitor signs up", () => {
  it("round-trips the typed fields", () => {
    const now = 1_760_000_000_000;
    const raw = encodeDraft({ title: "Fix leaking sink", categoryId: "c1", timing: "THIS_WEEK" }, now);
    expect(decodeDraft(raw, now + 60_000)).toEqual({ title: "Fix leaking sink", categoryId: "c1", timing: "THIS_WEEK" });
  });
  it("drops drafts older than a day, broken JSON and non-string values", () => {
    const now = 1_760_000_000_000;
    expect(decodeDraft(encodeDraft({ title: "x" }, now), now + DRAFT_MAX_AGE_MS + 1)).toBeNull();
    expect(decodeDraft("{not json", now)).toBeNull();
    expect(decodeDraft(JSON.stringify({ savedAt: now, fields: { a: 1, b: "ok" } }), now)).toEqual({ b: "ok" });
    expect(decodeDraft(null, now)).toBeNull();
  });
  it("only allows same-site next paths", () => {
    expect(safeNext("/jobs/new?resume=1")).toBe("/jobs/new?resume=1");
    expect(safeNext("//evil.com")).toBeNull();
    expect(safeNext("/\\evil.com")).toBeNull();
    expect(safeNext("https://evil.com")).toBeNull();
    expect(safeNext("/login")).toBeNull();
    expect(safeNext(null)).toBeNull();
  });
});
