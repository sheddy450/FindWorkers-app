"use client";
import { useState } from "react";
import { srcSetOf, type PublicPhoto } from "@/lib/photos/display";
import { TradePlaceholder } from "./TradePlaceholder";

/**
 * One customer-facing photo, built for slow networks and low-end phones:
 * - the tiny blur preview shows instantly (it's inline in the HTML) and the real image paints over it
 *   as it arrives. No fade-in that waits for JavaScript, so photos still appear if scripts are slow;
 * - `srcSet` + `sizes` let the phone pick the 480px file instead of the 1600px one;
 * - lazy-loaded unless it's the first thing on screen (`priority`);
 * - if there's no photo, or the file fails to load, a trade illustration shows instead of a broken image.
 */
export function Photo({ photo, trade, sizes, className = "", priority = false, fit = "cover", placeholderSize }: {
  photo: PublicPhoto | null | undefined; trade?: string | null; sizes: string; className?: string;
  priority?: boolean; fit?: "cover" | "contain"; placeholderSize?: "sm" | "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);
  if (!photo || failed) return <TradePlaceholder trade={trade} className={className} size={placeholderSize} />;
  return (
    <span className={`relative block overflow-hidden bg-brand-soft ${className}`}
      style={photo.blur ? { backgroundImage: `url("${photo.blur}")`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element -- files are already resized on upload; two sizes via srcSet */}
      <img src={photo.thumbUrl} srcSet={srcSetOf(photo)} sizes={sizes} alt={photo.alt}
        width={photo.width} height={photo.height}
        loading={priority ? "eager" : "lazy"} decoding="async"
        onError={() => setFailed(true)}
        // An error that happened before the page's JavaScript started won't fire onError: catch it here.
        ref={(el) => { if (el && el.complete && el.naturalWidth === 0 && el.currentSrc) setFailed(true); }}
        className={`h-full w-full ${fit === "cover" ? "object-cover" : "object-contain"}`} />
    </span>
  );
}
