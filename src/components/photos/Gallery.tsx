"use client";
import { useState } from "react";
import type { GalleryItem, PublicPhoto } from "@/lib/photos/display";
import { Photo } from "./Photo";
import { BeforeAfter } from "./BeforeAfter";
import { Lightbox } from "./Lightbox";

/** Work photos on a profile: a grid of thumbnails (before/after pairs as sliders); tap to view full screen. */
export function Gallery({ items, lightbox, trade }: { items: GalleryItem[]; lightbox: PublicPhoto[]; trade?: string | null }) {
  const [open, setOpen] = useState<number | null>(null);
  const indexOf = (id: string) => Math.max(0, lightbox.findIndex((p) => p.id === id));
  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {items.map((it) =>
          it.kind === "pair" ? (
            <li key={`${it.before.id}-${it.after.id}`} className="col-span-2 sm:col-span-3">
              <BeforeAfter before={it.before} after={it.after} sizes="(max-width: 700px) 100vw, 670px" onOpen={() => setOpen(indexOf(it.before.id))} />
            </li>
          ) : (
            <li key={it.photo.id}>
              <button type="button" onClick={() => setOpen(indexOf(it.photo.id))}
                className="group relative block w-full overflow-hidden rounded-ctl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                aria-label={`View photo: ${it.photo.alt}`}>
                <Photo photo={it.photo} trade={trade} sizes="(max-width: 640px) 50vw, 224px" className="aspect-square w-full transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none" />
                {it.label && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/70 px-2 py-0.5 text-xs font-semibold text-white">{it.label}</span>}
              </button>
            </li>
          ),
        )}
      </ul>
      {open !== null && <Lightbox photos={lightbox} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />}
    </>
  );
}
