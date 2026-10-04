import { db } from "@/lib/db";
import { type Limit, retryAfterSec, windowStart } from "@/lib/security/rate-limit-rules";

export type RateResult = { ok: true } | { ok: false; retryAfterSec: number };

/**
 * Counts one attempt for `id` under `limit` and says whether it's allowed.
 *
 * Stored in Postgres (not in memory): Vercel runs many short-lived instances, so an in-memory
 * counter would reset constantly. The INSERT … ON CONFLICT is a single atomic statement, so
 * parallel requests can't slip past the limit.
 *
 * Fails open: if the counter itself errors (e.g. the migration hasn't been applied yet), the
 * request is allowed and the error is logged, so a limiter problem never locks everyone out.
 */
export async function hitLimit(limit: Limit, id: string): Promise<RateResult> {
  const now = Date.now() / 1000;
  const start = windowStart(now, limit.windowSec);
  const key = `${limit.name}:${id}`;
  try {
    const rows = await db.$queryRaw<{ count: number }[]>`
      INSERT INTO "RateLimitBucket" ("key", "windowStart", "count")
      VALUES (${key}, ${start}::bigint, 1)
      ON CONFLICT ("key", "windowStart") DO UPDATE SET "count" = "RateLimitBucket"."count" + 1
      RETURNING "count"`;
    if (Math.random() < 0.02) void cleanup(now);
    const count = Number(rows[0]?.count ?? 0);
    return count > limit.max ? { ok: false, retryAfterSec: retryAfterSec(now, limit.windowSec) } : { ok: true };
  } catch (e) {
    console.error("[rate-limit] counter unavailable, allowing request", limit.name, e);
    return { ok: true };
  }
}

/** Removes counters older than a day so the table stays small. */
async function cleanup(nowSec: number) {
  try {
    await db.$executeRaw`DELETE FROM "RateLimitBucket" WHERE "windowStart" < ${Math.floor(nowSec - 86_400)}::bigint`;
  } catch { /* best effort */ }
}
