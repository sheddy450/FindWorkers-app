"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { NUDGE_DELAY_MS, NUDGE_STORAGE_KEY, dismissedRecently, type Nudge } from "@/lib/pro/nudge-shared";
import { CONSENT_EVENT, PIXEL_ID, readConsent, track } from "@/lib/meta/pixel";

/**
 * "Go Pro" invitation for artisans on the home page. The server decides eligibility (see
 * src/lib/pro/nudge.ts); this decides timing: at most once a week, ~2 s after the page settles,
 * never while the cookie banner is open. A bottom sheet on phones, a small card on larger screens.
 */
export function ProNudge({ nudge, price, days }: { nudge: Nudge; price: string; days: number }) {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const before = useRef<Element | null>(null);

  useEffect(() => {
    let stored: string | null = null;
    try { stored = localStorage.getItem(NUDGE_STORAGE_KEY); } catch { /* private mode: show it */ }
    if (dismissedRecently(stored)) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => { timer = setTimeout(() => setOpen(true), NUDGE_DELAY_MS); };
    // The cookie banner is showing: wait until the visitor has answered it.
    if (PIXEL_ID && readConsent() === null) {
      const onChoice = () => { window.removeEventListener(CONSENT_EVENT, onChoice); start(); };
      window.addEventListener(CONSENT_EVENT, onChoice);
      return () => { window.removeEventListener(CONSENT_EVENT, onChoice); clearTimeout(timer); };
    }
    start();
    return () => clearTimeout(timer);
  }, []);

  const close = useCallback(() => {
    try { localStorage.setItem(NUDGE_STORAGE_KEY, String(Date.now())); } catch { /* ignore */ }
    setOpen(false);
    (before.current as HTMLElement | null)?.focus?.();
  }, []);

  useEffect(() => {
    if (!open) return;
    before.current = document.activeElement;
    heading.current?.focus();
    track("ViewContent", { content_name: "pro_nudge", content_category: nudge.kind });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "Tab") { // keep focus inside the pop-up
        const els = dialog.current?.querySelectorAll<HTMLElement>("a[href], button");
        if (!els?.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && (document.activeElement === first || document.activeElement === heading.current)) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, nudge.kind]);

  if (!open) return null;
  const renew = nudge.kind === "renew";
  const title = renew ? `Your Pro plan ends in ${nudge.daysLeft} day${nudge.daysLeft === 1 ? "" : "s"}` : "Get seen first by customers";
  const body = renew
    ? "Renew now to stay in the Featured spot above search results and on the home page. Paying early adds days, so you lose nothing."
    : "Go Pro and appear in the Featured spot above search results and on the home page, where customers look first.";

  return (
    <div className="fixed inset-0 z-[75] flex items-end justify-center px-3 pb-[5.5rem] sm:items-center sm:pb-0">
      <button type="button" aria-label="Close" tabIndex={-1} onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-ink/30" />
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="pro-nudge-title" aria-describedby="pro-nudge-body"
        className="fw-enter relative w-full max-w-md rounded-[20px] bg-white p-5 text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] ring-1 ring-line">
        <button type="button" onClick={close} aria-label="Close"
          className="absolute right-3 top-3 grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-paper hover:text-ink">
          <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <span className="inline-flex items-center gap-1 rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-ink shadow-sm">★ Featured</span>
        <h2 ref={heading} id="pro-nudge-title" tabIndex={-1} className="mt-3 pr-10 text-2xl font-bold tracking-tight outline-none">{title}</h2>
        <p id="pro-nudge-body" className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
        <p className="mt-3 text-sm"><span className="text-lg font-bold text-ink">{price}</span> <span className="text-muted">for {days} days</span></p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <button type="button" onClick={close} className="min-h-12 rounded-full border border-line bg-white px-4 font-semibold hover:bg-paper">Not now</button>
          <Link href="/artisan/pro" onClick={() => { try { localStorage.setItem(NUDGE_STORAGE_KEY, String(Date.now())); } catch { /* ignore */ } }}
            className="flex min-h-12 items-center justify-center rounded-full bg-highlight px-4 font-semibold text-ink shadow-soft hover:brightness-105">
            {renew ? "Renew Pro" : "Go Pro"}
          </Link>
        </div>
        <p className="mt-3 text-center text-xs text-muted">Featured spots are shared fairly among Pro artisans who match a customer&apos;s search.</p>
      </div>
    </div>
  );
}
