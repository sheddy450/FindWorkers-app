import type { RequestStatus } from "@prisma/client";
/** Allowed transitions, and which side (customer or artisan) may trigger each one. */
export const TRANSITIONS: Record<RequestStatus, { to: RequestStatus; by: "CUSTOMER" | "ARTISAN" }[]> = {
  REQUESTED: [{ to: "ACCEPTED", by: "ARTISAN" }, { to: "REJECTED", by: "ARTISAN" }, { to: "CANCELLED", by: "CUSTOMER" }],
  ACCEPTED: [{ to: "ON_THE_WAY", by: "ARTISAN" }, { to: "CANCELLED", by: "CUSTOMER" }],
  ON_THE_WAY: [{ to: "COMPLETED", by: "CUSTOMER" }],
  COMPLETED: [{ to: "REVIEWED", by: "CUSTOMER" }],
  REVIEWED: [], REJECTED: [], CANCELLED: [], EXPIRED: [],
};
export const STEPS: RequestStatus[] = ["REQUESTED", "ACCEPTED", "ON_THE_WAY", "COMPLETED", "REVIEWED"];
export const LABEL: Record<RequestStatus, string> = { REQUESTED: "Requested", ACCEPTED: "Accepted", ON_THE_WAY: "On the way",
  COMPLETED: "Completed", REVIEWED: "Reviewed", REJECTED: "Declined", CANCELLED: "Cancelled", EXPIRED: "Expired" };
