import Link from "next/link";
import { Badge } from "./ui/Badge";
import { Icon } from "./ui/Icon";
import { Photo } from "./photos/Photo";
import type { CardPhotos } from "@/lib/photos/display";
import { stockPhotoFor } from "@/lib/photos/stock";

type Props = { id: string; businessName: string; categories?: string[]; distanceKm?: number | null; avgRating: number; reviewCount: number;
  priceMinKobo?: number | null; priceMaxKobo?: number | null; availability: string; verifiedCount: number;
  /** Approved cover photo + profile photo. Missing → a trade illustration and the initial. */
  photos?: CardPhotos | null;
  /** e.g. "Ikeja, Lagos" */
  place?: string | null;
  /** Shown only in the labelled Featured slot, never in organic results. */
  featured?: boolean;
  /** First card on the page: load its photo straight away instead of lazily. */
  priority?: boolean };
const nairaRange = (min?: number | null, max?: number | null) =>
  min == null ? null : `From ₦${(min / 100).toLocaleString("en-NG")}${max && max !== min ? ` – ₦${(max / 100).toLocaleString("en-NG")}` : ""}`;

/** Cards are full width on phones and up to ~670px in the 2xl content column. */
const COVER_SIZES = "(max-width: 700px) 100vw, 670px";

export function ArtisanCard(p: Props) {
  const trade = p.categories?.[0] ?? null;
  const price = nairaRange(p.priceMinKobo, p.priceMaxKobo);
  // No approved photo yet: show a labelled example photo of the trade (never passed off as their work).
  const own = p.photos?.cover ?? null;
  const cover = own ?? stockPhotoFor(trade);
  const where = p.distanceKm != null ? (p.distanceKm < 1 ? "Under 1 km away" : `${p.distanceKm.toFixed(1)} km away`) : p.place;
  const rated = p.reviewCount > 0;
  return (
    <Link href={`/artisan-profile/${p.id}`}
      className="group block rounded-[20px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
      <article className={`overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 transition duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_18px_40px_-18px_rgba(0,107,64,0.45)] group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-hover:translate-y-0 ${p.featured ? "ring-2 ring-highlight/70" : "ring-line/70"}`}>
        {/* ── Photo with name over it ─────────────────────────────── */}
        <div className="relative">
          <Photo photo={cover} trade={trade} sizes={COVER_SIZES} priority={p.priority}
            className="aspect-[16/9] w-full sm:aspect-[21/9] [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-out group-hover:[&_img]:scale-[1.06] motion-reduce:[&_img]:transition-none" />
          {/* gradient so white text stays readable on any photo */}
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-black/0" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/30 to-transparent" />

          <div className="absolute left-3 right-3 top-3 flex items-start justify-between gap-2">
            <div className="flex flex-wrap gap-1.5">
              {p.featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-highlight px-2.5 py-1 text-xs font-bold text-ink shadow-sm">★ Featured</span>
              )}
              {p.availability === "AVAILABLE_NOW" && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-highlight opacity-75 motion-reduce:animate-none" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-highlight" />
                  </span>
                  Available now
                </span>
              )}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm"
              aria-label={rated ? `Rated ${p.avgRating.toFixed(1)} out of 5 from ${p.reviewCount} reviews` : "New on FindWorkers, no reviews yet"}>
              {rated ? <><span className="text-star"><Icon name="star" size={13} filled /></span>{p.avgRating.toFixed(1)}<span className="font-medium text-muted">({p.reviewCount})</span></> : <span className="text-brand">New</span>}
            </span>
          </div>

          <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 p-3.5">
            {p.photos?.avatar ? (
              <Photo photo={p.photos.avatar} sizes="52px" className="h-[52px] w-[52px] shrink-0 rounded-full ring-2 ring-white shadow-md" />
            ) : (
              <div className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-brand to-brand-700 text-lg font-bold text-white ring-2 ring-white shadow-md">
                {p.businessName[0]?.toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 pb-0.5 text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.45)]">
              <p className="truncate text-lg font-bold leading-tight">{p.businessName}</p>
              {p.categories && p.categories.length > 0 && <p className="truncate text-sm font-medium text-white/85">{p.categories.join(" · ")}</p>}
            </div>
            {!own && <span className="mb-0.5 shrink-0 self-end rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-medium text-white/90">Example photo</span>}
          </div>
        </div>

        {/* ── Details strip ───────────────────────────────────────── */}
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {p.verifiedCount > 0 && <Badge tone="verified">✓ {p.verifiedCount} verified</Badge>}
              {where && <span className="inline-flex min-w-0 items-center gap-1 text-sm text-muted"><Icon name="pin" size={14} /><span className="truncate">{where}</span></span>}
            </div>
            {price
              ? <p className="text-[15px] font-bold text-brand">{price}</p>
              : <p className="text-sm text-muted">Price on request</p>}
          </div>
          <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand transition-colors duration-300 group-hover:bg-brand group-hover:text-white motion-reduce:transition-none">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </span>
        </div>
      </article>
    </Link>
  );
}

/** "Ikeja, Lagos" from an artisan's LGA/state (either may be missing). */
export const placeOf = (a: { lga?: string | null; state?: string | null }) =>
  [a.lga, a.state === "FCT (Abuja)" ? "Abuja" : a.state].filter(Boolean).join(", ") || null;
