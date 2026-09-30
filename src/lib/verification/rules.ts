import type { VerificationStatus, VerificationType } from "@prisma/client";
/** Only these can be submitted by documents. PHONE needs an OTP provider; BACKGROUND needs a real screening provider. */
export const SUBMITTABLE: VerificationType[] = ["IDENTITY", "LOCATION", "BUSINESS"];
export const VALIDITY_MONTHS = 24;
export const canSubmit = (s: VerificationStatus) => s === "NONE" || s === "REJECTED" || s === "EXPIRED";
export const canDecide = (s: VerificationStatus) => s === "PENDING";
export const INFO: Record<string, { label: string; help: string }> = {
  IDENTITY: { label: "Identity", help: "A clear photo or scan of a government ID (NIN slip, driver's licence, voter's card or international passport)." },
  LOCATION: { label: "Location", help: "A document showing your work address, such as a utility bill or a shop lease." },
  BUSINESS: { label: "Business", help: "CAC registration or a trade association membership card. Skip this if you work on your own." },
};
