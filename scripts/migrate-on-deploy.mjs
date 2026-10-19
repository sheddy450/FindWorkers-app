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
// (a closed laptop, a cancelled build) can leave a connection holding that lock, and every later
// deploy then times out waiting for it. This SQL lists who holds the lock (printed in the build log)
// and ends holders that are clearly stuck: idle for 2+ minutes, or connected for 10+ minutes (a real
// migration of this app takes seconds). It always finishes by raising FW_LOCK_REPORT so `prisma db
// execute`, which can't print query results, shows the report in its error output.
const RELEASE_STALE_LOCK = `DO $fw$
DECLARE r record; info text := '';
BEGIN
  FOR r IN
    SELECT l.pid, a.usename, a.state, a.application_name AS app, a.client_addr::text AS addr,
           date_trunc('second', now() - a.backend_start) AS conn_age,
           date_trunc('second', now() - a.state_change) AS idle_for,
           left(regexp_replace(coalesce(a.query, ''), '\\s+', ' ', 'g'), 120) AS q
      FROM pg_locks l LEFT JOIN pg_stat_activity a ON a.pid = l.pid
     WHERE l.locktype = 'advisory' AND l.objid = 72707369 AND l.granted AND l.pid <> pg_backend_pid()
  LOOP
    info := info || format('[pid %s, user %s, state %s, app "%s", from %s, connected %s ago, unchanged for %s, last query "%s"] ',
      r.pid, r.usename, coalesce(r.state, '?'), coalesce(r.app, ''), coalesce(r.addr, '?'),
      coalesce(r.conn_age::text, '?'), coalesce(r.idle_for::text, '?'), r.q);
    -- A real migration of this app takes seconds. Anything idle for 2+ minutes, or connected for 10+ minutes, is stuck.
    IF (r.state IS DISTINCT FROM 'active' AND r.idle_for > interval '2 minutes') OR r.conn_age > interval '10 minutes' THEN
      BEGIN
        PERFORM pg_terminate_backend(r.pid);
        info := info || '-> ended it. ';
      EXCEPTION WHEN OTHERS THEN
        info := info || '-> could not end it: ' || SQLERRM || '. ';
      END;
    ELSE
      info := info || '-> left alone (it was busy within the last 2 minutes, so it may be a migration that is running now). ';
    END IF;
  END LOOP;
  RAISE EXCEPTION 'FW_LOCK_REPORT %', CASE WHEN info = '' THEN 'nobody holds the migration lock right now.' ELSE info END;
END
$fw$;`;

function releaseStaleLock() {
  console.log("[migrate] Another connection is holding the migration lock. Checking who, and releasing it if it's stuck ...");
  const k = run(["db", "execute", "--stdin", "--url", url], RELEASE_STALE_LOCK);
  const all = `${k.stdout}\n${k.stderr}`;
  const m = all.match(/FW_LOCK_REPORT\s+([^\n]*)/);
  console.log(`[migrate] Lock report: ${m ? m[1].trim() : all.trim().split("\n").slice(-6).join(" | ")}`);
}

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
    releaseStaleLock();
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
