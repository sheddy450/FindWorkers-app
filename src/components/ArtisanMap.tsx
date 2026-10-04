"use client";
import { useEffect, useRef, useState } from "react";
import { Icon } from "./ui/Icon";
import { NIGERIA_BOUNDS } from "@/lib/geo/approx";

/*
 * Map of Nigeria for search results. Uses Leaflet (self-hosted under /public/vendor, no API key)
 * with OpenStreetMap tiles. Artisan pins arrive from the API already rounded to ~1 km.
 */
export type MapArtisan = {
  userId: string; businessName: string; categories: string[]; avgRating: number; reviewCount: number;
  distanceKm: number | null; lat: number | null; lng: number | null; featured?: boolean;
};
type Props = {
  artisans: MapArtisan[];
  userLoc: { lat: number; lng: number } | null;
  radiusKm?: number;
  locStatus: "idle" | "denied" | "unavailable" | "ok";
  onUseMyLocation: () => void;
};

const LEAFLET = "/vendor/leaflet-1.9.4";
// Leaflet has no bundled types here (it's loaded as a script, not an npm package).
type L = any;

let leafletPromise: Promise<L> | null = null;
function loadLeaflet(): Promise<L> {
  const w = window as unknown as { L?: L };
  if (w.L) return Promise.resolve(w.L);
  leafletPromise ??= new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${LEAFLET}/leaflet.css"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet"; css.href = `${LEAFLET}/leaflet.css`;
      document.head.appendChild(css);
    }
    const js = document.createElement("script");
    js.src = `${LEAFLET}/leaflet.js`; js.async = true;
    js.onload = () => (w.L ? resolve(w.L) : reject(new Error("Leaflet didn't load")));
    js.onerror = () => { leafletPromise = null; reject(new Error("Leaflet didn't load")); };
    document.head.appendChild(js);
  });
  return leafletPromise;
}

/** Popup built with DOM nodes, not HTML strings: business names are user-entered text. */
function popupContent(a: MapArtisan): HTMLElement {
  const root = document.createElement("div");
  root.style.minWidth = "160px";
  const name = document.createElement("p");
  name.textContent = a.businessName; name.style.fontWeight = "700"; name.style.margin = "0";
  root.appendChild(name);
  if (a.featured) {
    const f = document.createElement("p");
    f.textContent = "★ Featured · paid placement"; f.style.margin = "2px 0 0"; f.style.fontSize = "12px"; f.style.color = "#5B6472";
    root.appendChild(f);
  }
  const meta = document.createElement("p");
  meta.style.margin = "4px 0 0"; meta.style.fontSize = "13px"; meta.style.color = "#5B6472";
  const parts = [
    a.categories.slice(0, 2).join(" · "),
    a.reviewCount ? `★ ${a.avgRating.toFixed(1)} (${a.reviewCount})` : "No reviews yet",
    a.distanceKm != null ? (a.distanceKm < 1 ? "Under 1 km" : `${a.distanceKm.toFixed(1)} km away`) : "",
  ].filter(Boolean);
  meta.textContent = parts.join(" · ");
  root.appendChild(meta);
  const link = document.createElement("a");
  link.href = `/artisan-profile/${encodeURIComponent(a.userId)}`;
  link.textContent = "View profile →";
  link.style.display = "inline-block"; link.style.marginTop = "6px"; link.style.fontWeight = "600"; link.style.color = "#1B2559";
  root.appendChild(link);
  return root;
}

function pinIcon(Lf: L, featured: boolean) {
  const bg = featured ? "#F5A623" : "#1B2559", fg = featured ? "#171A21" : "#FFFFFF";
  return Lf.divIcon({
    className: "",
    iconSize: [28, 36], iconAnchor: [14, 34], popupAnchor: [0, -30],
    html: `<svg width="28" height="36" viewBox="0 0 28 36" aria-hidden="true"><path d="M14 35s12-11.4 12-21A12 12 0 0 0 2 14c0 9.6 12 21 12 21z" fill="${bg}" stroke="#fff" stroke-width="2"/><circle cx="14" cy="14" r="4.5" fill="${fg}"/></svg>`,
  });
}

