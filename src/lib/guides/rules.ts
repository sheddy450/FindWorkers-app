/** Guide editing rules. Pure, so the admin editor and the server check the same things. */
import { slugify } from "./format";

export type PriceRow = { item: string; low: number; high: number; note?: string };
export type GuideInput = {
  slug: string; title: string; summary: string; categoryId: string | null; audience: "CUSTOMER" | "ARTISAN";
  body: string; prices: PriceRow[]; pricesNote: string | null; questions: string[]; redFlags: string[]; checklist: string[];
  publish: boolean;
};
export type Errors = Partial<Record<string, string>>;

const lines = (v: unknown) => String(v ?? "").replace(/\r\n?/g, "\n").split("\n").map((l) => l.trim().replace(/^[-*•]\s+/, "")).filter(Boolean);
const naira = (v: string) => { const t = v.replace(/[₦,\s]/g, ""); const n = t === "" ? NaN : Number(t); return Number.isFinite(n) ? Math.round(n) : NaN; };

/** One price row per line: "Item | low | high | optional note", e.g. "Fix a leaking tap | 5,000 | 15,000 | parts extra". */
export function parsePrices(text: string): { rows: PriceRow[]; error: string | null } {
  const rows: PriceRow[] = [];
  const all = lines(text);
  for (let i = 0; i < all.length; i++) {
    const [item, lo, hi, ...rest] = all[i].split("|").map((x) => x.trim());
    const low = naira(lo ?? ""), high = naira(hi ?? "");
    if (!item || !Number.isFinite(low) || !Number.isFinite(high))
      return { rows: [], error: `Price line ${i + 1}: write it as "What | lowest ₦ | highest ₦ | note (optional)".` };
    if (low < 0 || high < low) return { rows: [], error: `Price line ${i + 1}: the highest price must be at least the lowest.` };
    rows.push({ item, low, high, ...(rest.join("|").trim() ? { note: rest.join("|").trim() } : {}) });
  }
  if (rows.length > 20) return { rows: [], error: "Keep the price table to 20 lines or fewer." };
  return { rows, error: null };
}
export const pricesToText = (rows: PriceRow[] | null | undefined) =>
  (rows ?? []).map((r) => [r.item, r.low.toLocaleString("en-NG"), r.high.toLocaleString("en-NG"), r.note].filter((x) => x !== undefined && x !== "").join(" | ")).join("\n");

export function parseGuide(raw: Record<string, unknown>): { ok: true; value: GuideInput } | { ok: false; errors: Errors } {
  const e: Errors = {};
  const s = (k: string) => String(raw[k] ?? "").trim();
  const title = s("title"), summary = s("summary"), body = String(raw.body ?? "").trim();
  const slug = slugify(s("slug") || title);
  if (title.length < 10 || title.length > 100) e.title = "Use a title of 10–100 characters.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3) e.slug = "Use lowercase letters, numbers and dashes, e.g. hiring-a-plumber.";
  if (summary.length < 30 || summary.length > 240) e.summary = "Write a 30–240 character summary: it shows on guide cards and in Google.";
  if (body.length < 200) e.body = "The guide needs at least a few paragraphs (200+ characters).";
  else if (body.length > 20000) e.body = "Keep the guide under 20,000 characters.";
  const audience = raw.audience === "ARTISAN" ? "ARTISAN" : "CUSTOMER";
  const prices = parsePrices(String(raw.prices ?? ""));
  if (prices.error) e.prices = prices.error;
  const pricesNote = s("pricesNote") || null;
  if (prices.rows.length && !pricesNote) e.pricesNote = "Say where and when these prices apply, e.g. \"Estimates for Lagos and Abuja, October 2026\".";
  const list = (k: "questions" | "redFlags" | "checklist") => {
    const l = lines(raw[k]);
    if (l.length > 15) e[k] = "Keep this to 15 lines or fewer.";
    if (l.some((x) => x.length > 220)) e[k] = "Keep each line under 220 characters.";
    return l;
  };
  const questions = list("questions"), redFlags = list("redFlags"), checklist = list("checklist");
  if (Object.keys(e).length) return { ok: false, errors: e };
  return { ok: true, value: {
    slug, title, summary, categoryId: s("categoryId") || null, audience, body, prices: prices.rows, pricesNote,
    questions, redFlags, checklist, publish: raw.publish === true || raw.publish === "true" || raw.publish === "on",
  } };
}
