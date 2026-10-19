import Link from "next/link";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { StarRating } from "./ui/StarRating";
import { Photo } from "./photos/Photo";
import type { CardPhotos } from "@/lib/photos/display";

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
  return (
    <Link href={`/artisan-profile/${p.id}`} className="group block rounded-card">
      <Card className={`overflow-hidden p-0 transition ${p.featured ? "border-highlight/60 bg-highlight-soft/40" : ""} group-hover:border-brand/30 group-hover:shadow-md group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100`}>
        <div className="relative">
          <Photo photo={p.photos?.cover} trade={trade} sizes={COVER_SIZES} priority={p.priority} className="aspect-[16/7] w-full" />
          {p.featured && <span className="absolute left-3 top-3"><Badge tone="warning">★ Featured</Badge></span>}
        </div>
        <div className="flex gap-3 p-4 pt-0">
          <div className="-mt-7 shrink-0">
            {p.photos?.avatar ? (
              <Photo photo={p.photos.avatar} sizes="56px" className="h-14 w-14 rounded-full ring-4 ring-white" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-soft text-lg font-bold text-brand ring-4 ring-white">{p.businessName[0]?.toUpperCase()}</div>
            )}
          </div>
          <div className="min-w-0 flex-1 pt-2">
            <p className="truncate text-base font-semibold text-ink">{p.businessName}</p>
            {p.categories && p.categories.length > 0 && (
              <p className="truncate text-sm font-medium text-brand">{p.categories.join(" · ")}</p>
            )}
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
              <StarRating value={p.avgRating} count={p.reviewCount} />
              {p.distanceKm != null ? <span>· {p.distanceKm < 1 ? "Under 1 km" : `${p.distanceKm.toFixed(1)} km away`}</span>
                : p.place ? <span className="truncate">· {p.place}</span> : null}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {p.verifiedCount > 0 && <Badge tone="verified">✓ {p.verifiedCount} verified</Badge>}
              {p.availability === "AVAILABLE_NOW" && <Badge tone="warning">Available now</Badge>}
              {price && <span className="text-sm font-semibold text-ink">{price}</span>}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}

/** "Ikeja, Lagos" from an artisan's LGA/state (either may be missing). */
export const placeOf = (a: { lga?: string | null; state?: string | null }) =>
  [a.lga, a.state === "FCT (Abuja)" ? "Abuja" : a.state].filter(Boolean).join(", ") || null;
