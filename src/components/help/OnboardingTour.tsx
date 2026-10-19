"use client";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * First-visit tour on the home page: four short steps, each pointing at the real thing on the page.
 * Shown once per browser (remembered in localStorage); "Skip" or Esc ends it. Restart with /?tour=1
 * (linked from the help centre). If a step's target isn't on the page, that step shows centred.
 */
const KEY = "fw:tour:v1";

const STEPS = [
  { anchors: ["search"], title: "Search in plain words", body: "Pick the service you need and your city, then tap Find artisans. That's it." },
  { anchors: ["profile", "services"], title: "Check before you choose", body: "Open an artisan to see photos of their work, verified badges, reviews from real jobs and their prices." },
  { anchors: ["post-job"], title: "Or let artisans come to you", body: "Post your job for free. Artisans near you send their prices, you compare and hire the one you like." },
  { anchors: ["review"], title: "Rate the work", body: "When the job is done, mark it complete and leave a review. It helps the next person choose well." },
] as const;

type Rect = { top: number; left: number; width: number; height: number };
const PAD = 8;

function readFlag(): string | null { try { return localStorage.getItem(KEY); } catch { return "unavailable"; } }
function writeFlag() { try { localStorage.setItem(KEY, "done"); } catch { /* private mode: it just shows again next time */ } }

export function OnboardingTour() {
  const [step, setStep] = useState<number | null>(null);
  const [rect, setRect] = useState<Rect | null>(null);
  const card = useRef<HTMLDivElement>(null);
  const title = useRef<HTMLHeadingElement>(null);

  // Start once, after the page has settled, unless already seen (or forced with ?tour=1).
  useEffect(() => {
    const forced = new URLSearchParams(window.location.search).get("tour") === "1";
    if (!forced && readFlag()) return;
    const t = setTimeout(() => setStep(0), forced ? 200 : 900);
    return () => clearTimeout(t);
  }, []);

  const target = useCallback((i: number) => {
    for (const a of STEPS[i].anchors) {
      const el = document.querySelector<HTMLElement>(`[data-tour="${a}"]`);
      if (el && el.offsetParent !== null) return el;
    }
    return null;
  }, []);

  const measure = useCallback(() => {
    if (step === null) return;
    const el = target(step);
    if (!el) return setRect(null);
    const r = el.getBoundingClientRect();
    setRect({ top: r.top - PAD, left: r.left - PAD, width: r.width + PAD * 2, height: r.height + PAD * 2 });
  }, [step, target]);

  // Bring the step's target into view, then measure and keep measuring on scroll/resize.
  useLayoutEffect(() => {
    if (step === null) return;
    const el = target(step);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el?.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    const t = setTimeout(measure, reduce ? 0 : 380);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener("resize", measure); window.removeEventListener("scroll", measure); };
  }, [step, target, measure]);

  useEffect(() => { if (step !== null) title.current?.focus(); }, [step]);

  const end = useCallback(() => { writeFlag(); setStep(null); }, []);
  useEffect(() => {
    if (step === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") end();
      else if (e.key === "Tab") { // keep focus inside the tour card
        const els = card.current?.querySelectorAll<HTMLElement>("button, [tabindex='-1']");
        if (!els?.length) return;
        const first = els[0], last = els[els.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, end]);

  if (step === null) return null;
  const s = STEPS[step], last = step === STEPS.length - 1;

  // Card goes below the highlight if there's room, otherwise above; centred when there's no target.
  const vw = typeof window !== "undefined" ? window.innerWidth : 400, vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const cardW = Math.min(340, vw - 32);
  const below = rect ? rect.top + rect.height + 12 + 190 < vh : true;
  const style: React.CSSProperties = rect
    ? { width: cardW, left: Math.min(Math.max(16, rect.left), vw - cardW - 16), ...(below ? { top: rect.top + rect.height + 12 } : { bottom: vh - rect.top + 12 }) }
    : { width: cardW, left: (vw - cardW) / 2, top: vh / 2 - 110 };

  return (
    <div className="fixed inset-0 z-[80]" aria-live="polite">
      {/* Dimmed page with a cut-out around the thing being explained. Clicks on the dim area are ignored. */}
      {rect ? (
        // The dimming is a huge box-shadow, so the green ring is drawn with an outline (a ring would be overwritten).
        <div aria-hidden data-tour-spotlight className="pointer-events-none fixed rounded-[20px] transition-all duration-300 motion-reduce:transition-none"
          style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height, boxShadow: "0 0 0 9999px rgba(0,26,14,0.62)", outline: "4px solid #34C759", outlineOffset: 0 }} />
      ) : <div aria-hidden className="fixed inset-0 bg-[rgba(0,26,14,0.62)]" />}

      <div ref={card} role="dialog" aria-modal="true" aria-labelledby="tour-title" aria-describedby="tour-body"
        className="fixed rounded-[20px] bg-white p-5 text-ink shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)]" style={style}>
        <p className="text-sm font-medium text-muted">Step {step + 1} of {STEPS.length}</p>
        <h2 ref={title} id="tour-title" tabIndex={-1} className="mt-1 text-xl font-bold tracking-tight outline-none focus-visible:outline-none">{s.title}</h2>
        <p id="tour-body" className="mt-1.5 text-[15px] leading-relaxed text-muted">{s.body}</p>
        <div className="mt-3 flex gap-1.5" aria-hidden>
          {STEPS.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all motion-reduce:transition-none ${i === step ? "w-6 bg-brand" : "w-1.5 bg-line"}`} />)}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" onClick={end} className="mr-auto min-h-11 px-1 text-sm font-medium text-muted underline">Skip tour</button>
          {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="min-h-11 rounded-full border border-line px-4 font-semibold hover:bg-paper">Back</button>}
          <button type="button" onClick={() => (last ? end() : setStep(step + 1))} className="min-h-11 rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-700">
            {last ? "Got it" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}
