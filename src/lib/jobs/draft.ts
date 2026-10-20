/**
 * A job typed by a visitor who isn't logged in yet: kept in this browser while they create an
 * account (or log in), then put back into the form. Pure helpers + a thin localStorage wrapper.
 */
export const DRAFT_KEY = "fw:job-draft:v1";
export const DRAFT_MAX_AGE_MS = 24 * 60 * 60 * 1000;
export const JOB_RESUME_PATH = "/jobs/new?resume=1";

export type JobDraft = Record<string, string>;

/** Only same-site paths: "//evil.com" also starts with "/" but leaves the site. */
export function safeNext(next: string | null | undefined): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return null;
  if (next.startsWith("/login") || next.startsWith("/register")) return null;
  return next;
}

export function encodeDraft(fields: JobDraft, now = Date.now()): string {
  return JSON.stringify({ savedAt: now, fields });
}

/** Returns the fields, or null if missing, broken or older than a day. Only string values survive. */
export function decodeDraft(raw: string | null, now = Date.now()): JobDraft | null {
  if (!raw) return null;
  try {
    const d = JSON.parse(raw) as { savedAt?: unknown; fields?: unknown };
    if (typeof d.savedAt !== "number" || now - d.savedAt > DRAFT_MAX_AGE_MS || now < d.savedAt - 60_000) return null;
    if (!d.fields || typeof d.fields !== "object") return null;
    const out: JobDraft = {};
    for (const [k, v] of Object.entries(d.fields as Record<string, unknown>)) if (typeof v === "string") out[k] = v.slice(0, 2000);
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

export function saveDraft(fields: JobDraft) { try { localStorage.setItem(DRAFT_KEY, encodeDraft(fields)); } catch { /* private mode: they'll retype */ } }
export function loadDraft(): JobDraft | null { try { return decodeDraft(localStorage.getItem(DRAFT_KEY)); } catch { return null; } }
export function clearDraft() { try { localStorage.removeItem(DRAFT_KEY); } catch { /* ignore */ } }
