import { createHash } from "node:crypto";
import { after } from "next/server";
import { clientIp } from "@/lib/security/rate-limit-rules";
import { EVENT_ID_HEADER, buildServerEvent, cleanEventId, consentFrom, cookieValue, type MetaEventName } from "@/lib/meta/rules";

/**
 * Meta Conversions API: sends key actions from our server, so they still count when the browser
 * Pixel is blocked (ad blockers, iOS, slow networks). Uses the browser's event id, so Meta keeps one copy.
 *
 * Sends nothing unless: META_CAPI_ACCESS_TOKEN and NEXT_PUBLIC_META_PIXEL_ID are set, AND the visitor
 * accepted cookies. Runs after the response is sent (next/server `after`), so it never slows a request,
 * and a Meta outage can't break sign-up, job posting or booking.
 */
const API_VERSION = "v26.0";
const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function sendMetaEvent(req: Request, ev: {
  name: MetaEventName;
  user: { id?: string | null; email?: string | null; phone?: string | null };
  customData?: Record<string, string | number | boolean | string[] | undefined>;
}) {
  const pixel = process.env.NEXT_PUBLIC_META_PIXEL_ID?.trim(), token = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  if (!pixel || !token) return;
  const cookies = req.headers.get("cookie");
  if (consentFrom(cookies) !== "granted") return;

  const event = buildServerEvent({
    name: ev.name,
    // Same id as the browser event (deduplication). Without one, the server copy simply counts on its own.
    eventId: cleanEventId(req.headers.get(EVENT_ID_HEADER)) ?? `srv.${crypto.randomUUID()}`,
    timeSec: Math.floor(Date.now() / 1000),
    sourceUrl: req.headers.get("referer"),
    ip: clientIp((n) => req.headers.get(n)),
    userAgent: req.headers.get("user-agent"),
    fbp: cookieValue(cookies, "_fbp"),
    fbc: cookieValue(cookies, "_fbc"),
    email: ev.user.email, phone: ev.user.phone, externalId: ev.user.id,
    customData: ev.customData,
  }, sha256);

  const testCode = process.env.META_TEST_EVENT_CODE?.trim();
  after(async () => {
    try {
      const res = await fetch(`https://graph.facebook.com/${API_VERSION}/${encodeURIComponent(pixel)}/events?access_token=${encodeURIComponent(token)}`, {
        method: "POST", headers: { "content-type": "application/json" }, cache: "no-store",
        body: JSON.stringify({ data: [event], ...(testCode ? { test_event_code: testCode } : {}) }),
      });
      if (!res.ok) console.error("[meta] conversions api", res.status, (await res.text()).slice(0, 300));
    } catch (e) { console.error("[meta] conversions api failed", e); }
  });
}
