#!/usr/bin/env node
/**
 * Applies pending database migrations during PRODUCTION builds on Vercel, before the new code goes
 * live, so the database always has the tables the deployed code expects.
 *
 * - Production (VERCEL_ENV=production): runs `prisma migrate deploy`. If it fails, the build fails
 *   and the previous version stays live: better than shipping code that can't find its tables.
 * - Preview and local builds: skipped. Previews share the production database, so an unmerged
 *   branch must never change it.
 *
 * Connection: migrations need a direct (non-pooled) connection. Uses MIGRATE_DATABASE_URL if set,
 * otherwise DATABASE_URL, turning a Neon pooled host ("-pooler") into its direct host.
 */
import { spawnSync } from "node:child_process";

const env = process.env.VERCEL_ENV;
if (env !== "production") {
  console.log(`[migrate] Skipping database migrations (VERCEL_ENV=${env ?? "unset"}; only production deploys migrate).`);
  process.exit(0);
}

const source = process.env.MIGRATE_DATABASE_URL?.trim() || process.env.DATABASE_URL?.trim();
if (!source) {
  console.error("[migrate] DATABASE_URL is not set for Production in Vercel, so migrations can't run.");
  process.exit(1);
}

export function directUrl(url) {
  try {
    const u = new URL(url);
    u.hostname = u.hostname.replace("-pooler.", ".");           // Neon: ep-x-pooler.region... -> ep-x.region...
    u.searchParams.delete("pgbouncer");                           // pgbouncer mode isn't for migrations
    return u.toString();
  } catch { return url; }
}

const url = process.env.MIGRATE_DATABASE_URL?.trim() ? source : directUrl(source);
const host = (() => { try { return new URL(url).host; } catch { return "(unparseable URL)"; } })();
console.log(`[migrate] Production deploy: applying pending migrations to ${host} ...`);

const run = (args, input) => spawnSync("npx", ["prisma", ...args], {
  input, stdio: [input ? "pipe" : "ignore", "pipe", "pipe"], encoding: "utf8",
  env: { ...process.env, DATABASE_URL: url },
});

// Prisma holds Postgres advisory lock 72707369 while migrating. A migration run that died or hung
// (a closed laptop, a cancelled build) can leave a connection sitting idle with that lock, and every
// later deploy then times out waiting for it. This ends only *idle* holders that have been quiet for
// 2+ minutes, so a migration that is actually running right now is never interrupted.
const RELEASE_STALE_LOCK = `SELECT pg_terminate_backend(l.pid)
  FROM pg_locks l JOIN pg_stat_activity a ON a.pid = l.pid
 WHERE l.locktype = 'advisory' AND l.objid = 72707369 AND l.granted
   AND l.pid <> pg_backend_pid() AND a.state <> 'active'
   AND a.state_change < now() - interval '2 minutes';`;

const sleep = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const isLock = (out) => /advisory lock/i.test(out);
const isUnreachable = (out) => /P1001|P1002|P1017|ECONNREFUSED|timed out/i.test(out);

let r, out = "";
for (let attempt = 1; attempt <= 3; attempt++) {
  r = run(["migrate", "deploy"]);
  out = `${r.stdout}\n${r.stderr}`;
  process.stdout.write(r.stdout ?? "");
  process.stderr.write(r.stderr ?? "");
  if (r.status === 0 || attempt === 3 || !(isLock(out) || isUnreachable(out))) break;
  if (isLock(out)) {
    console.log("[migrate] Another connection is holding the migration lock. Releasing it if it's a stale, idle one ...");
    const k = run(["db", "execute", "--stdin", "--url", url], RELEASE_STALE_LOCK);
    if (k.status !== 0) process.stderr.write(k.stderr ?? "");
  } else {
    console.log("[migrate] Database didn't answer in time (it may have been asleep). Retrying ...");
  }
  sleep(attempt * 5000);
}

if (r.status !== 0) {
  console.error("\n[migrate] Migrations failed, so this deploy was stopped. The previous version is still live.");
  if (out.includes("P3005")) {
    console.error("[migrate] P3005: the database has tables but no Prisma migration history. Mark the migrations that are");
    console.error("[migrate] already applied with `npx prisma migrate resolve --applied <name>`, then redeploy.");
  } else if (isLock(out)) {
    console.error("[migrate] The migration lock is still held by another database connection. In the Neon SQL editor, run:");
    console.error("[migrate]   SELECT pid, state, state_change, application_name FROM pg_stat_activity");
    console.error("[migrate]    WHERE pid IN (SELECT pid FROM pg_locks WHERE locktype = 'advisory' AND objid = 72707369);");
    console.error("[migrate] then end it with  SELECT pg_terminate_backend(<pid>);  and redeploy.");
  } else if (isUnreachable(out)) {
    console.error("[migrate] Couldn't reach the database. If you use a connection pooler other than Neon's, add a direct");
    console.error("[migrate] connection string in Vercel as MIGRATE_DATABASE_URL (Production only), then redeploy.");
  }
  process.exit(r.status ?? 1);
}
console.log("[migrate] Database is up to date.");
