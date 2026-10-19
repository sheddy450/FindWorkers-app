/**
 * How approved photos are shown to customers. Pure functions (no database) so they're unit-tested.
 * Only APPROVED photos ever reach these functions: the loaders filter by moderation status.
 */

/** What the browser needs to show one photo. `thumbUrl` is ~480px, `url` up to 1600px. */
export type PublicPhoto = {
  id: string; url: string; thumbUrl: string; blur: string | null; alt: string; width: number; height: number;
};
export type CardPhotos = { cover: PublicPhoto | null; avatar: PublicPhoto | null };

type Row = {
  id: string; url: string; thumbUrl: string; blurDataUrl: string | null; caption: string; width: number; height: number;
  category: "PROFILE" | "PORTFOLIO" | "BEFORE" | "AFTER" | "WORKSHOP"; isCover: boolean; pairKey: string | null; displayOrder: number;
};

export const toPublic = (r: Row): PublicPhoto => ({
  id: r.id, url: r.url, thumbUrl: r.thumbUrl, blur: r.blurDataUrl, alt: r.caption, width: r.width, height: r.height,
});

const byOrder = (a: Row, b: Row) => a.displayOrder - b.displayOrder;

/**
 * The search-card picture: the artisan's chosen cover; otherwise their first finished-work photo
 * (an "after" shot shows the result, so it beats "before"); otherwise any work photo.
 */
export function pickCardPhotos(rows: readonly Row[]): CardPhotos {
  const work = rows.filter((r) => r.category !== "PROFILE").sort(byOrder);
  const cover =
    work.find((r) => r.isCover) ??
    work.find((r) => r.category === "PORTFOLIO" || r.category === "AFTER") ??
    work.find((r) => r.category === "WORKSHOP") ??
    work[0];
  const avatar = rows.find((r) => r.category === "PROFILE");
  return { cover: cover ? toPublic(cover) : null, avatar: avatar ? toPublic(avatar) : null };
}

export type GalleryItem =
  | { kind: "photo"; photo: PublicPhoto; label: string | null }
  | { kind: "pair"; before: PublicPhoto; after: PublicPhoto };

/**
 * Profile gallery in the artisan's order. A before/after pair becomes one slider item (placed where
 * the first of the two sits); a half-pair whose partner isn't approved shows as a normal photo.
 * `lightbox` is the flat list the full-screen viewer swipes through.
 */
export function buildGallery(rows: readonly Row[]): { items: GalleryItem[]; lightbox: PublicPhoto[] } {
  const work = rows.filter((r) => r.category !== "PROFILE").sort(byOrder);
  const pairs = new Map<string, Row[]>();
  for (const r of work) if (r.pairKey) pairs.set(r.pairKey, [...(pairs.get(r.pairKey) ?? []), r]);

  const items: GalleryItem[] = [];
  const used = new Set<string>();
  for (const r of work) {
    if (used.has(r.id)) continue;
    const group = r.pairKey ? pairs.get(r.pairKey) ?? [] : [];
    const before = group.find((g) => g.category === "BEFORE"), after = group.find((g) => g.category === "AFTER");
    if (before && after) {
      items.push({ kind: "pair", before: toPublic(before), after: toPublic(after) });
      used.add(before.id); used.add(after.id);
    } else {
      items.push({ kind: "photo", photo: toPublic(r), label: r.category === "BEFORE" ? "Before" : r.category === "AFTER" ? "After" : r.category === "WORKSHOP" ? "Workshop" : null });
      used.add(r.id);
    }
  }
  const lightbox = items.flatMap((i) => (i.kind === "pair" ? [i.before, i.after] : [i.photo]));
  return { items, lightbox };
}

/** `srcSet` for the two stored sizes, so phones download the 480px file and big screens the full one. */
export function srcSetOf(p: Pick<PublicPhoto, "url" | "thumbUrl" | "width">): string {
  const thumbW = Math.min(480, p.width);
  return p.url === p.thumbUrl ? `${p.url} ${p.width}w` : `${p.thumbUrl} ${thumbW}w, ${p.url} ${p.width}w`;
}
