"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ArtisanCard } from "@/components/ArtisanCard";
import { ArtisanCardSkeleton, EmptyState, ErrorState } from "@/components/ui/States";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useLocation } from "@/lib/geo/location";
import { ArtisanMap } from "@/components/ArtisanMap";

type Result = { userId: string; businessName: string; categories: string[]; distanceKm: number | null; avgRating: number; reviewCount: number;
  priceMinKobo: number | null; priceMaxKobo: number | null; availability: string; verifiedTypes: string[];
  lat: number | null; lng: number | null };

const RADIUS_OPTIONS = [5, 10, 20, 50];
const RATING_OPTIONS = [{ label: "Any rating", value: "" }, { label: "3+ stars", value: "3" }, { label: "4+ stars", value: "4" }, { label: "4.5+ stars", value: "4.5" }];

export function SearchClient({ categories }: { categories: { slug: string; name: string }[] }) {
  const router = useRouter(); const params = useSearchParams();
  const category = params.get("category") ?? "";
  const manualState = params.get("state") ?? ""; const manualLga = params.get("lga") ?? "";
  const { loc, status, request } = useLocation();
  const [view, setView] = useState<"list" | "map">("list");
  const [results, setResults] = useState<Result[] | null>(null);
  const [featured, setFeatured] = useState<Result[]>([]);
  const [error, setError] = useState("");

  const [radiusKm, setRadiusKm] = useState(20);
  const [minRating, setMinRating] = useState("");
  const [availableNow, setAvailableNow] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const hasLocation = !!loc || (!!manualState && !!manualLga);

  useEffect(() => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (loc) { q.set("lat", String(loc.lat)); q.set("lng", String(loc.lng)); q.set("radiusKm", String(radiusKm)); }
    else if (manualState) { q.set("state", manualState); if (manualLga) q.set("lga", manualLga); }
    if (minRating) q.set("minRating", minRating);
    if (availableNow) q.set("availableNow", "1");
    if (verifiedOnly) q.set("verifiedOnly", "1");
    setResults(null); setFeatured([]); setError("");
    fetch(`/api/search?${q}`).then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((d) => { setResults(d.results); setFeatured(d.featured ?? []); }).catch(() => setError("Couldn't load artisans."));
  }, [category, loc, manualState, manualLga, radiusKm, minRating, availableNow, verifiedOnly]);

  function setCategory(slug: string) {
    const q = new URLSearchParams(params); slug ? q.set("category", slug) : q.delete("category");
    router.push(`/search?${q}`);
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-brand">Find an artisan</h1>

      {!hasLocation && (
        <div className="mt-3"><Alert variant="info" title="Turn on location to see how far each artisan is">
          <div className="mt-2 flex flex-wrap gap-2">
            <Button variant="outline" onClick={request}><span className="inline-flex items-center gap-2"><Icon name="pin" size={16} />Use my location</span></Button>
            <Link href="/location" className="inline-flex min-h-11 items-center rounded-ctl border border-line bg-white px-4 text-sm font-semibold">Enter my area</Link>
          </div>
        </Alert></div>
      )}
      {status === "denied" && <div className="mt-2"><Alert variant="warning" title="Location was not shared">You can still browse by category, or enter your area manually.</Alert></div>}
      {!loc && manualState && <p className="mt-2 text-sm text-muted">Showing artisans in {manualLga ? `${manualLga}, ` : ""}{manualState}. <Link href="/location" className="underline">Change</Link></p>}

      <div className="mt-4 -mx-6 overflow-x-auto px-6"><div className="flex gap-2 pb-1">
        <button onClick={() => setCategory("")} className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${!category ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>All</button>
        {categories.map((c) => (
          <button key={c.slug} onClick={() => setCategory(c.slug)} className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${category === c.slug ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>{c.name}</button>
        ))}
      </div></div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {loc && (
          <select value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} className="min-h-10 rounded-full border border-line bg-white px-3 text-sm">
            {RADIUS_OPTIONS.map((k) => <option key={k} value={k}>Within {k} km</option>)}
          </select>
        )}
        <select value={minRating} onChange={(e) => setMinRating(e.target.value)} className="min-h-10 rounded-full border border-line bg-white px-3 text-sm">
          {RATING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <button onClick={() => setAvailableNow(!availableNow)} className={`min-h-10 rounded-full border px-3 text-sm font-medium ${availableNow ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"}`}>Available now</button>
        <button onClick={() => setVerifiedOnly(!verifiedOnly)} className={`min-h-10 rounded-full border px-3 text-sm font-medium ${verifiedOnly ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"}`}>Verified only</button>
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={() => setView("list")} className={`min-h-11 flex-1 rounded-ctl border text-sm font-semibold ${view === "list" ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"}`}>List</button>
        <button onClick={() => setView("map")} className={`min-h-11 flex-1 rounded-ctl border text-sm font-semibold ${view === "map" ? "border-brand bg-brand-soft text-brand" : "border-line bg-white"}`}>Map</button>
      </div>

      <div className="mt-4 space-y-3">
        {error && <ErrorState title="Couldn't load artisans" body="Check your connection and try again." action={{ label: "Try again", onClick: () => location.reload() }} />}
        {!error && results === null && Array.from({ length: 4 }).map((_, i) => <ArtisanCardSkeleton key={i} />)}
        {!error && results?.length === 0 && view === "list" && <EmptyState icon="search" title="No artisans found" body="Try a different category, widen your search radius, or loosen a filter." />}
        {!error && results && results.length > 0 && view === "list" && featured.length > 0 && (
          <section aria-labelledby="featured-title" className="space-y-3 pb-2">
            <p id="featured-title" className="flex items-center justify-between text-sm">
              <span className="font-semibold text-ink">Featured</span>
              <span className="text-muted">Paid placement</span>
            </p>
            {featured.map((r) => (
              <ArtisanCard key={`f-${r.userId}`} featured id={r.userId} businessName={r.businessName} categories={r.categories} distanceKm={r.distanceKm} avgRating={r.avgRating}
                reviewCount={r.reviewCount} priceMinKobo={r.priceMinKobo} priceMaxKobo={r.priceMaxKobo} availability={r.availability} verifiedCount={r.verifiedTypes.length} />
            ))}
            <p className="pt-1 text-sm font-semibold text-ink">All results</p>
          </section>
        )}
        {!error && results && results.length > 0 && view === "list" && results.map((r) => (
          <ArtisanCard key={r.userId} id={r.userId} businessName={r.businessName} categories={r.categories} distanceKm={r.distanceKm} avgRating={r.avgRating}
            reviewCount={r.reviewCount} priceMinKobo={r.priceMinKobo} priceMaxKobo={r.priceMaxKobo} availability={r.availability} verifiedCount={r.verifiedTypes.length} />
        ))}
        {!error && results?.length === 0 && view === "map" && <p className="text-sm text-muted">No artisans match here yet. Try a wider radius, another category, or fewer filters.</p>}
        {!error && results && view === "map" && (
          <ArtisanMap
            artisans={results.map((r) => ({ ...r, featured: featured.some((f) => f.userId === r.userId) }))}
            userLoc={loc} radiusKm={loc ? radiusKm : undefined} locStatus={status} onUseMyLocation={request} />
        )}
      </div>
    </main>
  );
}
