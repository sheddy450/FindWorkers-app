"use client";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { PRO_POPUP } from "@/lib/pro/popup-config";
import { POPUP_STORAGE_KEY } from "@/lib/pro/nudge-shared";
import { CONSENT_EVENT, PIXEL_ID, readConsent, track } from "@/lib/meta/pixel";

/**
 * The Pro ad, as a pop-up on the artisan dashboard. The server decides who gets it (src/lib/pro/nudge.ts:
 * artisans without Pro, at most once a week per account). This handles the pop-up itself: it waits for
 * the cookie banner, closes with ×, "Not now", Escape or a tap outside, and records the close on the
 * account so it holds on every device. Image, alt text and on/off switch: src/lib/pro/popup-config.ts.
 */
export function ProPopup() {
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDivElement>(null);
  const before = useRef<Element | null>(null);
  const { image, campaign, snoozeDays } = PRO_POPUP;

  useEffect(() => {
    // Closed on this device already (the account record may still be on its way): stay closed.
    try {
      const saved = JSON.parse(localStorage.getItem(POPUP_STORAGE_KEY) ?? "null") as { campaign?: string; t?: number } | null;
      if (saved?.campaign === campaign && typeof saved.t === "number" && Date.now() - saved.t < snoozeDays * 86_400_000) return;
    } catch { /* private mode or junk: carry on */ }
    let timer: ReturnType<typeof setTimeout> | undefined;
    const start = () => { timer = setTimeout(() => setOpen(true), 400); };
    // The cookie banner is showing: wait until the visitor has answered it, so two pop-ups never stack.
    if (PIXEL_ID && readConsent() === null) {
      const onChoice = () => { window.removeEventListener(CONSENT_EVENT, onChoice); start(); };
      window.addEventListener(CONSENT_EVENT, onChoice);
      return () => { window.removeEventListener(CONSENT_EVENT, onChoice); clearTimeout(timer); };
    }
    start();
    return () => clearTimeout(timer);
  }, [campaign, snoozeDays]);

  /** Remember the close on this device and on the account (keepalive: survives going to the Pro page). */
  const remember = useCallback(() => {
    try { localStorage.setItem(POPUP_STORAGE_KEY, JSON.stringify({ campaign, t: Date.now() })); } catch { /* ignore */ }
    fetch("/api/artisan/pro-popup", { method: "POST", keepalive: true }).catch(() => { /* the device copy still holds */ });
  }, [campaign]);

  const close = useCallback(() => {
    remember();
    setOpen(false);
    (before.current as HTMLElement | null)?.focus?.();
  }, [remember]);

  useEffect(() => {
    if (!open) return;
    before.current = document.activeElement;
    dialog.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus();
    track("ViewContent", { content_name: "pro_popup", content_category: campaign });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // the page behind doesn't scroll while it's open
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "Tab") { // keep focus inside the pop-up
        const els = dialog.current?.querySelectorAll<HTMLElement>("a[href], button");
        if (!els?.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; };
  }, [open, close, campaign]);

  // Rendered (hidden) from the start, so the image is already loaded when the pop-up opens.
  return (
    <div className={open ? "fixed inset-0 z-[80] flex items-center justify-center overflow-hidden p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(1rem,env(safe-area-inset-top))]" : "hidden"}>
      <button type="button" aria-label="Close" tabIndex={-1} onClick={close} className="absolute inset-0 h-full w-full cursor-default bg-ink/60 backdrop-blur-[2px]" />
      <div ref={dialog} role="dialog" aria-modal="true" aria-label="FindWorkers Pro"
        className="fw-enter fw-pro-popup relative rounded-[22px] bg-white p-2.5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)]">
        <Image src={image.src} width={image.width} height={image.height} alt={image.alt} priority
          sizes="(max-width: 480px) 92vw, 440px" className="block h-auto w-full rounded-[14px]" />
        <button type="button" onClick={close} aria-label="Close"
          className="absolute -right-3 -top-3 grid h-10 w-10 place-items-center rounded-full bg-white text-ink shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-1 ring-line hover:bg-paper">
          <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
        <div className="mt-2.5 grid grid-cols-[auto_1fr] gap-2">
          <button type="button" onClick={close} className="min-h-12 rounded-full border border-line bg-white px-5 font-semibold text-ink hover:bg-paper">Not now</button>
          <Link href="/artisan/pro" data-autofocus onClick={remember}
            className="flex min-h-12 items-center justify-center rounded-full bg-[#FFC53D] px-4 font-bold text-ink shadow-[0_3px_0_#B7791F] transition hover:brightness-105 active:translate-y-px active:shadow-[0_2px_0_#B7791F] motion-reduce:transition-none">
            Go Pro
          </Link>
        </div>
      </div>
    </div>
  );
}
