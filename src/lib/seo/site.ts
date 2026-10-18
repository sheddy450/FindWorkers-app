/** SEO helpers. Pure (no DB, no React) so they're unit-tested. */

export const SITE_NAME = "FindWorkers";
/** Canonical address. Override with NEXT_PUBLIC_SITE_URL (e.g. on a staging domain). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://findworkersapp.com").replace(/\/+$/, "");
export const SITE_DESCRIPTION = "Find verified plumbers, electricians, mechanics, tailors and more near you in Nigeria. Compare real reviews and prices in naira, then call, WhatsApp or book in a few taps.";
export const SITE_TITLE = `${SITE_NAME}: trusted artisans near you in Nigeria`;

/**
 * Open Graph fields for a page. Next.js replaces (doesn't merge) a parent's openGraph object, so
 * every page builds its own from this, keeping siteName and locale on all of them.
 */
export function og(fields: { title: string; description: string; url: string; type?: "website" | "profile" }) {
  return { siteName: SITE_NAME, locale: "en_NG", type: fields.type ?? "website", title: fields.title, description: fields.description, url: fields.url };
}

export const absoluteUrl = (path = "/") => `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;

/** "FCT (Abuja)" reads as "Abuja" in titles and headings: that's what people type into Google. */
export const stateLabel = (state: string) => (state === "FCT (Abuja)" ? "Abuja" : state);

/** URL-safe state name: "Akwa Ibom" → "akwa-ibom", "FCT (Abuja)" → "abuja". */
export function stateSlug(state: string): string {
  return stateLabel(state).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

/** Finds the stored state name for a URL slug, or null if it isn't one of the given states. */
export function stateFromSlug(slug: string, states: readonly string[]): string | null {
  return states.find((s) => stateSlug(s) === slug.toLowerCase()) ?? null;
}

/** Title for a service page: "Electrician in Lagos" / "Electrician in Nigeria". Matches how people search. */
export function serviceHeading(category: string, state?: string | null): string {
  return `${category} in ${state ? stateLabel(state) : "Nigeria"}`;
}

export function serviceDescription(category: string, state: string | null, count: number): string {
  const where = state ? stateLabel(state) : "Nigeria";
  const n = count > 0 ? `Compare ${count} ${category.toLowerCase()} ${count === 1 ? "artisan" : "artisans"}` : `Find a ${category.toLowerCase()}`;
  return `${n} in ${where} on FindWorkers. See verified badges, real reviews and prices in naira, then call, WhatsApp or book in a few taps.`;
}

/** Trims text to a meta-description length at a word boundary. */
export function clip(text: string, max = 155): string {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20))}…`;
}

/**
 * Serialises structured data for a <script type="application/ld+json"> tag. Escapes "<" so
 * user-entered text (e.g. a business name containing "</script>") can't break out of the tag.
 */
export function jsonLdString(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}
