"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Thin green bar at the top while the next page loads, so every tap gets instant feedback.
 * Starts when an internal link is clicked (or Back/Forward is used), creeps towards 85%,
 * and completes when the new page's URL is in place. Only animates transform/opacity (cheap
 * on budget phones) and stays out of the way of screen readers.
 */
export function NavProgress() {
  const path = usePathname(), params = useSearchParams();
  const [p, setP] = useState(0);          // 0 = hidden, 0..1 = progress
  const [fading, setFading] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const started = useRef(false);

  const start = () => {
    if (started.current) return;
    started.current = true; setFading(false); setP(0.08);
    timer.current = setInterval(() => setP((v) => (v < 0.85 ? v + (0.85 - v) * 0.08 : v)), 120);
  };

  // Finish when the URL changes (the new page has rendered its first content).
  useEffect(() => {
    if (!started.current) return;
    started.current = false;
    if (timer.current) clearInterval(timer.current);
    setP(1);
    const a = setTimeout(() => setFading(true), 180), b = setTimeout(() => { setP(0); setFading(false); }, 480);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [path, params]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin) return;
      if (url.pathname === location.pathname && url.search === location.search) return; // same page
      start();
    };
    const onPop = () => start();
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", onPop);
    return () => { document.removeEventListener("click", onClick); window.removeEventListener("popstate", onPop); if (timer.current) clearInterval(timer.current); };
  }, []);

  if (p === 0) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[90] h-[3px]">
      <div className="h-full origin-left bg-gradient-to-r from-brand via-highlight to-brand shadow-[0_0_10px_rgba(52,199,89,0.7)] transition-[transform,opacity] duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: `scaleX(${p})`, opacity: fading ? 0 : 1 }} />
    </div>
  );
}
