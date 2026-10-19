"use client";
import { useId, useRef, useState } from "react";
import { srcSetOf, type PublicPhoto } from "@/lib/photos/display";

/**
 * Before/after comparison. The "after" photo sits underneath, the "before" photo on top is clipped
 * to the slider position. Drag anywhere on the picture (touch or mouse) to move it. A visually hidden
 * range input does the same for keyboards (arrow keys) and screen readers.
 */
export function BeforeAfter({ before, after, sizes, onOpen }: {
  before: PublicPhoto; after: PublicPhoto; sizes: string; onOpen?: () => void;
}) {
  const [pos, setPos] = useState(50);
  const id = useId();
  const box = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const moveTo = (clientX: number) => {
    const r = box.current?.getBoundingClientRect();
    if (r && r.width > 0) setPos(Math.round(Math.min(100, Math.max(0, ((clientX - r.left) / r.width) * 100))));
  };
  const img = (p: PublicPhoto) => ({
    src: p.thumbUrl, srcSet: srcSetOf(p), sizes, alt: "", loading: "lazy" as const, decoding: "async" as const,
    draggable: false, className: "absolute inset-0 h-full w-full select-none object-cover",
  });
  return (
    <figure className="space-y-1.5">
      <div ref={box}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest("button")) return; dragging.current = true; e.currentTarget.setPointerCapture(e.pointerId); moveTo(e.clientX); }}
        onPointerMove={(e) => { if (dragging.current) moveTo(e.clientX); }}
        onPointerUp={() => { dragging.current = false; }} onPointerCancel={() => { dragging.current = false; }}
        className="relative aspect-[4/3] w-full cursor-ew-resize touch-pan-y select-none overflow-hidden rounded-card bg-brand-soft focus-within:ring-4 focus-within:ring-brand/40"
        style={after.blur ? { backgroundImage: `url("${after.blur}")`, backgroundSize: "cover" } : undefined}>
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img {...img(after)} />
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text */}
        <img {...img(before)} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }} />
        <div aria-hidden className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.15)]" style={{ left: `${pos}%` }}>
          <span className="absolute left-1/2 top-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-brand shadow-soft">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" /></svg>
          </span>
        </div>
        <span aria-hidden className="pointer-events-none absolute left-2 top-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-white">Before</span>
        <span aria-hidden className="pointer-events-none absolute right-2 top-2 rounded-full bg-brand px-2.5 py-1 text-xs font-semibold text-white">After</span>
        <label htmlFor={id} className="sr-only">Compare before and after: {before.alt} / {after.alt}</label>
        <input id={id} type="range" min={0} max={100} step={1} value={pos} onChange={(e) => setPos(Number(e.target.value))}
          aria-valuetext={`${pos}% before`}
          className="sr-only" />
        {onOpen && (
          <button type="button" onClick={onOpen} className="absolute bottom-2 right-2 z-10 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-ink shadow-soft hover:bg-white">
            View full size
          </button>
        )}
      </div>
      <figcaption className="text-sm text-ink">{after.alt}</figcaption>
    </figure>
  );
}
