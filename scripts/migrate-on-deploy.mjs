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

const r = spawnSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: ["ignore", "pipe", "pipe"], encoding: "utf8",
  env: { ...process.env, DATABASE_URL: url },
});
process.stdout.write(r.stdout ?? "");
process.stderr.write(r.stderr ?? "");

if (r.status !== 0) {
  const out = `${r.stdout}\n${r.stderr}`;
  console.error("\n[migrate] Migrations failed, so this deploy was stopped. The previous version is still live.");
  if (out.includes("P3005")) {
    console.error("[migrate] P3005: the database has tables but no Prisma migration history. Mark the migrations that are");
    console.error("[migrate] already applied with `npx prisma migrate resolve --applied <name>`, then redeploy.");
  } else if (/P1001|P1017|ECONNREFUSED|timed out/i.test(out)) {
    console.error("[migrate] Couldn't reach the database. If you use a connection pooler other than Neon's, add a direct");
    console.error("[migrate] connection string in Vercel as MIGRATE_DATABASE_URL (Production only), then redeploy.");
  }
  process.exit(r.status ?? 1);
}
console.log("[migrate] Database is up to date.");
