/**
 * Self-service account deletion: the rules, kept pure so they're unit-tested.
 *
 * The user row is NOT removed (reviews, requests, messages and payments reference it). Instead every
 * personal detail is wiped and the account can never log in again. What happens to each kind of data:
 *
 * removed      name, email, phone, password, notifications, reset tokens, blocks, review votes;
 *              artisans: public profile details, services, availability, work photos, ID documents
 *              (database rows and stored files), daily stats
 * cancelled    requests still pending (the other person is notified); open jobs are closed (artisans
 *              who quoted are notified); an artisan's unanswered quotes are withdrawn
 * anonymised   reviews they wrote stay, shown as "Former customer" so artisans keep their ratings;
 *              messages and payment records stay without the person's details; request addresses
 *              and job descriptions are replaced
 */
export type DeletableRole = "CUSTOMER" | "ARTISAN";

export const canSelfDelete = (role: string): role is DeletableRole => role === "CUSTOMER" || role === "ARTISAN";

export const FORMER_NAME: Record<DeletableRole, string> = { CUSTOMER: "Former customer", ARTISAN: "Former artisan" };

/** Requests that are still in progress get cancelled; finished ones are left as history. */
export const PENDING_REQUEST_STATUSES = ["REQUESTED", "ACCEPTED", "ON_THE_WAY"] as const;

export const REMOVED_ADDRESS = "Removed (account deleted)";
export const REMOVED_JOB = { title: "Job removed", description: "The customer deleted their account.", lga: "" } as const;

/** Besides their password, the user must tick "I understand this can't be undone" (sent as `confirm: true`). */
export const confirmed = (v: unknown) => v === true;

/** A password hash no password can ever match (not even a valid hash format). */
export const lockedPasswordHash = (random: string) => `!deleted!${random}`;
