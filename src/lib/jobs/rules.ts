/** Job posts and quotes: rules and validation. Pure functions (no database) so they're unit-tested. */

export const JOB_DAYS_OPEN = 14;
/** Enough choice for the customer without flooding them, and a fair chance for artisans who reply. */
export const MAX_QUOTES_PER_JOB = 10;

export type JobTiming = "ASAP" | "THIS_WEEK" | "FLEXIBLE" | "ON_DATE";
export type JobStatus = "OPEN" | "HIRED" | "CLOSED";
export type QuoteStatus = "SENT" | "ACCEPTED" | "DECLINED" | "WITHDRAWN";

export const TIMING_LABEL: Record<JobTiming, string> = {
  ASAP: "As soon as possible", THIS_WEEK: "This week", FLEXIBLE: "I'm flexible", ON_DATE: "On a specific date",
};
export const QUOTE_LABEL: Record<QuoteStatus, string> = {
  SENT: "Waiting for the customer", ACCEPTED: "Hired", DECLINED: "Not chosen", WITHDRAWN: "Withdrawn",
};
export const isTiming = (v: unknown): v is JobTiming => typeof v === "string" && v in TIMING_LABEL;

/** What a job shows as: an OPEN job past its expiry date is treated as expired (no background job needed). */
export type JobView = "OPEN" | "HIRED" | "CLOSED" | "EXPIRED";
export function jobView(job: { status: JobStatus; expiresAt: Date }, now = new Date()): JobView {
  if (job.status === "OPEN" && job.expiresAt.getTime() <= now.getTime()) return "EXPIRED";
  return job.status;
}
export const JOB_LABEL: Record<JobView, string> = { OPEN: "Open for quotes", HIRED: "Hired", CLOSED: "Closed", EXPIRED: "Expired" };

export const expiryFrom = (now = new Date()) => new Date(now.getTime() + JOB_DAYS_OPEN * 86_400_000);

