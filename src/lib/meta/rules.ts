/**
 * Meta (Facebook/Instagram) tracking: pure rules shared by the browser and the server.
 * No imports from Node or React, so everything here is unit-tested.
 *
 * Privacy: nothing is sent to Meta unless the visitor tapped "Accept" on the cookie banner
 * (consent cookie = "granted"). Email and phone go to Meta only as SHA-256 hashes.
 */

export const CONSENT_COOKIE = "fw_consent";
export type Consent = "granted" | "denied";

/** Header the browser uses to hand its event id to our API, so Meta can match browser + server copies. */
export const EVENT_ID_HEADER = "x-fw-event-id";

/** Events we send. Standard Meta event names, so they can be used as campaign optimisation goals. */
export type MetaEventName = "PageView" | "Lead" | "CompleteRegistration" | "Contact" | "Schedule" | "Search" | "ViewContent";

/** Reads one cookie from a Cookie header (server) or document.cookie (browser). */
export function cookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    if (part.slice(0, i).trim() === name) {
      const v = part.slice(i + 1).trim();
      try { return decodeURIComponent(v); } catch { return v; }
    }
  }
  return null;
}

export function consentFrom(header: string | null | undefined): Consent | null {
  const v = cookieValue(header, CONSENT_COOKIE);
  return v === "granted" || v === "denied" ? v : null;
}

/** Event ids come from the browser, so only accept short, plain ones. */
export function cleanEventId(v: string | null | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return /^[A-Za-z0-9._:-]{8,100}$/.test(t) ? t : null;
}

/** Meta's format: lower-case, no spaces. */
export function normalizeEmail(email: string | null | undefined): string | null {
  const e = email?.trim().toLowerCase();
  return e && e.includes("@") ? e : null;
}

/**
 * Meta's format: digits only, with the country code and no leading "+" or "0".
 * Nigerian numbers in any common form (0803…, 803…, +234 803…, 234803…) become 234803….
 */
export function normalizePhoneNG(phone: string | null | undefined): string | null {
  const d = (phone ?? "").replace(/\D/g, "");
  const m = d.match(/^(?:234|0)?([789][01]\d{8})$/);
  return m ? `234${m[1]}` : null;
}

export type ServerEventInput = {
  name: MetaEventName;
  eventId: string;
  timeSec: number;
  sourceUrl?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null;
  fbc?: string | null;
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
  customData?: Record<string, string | number | boolean | string[] | undefined>;
};

/**
 * Builds one Conversions API event. `hash` is SHA-256 hex (passed in, so this file stays pure).
 * Identifiers Meta wants hashed (em, ph, external_id) are hashed; fbp/fbc/IP/user agent are not.
 */
export function buildServerEvent(e: ServerEventInput, hash: (s: string) => string) {
  const em = normalizeEmail(e.email), ph = normalizePhoneNG(e.phone);
  const user_data: Record<string, string | string[]> = {};
  if (em) user_data.em = [hash(em)];
  if (ph) user_data.ph = [hash(ph)];
  if (e.externalId) user_data.external_id = [hash(e.externalId)];
  if (e.ip && e.ip !== "unknown") user_data.client_ip_address = e.ip;
  if (e.userAgent) user_data.client_user_agent = e.userAgent;
  if (e.fbp) user_data.fbp = e.fbp;
  if (e.fbc) user_data.fbc = e.fbc;
  const custom_data = Object.fromEntries(Object.entries(e.customData ?? {}).filter(([, v]) => v !== undefined && v !== ""));
  return {
    event_name: e.name,
    event_time: e.timeSec,
    event_id: e.eventId,
    action_source: "website" as const,
    ...(e.sourceUrl ? { event_source_url: e.sourceUrl } : {}),
    user_data,
    ...(Object.keys(custom_data).length ? { custom_data } : {}),
  };
}
