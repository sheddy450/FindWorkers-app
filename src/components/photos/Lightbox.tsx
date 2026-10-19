"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { srcSetOf, type PublicPhoto } from "@/lib/photos/display";

/**
 * Full-screen photo viewer: swipe (touch) or ←/→ (keyboard) between photos, Esc or ✕ to close,
 * caption underneath. Focus moves into the viewer and back to where it was on close, and the page
 * behind doesn't scroll. Neighbouring photos are preloaded so swiping feels instant.
 */
export function Lightbox({ photos, index, onIndex, onClose }: {
  photos: PublicPhoto[]; index: number; onIndex: (i: number) => void; onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const start = useRef<{ x: number; y: number } | null>(null);
  const [drag, setDrag] = useState(0);
  const [broken, setBroken] = useState<Record<string, true>>({});
  const n = photos.length, p = photos[index];
  const go = useCallback((d: number) => onIndex((index + d + n) % n), [index, n, onIndex]);

  useEffect(() => {
    const back = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    return () => { document.body.style.overflow = overflow; back?.focus?.(); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "Tab") {
        // keep keyboard focus inside the viewer
        const els = dialogRef.current?.querySelectorAll<HTMLElement>("button");
        if (!els?.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, onClose]);

  // Preload the photos either side.
  useEffect(() => {
    if (n < 2) return;
    for (const d of [1, -1]) { const q = photos[(index + d + n) % n]; const im = new Image(); im.sizes = "100vw"; im.srcset = srcSetOf(q); im.src = q.url; }
  }, [index, n, photos]);

  if (!p) return null;
  const btn = "grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white";

  // Rendered in place (no portal): `fixed inset-0` already covers the whole screen.
  return (
    <div ref={dialogRef} role="dialog" aria-modal="true" aria-label={`Photo ${index + 1} of ${n}`}
      className="fixed inset-0 z-[70] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between gap-2 p-3">
        <p className="text-sm text-white/80" aria-live="polite">{index + 1} / {n}</p>
        <button ref={closeRef} type="button" onClick={onClose} aria-label="Close photo viewer" className={btn}>
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <div className="relative min-h-0 flex-1 touch-pan-y select-none"
        onPointerDown={(e) => { start.current = { x: e.clientX, y: e.clientY }; }}
        onPointerMove={(e) => { if (start.current) setDrag(e.clientX - start.current.x); }}
        onPointerUp={(e) => {
          const s = start.current; start.current = null; setDrag(0);
          if (!s) return;
          const dx = e.clientX - s.x, dy = e.clientY - s.y;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) go(dx < 0 ? 1 : -1);
          else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) onClose(); // swipe down to close
        }}
        onPointerCancel={() => { start.current = null; setDrag(0); }}>
        {broken[p.id] ? (
          <p className="absolute inset-0 grid place-items-center px-6 text-center text-white/80">This photo couldn&apos;t be loaded. Check your connection and try again.</p>
        ) : (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img key={p.id} onError={() => setBroken((b) => ({ ...b, [p.id]: true }))} src={p.url} srcSet={srcSetOf(p)} sizes="100vw" alt={p.alt} draggable={false}
          style={{ transform: drag ? `translateX(${drag}px)` : undefined, ...(p.blur ? { backgroundImage: `url("${p.blur}")`, backgroundSize: "contain", backgroundRepeat: "no-repeat", backgroundPosition: "center" } : {}) }}
          className="absolute inset-0 m-auto h-full w-full object-contain" />
        )}
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Previous photo" className={`${btn} absolute left-3 top-1/2 -translate-y-1/2 max-sm:hidden`}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Next photo" className={`${btn} absolute right-3 top-1/2 -translate-y-1/2 max-sm:hidden`}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </button>
          </>
        )}
      </div>

      <p className="mx-auto max-w-2xl px-4 pb-6 pt-3 text-center text-base">{p.alt}</p>
    </div>
  );
}