/** "₦5,000" / "₦5,000 – ₦20,000" / null, from kobo. */
export const naira = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString("en-NG")}`;
export function budgetText(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  if (min != null && max != null) return min === max ? naira(min) : `${naira(min)} – ${naira(max)}`;
  return min != null ? `From ${naira(min)}` : `Up to ${naira(max!)}`;
}

/* ── Validation ───────────────────────────────────────────────────────────────────────────────── */

export type JobInput = {
  categoryId: string; title: string; description: string; state: string; lga: string;
  budgetMinNaira: number | null; budgetMaxNaira: number | null; timing: JobTiming; preferredDate: string | null;
};
export type Errors = Partial<Record<string, string>>;

/** Nigerian mobile numbers, however they're spaced: 0803 123 4567, +234 803-123-4567, 2348031234567. */
export function hasPhoneNumber(text: string): boolean {
  return /(?:\+?234|0)[789][01]\d{8}(?!\d)/.test(text.replace(/[\s().-]/g, ""));
}

const MIN_NAIRA = 500, MAX_NAIRA = 50_000_000;
const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
function money(v: unknown): number | null | undefined {
  if (v === "" || v == null) return null;
  const n = typeof v === "number" ? v : Number(String(v).replace(/[₦,\s]/g, ""));
  return Number.isFinite(n) ? Math.round(n) : undefined; // undefined = not a number
}

/** Checks a job post. Returns clean values, or field errors written for the customer. */
export function parseJob(raw: Record<string, unknown>, states: readonly string[], now = new Date()):
  { ok: true; value: JobInput } | { ok: false; errors: Errors } {
  const e: Errors = {};
  const title = str(raw.title), description = str(raw.description), state = str(raw.state), lga = str(raw.lga);
  const categoryId = str(raw.categoryId);
  if (!categoryId) e.categoryId = "Choose the service you need.";
  if (title.length < 5) e.title = "Give the job a short title, e.g. \"Fix leaking kitchen sink\".";
  else if (title.length > 80) e.title = "Keep the title under 80 characters.";
  if (description.length < 20) e.description = "Describe the job in a bit more detail (at least 20 characters), so artisans can price it.";
  else if (description.length > 1500) e.description = "Keep the description under 1,500 characters.";
  if (!states.includes(state)) e.state = "Choose your state.";
  if (lga.length < 2 || lga.length > 60) e.lga = "Enter your area or LGA, e.g. \"Ikeja\".";
  if (hasPhoneNumber(`${title} ${description}`))
    e.description = "Please don't put phone numbers in the job. You'll get the artisan's contact when you hire them.";

  const bmin = money(raw.budgetMinNaira), bmax = money(raw.budgetMaxNaira);
  if (bmin === undefined || (bmin != null && (bmin < MIN_NAIRA || bmin > MAX_NAIRA))) e.budgetMinNaira = `Enter an amount between ₦${MIN_NAIRA.toLocaleString("en-NG")} and ₦${MAX_NAIRA.toLocaleString("en-NG")}, or leave it empty.`;
  if (bmax === undefined || (bmax != null && (bmax < MIN_NAIRA || bmax > MAX_NAIRA))) e.budgetMaxNaira = `Enter an amount between ₦${MIN_NAIRA.toLocaleString("en-NG")} and ₦${MAX_NAIRA.toLocaleString("en-NG")}, or leave it empty.`;
  if (bmin != null && bmax != null && bmin > bmax) e.budgetMaxNaira = "The highest amount should be more than the lowest.";

  const timing = isTiming(raw.timing) ? raw.timing : null;
  if (!timing) e.timing = "Choose when you need it done.";
  let preferredDate: string | null = null;
  if (timing === "ON_DATE") {
    const d = str(raw.preferredDate);
    const t = /^\d{4}-\d{2}-\d{2}$/.test(d) ? Date.parse(`${d}T12:00:00Z`) : NaN;
    const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
    if (!Number.isFinite(t)) e.preferredDate = "Pick a date.";
    else if (t < today) e.preferredDate = "Pick a date from today onwards.";
    else if (t > today + 120 * 86_400_000) e.preferredDate = "Pick a date within the next 4 months.";
    else preferredDate = d;
  }
  if (Object.keys(e).length) return { ok: false, errors: e };
  return { ok: true, value: { categoryId, title, description, state, lga, budgetMinNaira: bmin ?? null, budgetMaxNaira: bmax ?? null, timing: timing!, preferredDate } };
}

export type QuoteInput = { priceNaira: number; message: string; canStart: string | null };

export function parseQuote(raw: Record<string, unknown>): { ok: true; value: QuoteInput } | { ok: false; errors: Errors } {
  const e: Errors = {};
  const price = money(raw.priceNaira), message = str(raw.message), canStart = str(raw.canStart);
  if (price == null || price === undefined || price < MIN_NAIRA || price > MAX_NAIRA) e.priceNaira = `Enter your price in naira (₦${MIN_NAIRA.toLocaleString("en-NG")} or more).`;
  if (message.length < 15) e.message = "Tell the customer what your price covers (at least 15 characters).";
  else if (message.length > 600) e.message = "Keep your message under 600 characters.";
  if (canStart.length > 60) e.canStart = "Keep this short, e.g. \"Tomorrow morning\".";
  if (hasPhoneNumber(message)) e.message = "Please don't share phone numbers in quotes. The customer gets your contact when they hire you.";
  if (Object.keys(e).length) return { ok: false, errors: e };
  return { ok: true, value: { priceNaira: price!, message, canStart: canStart || null } };
}

/** Can this artisan quote this job? Returns a reason when they can't (shown on the job page). */
export function quoteBlocker(args: {
  view: JobView; isOwnJob: boolean; offersService: boolean; sameState: boolean; quoteCount: number; alreadyQuoted: boolean;
}): string | null {
  if (args.view === "HIRED") return "The customer has already hired someone for this job.";
  if (args.view !== "OPEN") return "This job is no longer taking quotes.";
  if (args.isOwnJob) return "This is your own job.";
  if (!args.offersService) return "Add this service to your profile to quote for this job.";
  if (!args.sameState) return "This job is outside the state on your profile.";
  if (!args.alreadyQuoted && args.quoteCount >= MAX_QUOTES_PER_JOB) return "This job already has the most quotes allowed.";
  return null;
}

/** Text for the request created on hiring, so the job details carry over into the request chat. */
export function hiredRequestDescription(job: { title: string; description: string }, quote: { priceKobo: number; canStart: string | null }) {
  return `${job.title}\n\n${job.description}\n\nAgreed quote: ${naira(quote.priceKobo)}${quote.canStart ? ` · Can start: ${quote.canStart}` : ""}`.slice(0, 2000);
}