export function ArtisanMap({ artisans, userLoc, radiusKm, locStatus, onUseMyLocation }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L>(null);
  const layer = useRef<L>(null);
  const [Lf, setLf] = useState<L>(null);
  const [failed, setFailed] = useState(false);
  const [locating, setLocating] = useState(false);

  // Create the map once.
  useEffect(() => {
    let cancelled = false;
    loadLeaflet().then((Lx) => {
      if (cancelled || !el.current || map.current) return;
      const m = Lx.map(el.current, {
        zoomControl: true, minZoom: 5, maxBounds: Lx.latLngBounds(NIGERIA_BOUNDS).pad(0.5), maxBoundsViscosity: 0.8,
      }).fitBounds(NIGERIA_BOUNDS);
      Lx.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(m);
      map.current = m; layer.current = Lx.layerGroup().addTo(m);
      setLf(() => Lx);
    }).catch(() => !cancelled && setFailed(true));
    return () => { cancelled = true; map.current?.remove(); map.current = null; layer.current = null; };
  }, []);

  // Redraw the customer's position and the artisan pins whenever they change.
  useEffect(() => {
    if (!Lf || !map.current || !layer.current) return;
    const group = layer.current;
    group.clearLayers();
    const points: [number, number][] = [];

    if (userLoc) {
      if (radiusKm) Lf.circle([userLoc.lat, userLoc.lng], { radius: radiusKm * 1000, color: "#1B2559", weight: 1, fillOpacity: 0.05 }).addTo(group);
      Lf.circleMarker([userLoc.lat, userLoc.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2563EB", fillOpacity: 1 })
        .bindTooltip("You are here").addTo(group);
      points.push([userLoc.lat, userLoc.lng]);
    }
    for (const a of artisans) {
      if (a.lat == null || a.lng == null) continue;
      Lf.marker([a.lat, a.lng], { icon: pinIcon(Lf, !!a.featured), title: a.businessName, alt: a.businessName, riseOnHover: true, zIndexOffset: a.featured ? 500 : 0 })
        .bindPopup(() => popupContent(a)).addTo(group);
      points.push([a.lat, a.lng]);
    }

    if (userLoc && radiusKm) map.current.fitBounds(Lf.latLng(userLoc.lat, userLoc.lng).toBounds(radiusKm * 2000), { padding: [16, 16] });
    else if (points.length === 1) map.current.setView(points[0], 13);
    else if (points.length > 1) map.current.fitBounds(points, { padding: [32, 32], maxZoom: 14 });
    else map.current.fitBounds(NIGERIA_BOUNDS);
  }, [Lf, artisans, userLoc, radiusKm]);

  useEffect(() => { if (userLoc || locStatus === "denied" || locStatus === "unavailable") setLocating(false); }, [userLoc, locStatus]);

  const unplaced = artisans.filter((a) => a.lat == null || a.lng == null).length;

  if (failed) return (
    <div className="grid h-80 place-items-center rounded-card border border-dashed border-line bg-white p-4 text-center text-sm text-muted">
      The map couldn&apos;t load. Check your connection, or switch to List to see the same artisans.
    </div>
  );
  return (
    <div className="space-y-2">
      <div className="relative isolate overflow-hidden rounded-card border border-line">
        <div ref={el} role="region" aria-label="Map of artisans in Nigeria" className="h-[26rem] w-full bg-indigo-soft" />
        {!Lf && <div className="absolute inset-0 grid place-items-center text-sm text-muted">Loading map…</div>}
        <button type="button" onClick={() => { setLocating(true); onUseMyLocation(); }}
          className="absolute bottom-4 left-3 z-[1000] inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-indigo shadow-md hover:bg-indigo-soft">
          <Icon name="pin" size={16} />{locating ? "Finding you…" : userLoc ? "Update my location" : "Use my location"}
        </button>
      </div>
      {locStatus === "denied" && <p className="text-sm text-danger">Location access was blocked. Allow it in your browser settings, or enter your area instead.</p>}
      {locStatus === "unavailable" && <p className="text-sm text-danger">Your device can&apos;t share its location. Enter your area instead.</p>}
      <p className="text-xs text-muted">
        Pins show each artisan&apos;s general area (about 1 km), not their exact address.
        {unplaced > 0 && ` ${unplaced} artisan${unplaced === 1 ? " hasn't" : "s haven't"} set a map location yet. See them in List view.`}
      </p>
    </div>
  );
}
