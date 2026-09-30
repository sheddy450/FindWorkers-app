import type { VerificationType, VerificationStatus } from "@prisma/client";
const LABEL: Record<VerificationType, string> = {
  IDENTITY: "Identity Verified", PHONE: "Phone Verified", LOCATION: "Location Verified",
  BACKGROUND: "Background Checked", BUSINESS: "Business Verified",
};
// Background checks stay hidden until a real provider is integrated.
const BACKGROUND_CHECKS_ENABLED = process.env.NEXT_PUBLIC_BACKGROUND_CHECKS === "true";
type Rec = { type: VerificationType; status: VerificationStatus; expiresAt: Date | null };

/** Badge = APPROVED and not expired. Nothing else renders as verified. */
export function VerificationBadges({ records }: { records: Rec[] }) {
  const now = new Date();
  const active = records.filter((r) => r.status === "APPROVED" && (!r.expiresAt || r.expiresAt > now)
    && (r.type !== "BACKGROUND" || BACKGROUND_CHECKS_ENABLED));
  if (!active.length) return <p className="text-sm text-muted">Not yet verified</p>;
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Verification">
      {active.map((r) => (
        <li key={r.type} className="rounded-full bg-verified-soft px-3 py-1 text-sm font-medium text-verified">
          ✓ {LABEL[r.type]}
        </li>
      ))}
    </ul>
  );
}
