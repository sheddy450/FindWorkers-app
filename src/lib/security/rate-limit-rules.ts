/** Rate-limit rules. Pure functions so they're unit-tested; the database counter lives in the service. */

export type Limit = { name: string; max: number; windowSec: number };

// Many Nigerian mobile users share one public IP (carrier NAT), so per-IP limits are generous and the
// tight limits are per account. A real person rarely mistypes a password 8 times in 15 minutes.
export const LIMITS = {
  loginPerAccount: { name: "login:acct", max: 8, windowSec: 15 * 60 },
  loginPerIp: { name: "login:ip", max: 60, windowSec: 15 * 60 },
  registerPerIp: { name: "register:ip", max: 10, windowSec: 60 * 60 },
  passwordChangePerUser: { name: "pwchange:user", max: 10, windowSec: 60 * 60 },
  contactRevealPerUser: { name: "contact:user", max: 40, windowSec: 60 * 60 },
} satisfies Record<string, Limit>;

/** Start of the fixed window containing `nowSec` (Unix seconds). */
export function windowStart(nowSec: number, windowSec: number): number {
  return Math.floor(nowSec / windowSec) * windowSec;
}

/** Seconds until the current window ends (when the counter resets). */
export function retryAfterSec(nowSec: number, windowSec: number): number {
  return windowStart(nowSec, windowSec) + windowSec - Math.floor(nowSec);
}

/** Minutes, rounded up, for messages like "try again in 12 minutes". */
export const minutesFrom = (sec: number) => Math.max(1, Math.ceil(sec / 60));

/** Normalises what someone typed to log in, so "Ada@X.com " and "ada@x.com" share one counter. */
export function accountKey(identifier: string, toE164: (s: string) => string | null): string {
  const id = identifier.trim();
  return id.includes("@") ? id.toLowerCase() : (toE164(id) ?? id.replace(/\s+/g, ""));
}

/**
 * The visitor's IP. On Vercel the first x-forwarded-for entry is the client (Vercel overwrites the
 * header, so it can't be spoofed there). Falls back to x-real-ip, then "unknown".
 */
export function clientIp(get: (name: string) => string | null | undefined): string {
  const xff = get("x-forwarded-for");
  const first = xff?.split(",")[0]?.trim();
  return first || get("x-real-ip")?.trim() || "unknown";
}
