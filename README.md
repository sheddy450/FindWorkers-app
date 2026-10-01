Sheddy find worker app
# FindWorkers (Phase 1)
1. `cp .env.example .env` and fill `DATABASE_URL` (Postgres **with PostGIS**) and `NEXTAUTH_SECRET`.
2. `npm install`
3. `npx prisma migrate dev --name init` (the first migration must run `CREATE EXTENSION IF NOT EXISTS postgis;`, Prisma adds it via the `extensions` setting)
4. `npm run db:seed` (categories + optional admin; no fake artisans or reviews)
5. `npm run dev` and `npm test`

Provider keys are optional now. Unconfigured providers must report "not configured", never fake success.

## Phase 2 notes
- Set `STORAGE_PROVIDER="local"` for development. Uploaded documents go to `.private-uploads/` (git-ignored) and are only served through `/api/admin/verifications/:id/document`, which requires an admin and logs every view. Local storage is refused in production; implement an S3-compatible `StorageProvider` before launch.
- Create an admin with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`, then `npm run db:seed`.
- Flow to try: register as artisan → `/artisan/profile` → `/artisan/verification` (upload) → log in as admin → `/admin/verifications`.
