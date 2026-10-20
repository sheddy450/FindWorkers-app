"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CONSENT_OPEN_EVENT, PIXEL_ID, readConsent, writeConsent } from "@/lib/meta/pixel";

/**
 * Cookie choice, asked once (NDPA 2023: tracking only with consent). Nothing is sent to Meta until
 * "Accept"; "No thanks" is just as easy and the site works the same either way. The footer's
 * "Cookie choices" link brings this back. Hidden when no Pixel is configured (there's nothing to ask).
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!PIXEL_ID) return;
    if (readConsent() === null) setOpen(true);
    const show = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN_EVENT, show);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, show);
  }, []);
  if (!open) return null;
  const choose = (v: "granted" | "denied") => { writeConsent(v); setOpen(false); };
  return (
    <section role="region" aria-label="Cookie choices"
      className="fixed inset-x-3 bottom-[5.5rem] z-[70] mx-auto max-w-lg rounded-[20px] bg-white p-4 text-ink shadow-[0_20px_50px_-20px_rgba(0,0,0,0.45)] ring-1 ring-line sm:bottom-6">
      <p className="text-[15px] leading-relaxed">
        Can we use cookies from Meta (Facebook and Instagram) to measure our ads and show FindWorkers to people who need it?
        The site works the same either way. <Link href="/privacy#cookies" className="font-semibold text-brand underline underline-offset-2">Learn more</Link>
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" onClick={() => choose("denied")} className="min-h-11 rounded-full border border-line bg-white px-4 font-semibold hover:bg-paper">No thanks</button>
        <button type="button" onClick={() => choose("granted")} className="min-h-11 rounded-full bg-brand px-4 font-semibold text-white hover:bg-brand-700">Accept</button>
      </div>
    </section>
  );
}

/** Footer link that re-opens the banner, so people can change their mind at any time. */
export function CookieChoicesLink() {
  if (!PIXEL_ID) return null;
  return (
    <button type="button" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN_EVENT))} className="hover:text-brand">Cookie choices</button>
  );
}
