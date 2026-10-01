import Link from "next/link";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";
import { StarRating } from "./ui/StarRating";

type Props = { id: string; businessName: string; categories?: string[]; distanceKm?: number | null; avgRating: number; reviewCount: number;
  priceMinKobo?: number | null; priceMaxKobo?: number | null; availability: string; verifiedCount: number };
const nairaRange = (min?: number | null, max?: number | null) =>
  min == null ? null : `From ₦${(min / 100).toLocaleString("en-NG")}${max && max !== min ? ` – ₦${(max / 100).toLocaleString("en-NG")}` : ""}`;

export function ArtisanCard(p: Props) {
  return (
    <Link href={`/artisan-profile/${p.id}`} className="group block rounded-card">
      <Card className="flex gap-3 transition group-hover:border-indigo/30 group-hover:shadow-md group-active:scale-[0.99] motion-reduce:transition-none motion-reduce:group-active:scale-100">
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-indigo-soft text-lg font-bold text-indigo">{p.businessName[0]?.toUpperCase()}</div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink">{p.businessName}</p>
          {p.categories && p.categories.length > 0 && (
            <p className="truncate text-sm font-medium text-indigo">{p.categories.join(" · ")}</p>
          )}
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
            <StarRating value={p.avgRating} count={p.reviewCount} />
            {p.distanceKm != null && <span>· {p.distanceKm < 1 ? "Under 1 km" : `${p.distanceKm.toFixed(1)} km away`}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            {p.verifiedCount > 0 && <Badge tone="verified">✓ {p.verifiedCount} verified</Badge>}
            {p.availability === "AVAILABLE_NOW" && <Badge tone="warning">Available now</Badge>}
          </div>
          {nairaRange(p.priceMinKobo, p.priceMaxKobo) && <p className="mt-1 text-sm font-medium">{nairaRange(p.priceMinKobo, p.priceMaxKobo)}</p>}
        </div>
      </Card>
    </Link>
  );
}
