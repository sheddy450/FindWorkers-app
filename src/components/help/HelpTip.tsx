"use client";
import { useEffect, useId, useRef, useState } from "react";
import { HELP, type HelpKey } from "@/lib/content/help";

/**
 * A small "?" button that explains something in two sentences. Tap or click to open; tap outside,
 * press Esc or tap again to close. Opens on whichever side has room, so it never runs off a phone screen.
 */
export function HelpTip({ topic, className = "", tone = "light" }: { topic: HelpKey; className?: string; tone?: "light" | "dark" }) {
  const { title, body } = HELP[topic];
  const [open, setOpen] = useState(false);
  const [align, setAlign] = useState<"left" | "right">("left");
  const id = useId();
  const wrap = useRef<HTMLSpanElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const r = btn.current?.getBoundingClientRect();
    if (r) setAlign(r.left + 272 > window.innerWidth - 12 ? "right" : "left");
    const onDown = (e: PointerEvent) => { if (!wrap.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); btn.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <span ref={wrap} className={`relative inline-flex align-middle ${className}`}>
      <button ref={btn} type="button" aria-expanded={open} aria-controls={id} aria-label={`Help: ${title}`}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((o) => !o); }}
        className={`grid h-6 w-6 place-items-center rounded-full text-[13px] font-bold transition-colors motion-reduce:transition-none ${tone === "dark" ? "bg-white/20 text-white hover:bg-white/30" : "bg-brand-soft text-brand hover:bg-brand hover:text-white"}`}>
        ?
      </button>
      {open && (
        <span id={id} role="note"
          className={`absolute top-8 z-50 w-[min(17rem,calc(100vw-2rem))] rounded-[16px] bg-ink p-4 text-left text-sm font-normal leading-relaxed text-white shadow-[0_20px_40px_-16px_rgba(0,0,0,0.5)] ${align === "left" ? "left-0" : "right-0"}`}>
          <span aria-hidden className={`absolute -top-1.5 h-3 w-3 rotate-45 bg-ink ${align === "left" ? "left-2.5" : "right-2.5"}`} />
          <span className="mb-1 block font-semibold">{title}</span>
          {body}
        </span>
      )}
    </span>
  );
}
