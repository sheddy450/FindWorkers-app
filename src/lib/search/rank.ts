/** Scoring weights. Sponsorship, if ever added, must be a separate labeled slot — never blended into this score. */
export const WEIGHTS = { proximity: 0.35, rating: 0.20, verification: 0.15, reviewVolume: 0.10, availability: 0.10, relevance: 0.10 };
const BADGE_WEIGHT = { IDENTITY: 0.4, PHONE: 0.2, LOCATION: 0.2, BUSINESS: 0.2, BACKGROUND: 0 } as const;

export function bayesianRating(avg: number, count: number, priorMean = 4.0, priorWeight = 5) {
  return (priorWeight * priorMean + count * avg) / (priorWeight + count);
}
export function verificationScore(approvedTypes: string[]) {
  return Math.min(1, approvedTypes.reduce((s, t) => s + (BADGE_WEIGHT[t as keyof typeof BADGE_WEIGHT] ?? 0), 0));
}
export function availabilityScore(a: "AVAILABLE_NOW" | "BY_SCHEDULE" | "UNAVAILABLE") {
  return a === "AVAILABLE_NOW" ? 1 : a === "BY_SCHEDULE" ? 0.5 : 0;
}
