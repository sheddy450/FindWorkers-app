-- Set when a user deletes their own account. The row stays (reviews, requests, messages and payments
-- point at it) but its personal details are wiped; see account-deletion.service.ts.
ALTER TABLE "User" ADD COLUMN "deletedAt" TIMESTAMP(3);
