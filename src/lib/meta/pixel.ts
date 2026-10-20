"use client";
import { CONSENT_COOKIE, EVENT_ID_HEADER, consentFrom, type Consent, type MetaEventName } from "./rules";

/**
 * Browser side of Meta tracking. Every function is a no-op until the visitor accepts cookies and the
 * Pixel has loaded, so calling these from forms and buttons is always safe.
 */
declare global {
  interface Window { fbq?: (...args: unknown[]) => void; _fbq?: unknown; __fwLastPageView?: string }
}

export const PIXEL_ID = (process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "").trim();
export const CONSENT_EVENT = "fw:consent";       // fired after the visitor chooses
export const CONSENT_OPEN_EVENT = "fw:consent-open"; // "Cookie choices" in the footer re-opens the banner

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  return consentFrom(document.cookie);
}

export function writeConsent(v: Consent) {
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${CONSENT_COOKIE}=${v}; Path=/; Max-Age=${60 * 60 * 24 * 180}; SameSite=Lax${secure}`;
  window.fbq?.("consent", v === "granted" ? "grant" : "revoke");
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: v }));
}

export function openConsentChoices() { window.dispatchEvent(new Event(CONSENT_OPEN_EVENT)); }

/** A fresh id shared by the browser event and its server copy, so Meta counts the action once. */
export function newEventId(prefix: string): string {
  const rand = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}.${rand}`;
}

/** Headers to add to a fetch() so the API can send the same event to Meta from the server. */
export const eventIdHeader = (eventId: string) => ({ [EVENT_ID_HEADER]: eventId });

export function track(name: MetaEventName, params: Record<string, unknown> = {}, eventId?: string) {
  if (typeof window === "undefined" || !window.fbq || readConsent() !== "granted") return;
  if (eventId) window.fbq("track", name, params, { eventID: eventId });
  else window.fbq("track", name, params);
}

/** Before a full page load (window.location = …), give the Pixel a moment to send. */
export function flushPixel(ms = 300): Promise<void> {
  if (typeof window === "undefined" || !window.fbq || readConsent() !== "granted") return Promise.resolve();
  return new Promise((r) => setTimeout(r, ms));
}
