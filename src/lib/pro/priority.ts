/**
 * Pro priority rules (pure, no database). Two perks:
 *  1. Search: every Pro artisan who matches a customer's search is shown first, in the labelled
 *     Featured section. The order of everyone else is unchanged (see src/app/api/search/route.ts).
 *  2. New jobs: Pro artisans are alerted and can quote at once; free artisans get the alert and can
 *     quote PRO_HEAD_START_MIN minutes later. If no Pro artisan covers the job, there's no wait,
 *     so a customer never waits for nobody.
 */
export const PRO_HEAD_START_MIN = 30;

/** When a new job opens to free artisans; null means at once (no Pro artisan matched it). */
export function openToAllAt(proMatches: number, now = new Date()): Date | null {
  return proMatches > 0 ? new Date(now.getTime() + PRO_HEAD_START_MIN * 60_000) : null;
}

/** Whether this artisan can see (and quote for) a job right now. */
export function canSeeJob(a: { isPro: boolean; openToAllAt: Date | null | undefined; now?: Date }): boolean {
  return a.isPro || !a.openToAllAt || a.openToAllAt.getTime() <= (a.now ?? new Date()).getTime();
}

/** "3:40 pm", Lagos time. */
export const lagosTime = (d: Date) =>
  new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Africa/Lagos" }).format(d).toLowerCase();

/** Shown to a free artisan who opens a job still in the Pro head start. */
export const proFirstLookMessage = (until: Date) =>
  `Pro artisans get first look at new jobs. You can quote for this one from ${lagosTime(until)}.`;

/** Pro first (each group keeps its existing order). Returns the Pro group and everyone else. */
export function proFirst<T>(rows: T[], isProRow: (r: T) => boolean): { pro: T[]; rest: T[] } {
  const pro: T[] = [], rest: T[] = [];
  for (const r of rows) (isProRow(r) ? pro : rest).push(r);
  return { pro, rest };
}
