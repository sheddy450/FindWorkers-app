/** Photo rules. Pure functions so they're unit-tested. */

export const MAX_WORK_PHOTOS = 12;      // portfolio + before/after + workshop
export const MAX_IMAGE_BYTES = 1_500_000;
export const MAX_THUMB_BYTES = 250_000;
export const MAX_BLUR_CHARS = 2_500;
export const MAX_EDGE = 1600;           // longest side of the full image
export const THUMB_EDGE = 480;

export const WORK_CATEGORIES = ["PORTFOLIO", "BEFORE", "AFTER", "WORKSHOP"] as const;
export type PhotoCategory = "PROFILE" | (typeof WORK_CATEGORIES)[number];
export const CATEGORY_LABEL: Record<PhotoCategory, string> = {
  PROFILE: "Profile photo", PORTFOLIO: "Finished work", BEFORE: "Before", AFTER: "After", WORKSHOP: "Workshop / tools",
};

export function isPhotoCategory(v: unknown): v is PhotoCategory {
  return v === "PROFILE" || (WORK_CATEGORIES as readonly string[]).includes(v as string);
}

/** Captions double as alt text, so they're required and must describe the photo. */
export function captionError(raw: string): string | null {
  const c = raw.trim();
  if (c.length < 5) return "Describe the photo in a few words (at least 5 characters), e.g. \"New kitchen sink pipes\".";
  if (c.length > 140) return "Keep the caption under 140 characters.";
  return null;
}

/** A blur preview must be a small inline image, never a link to somewhere else. */
export function blurDataUrlOk(v: unknown): v is string {
  return typeof v === "string" && v.length <= MAX_BLUR_CHARS && /^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/=]+$/.test(v);
}

export function sizeOk(width: number, height: number, maxEdge: number): boolean {
  return width > 0 && height > 0 && Math.max(width, height) <= maxEdge;
}

/** New display order after moving one photo up or down. Returns ids in order. */
export function moveId(ids: readonly string[], id: string, delta: -1 | 1): string[] {
  const i = ids.indexOf(id), j = i + delta;
  if (i < 0 || j < 0 || j >= ids.length) return [...ids];
  const out = [...ids]; [out[i], out[j]] = [out[j], out[i]]; return out;
}

/** Accepts a full reordering only if it's exactly the same set of ids. */
export function sameIds(current: readonly string[], proposed: readonly string[]): boolean {
  return current.length === proposed.length && new Set(proposed).size === proposed.length && proposed.every((id) => current.includes(id));
}

export type CompletenessInput = {
  hasProfilePhoto: boolean; workPhotos: number; hasBio: boolean; hasPrice: boolean;
  services: number; hasLocation: boolean; idVerified: boolean;
};
export type CompletenessStep = { key: string; label: string; done: boolean; weight: number };

/** Profile completeness (0–100) and the steps still to do, most valuable first. */
export function completeness(p: CompletenessInput): { percent: number; steps: CompletenessStep[] } {
  const steps: CompletenessStep[] = [
    { key: "work", label: `Add at least 3 photos of your work (${Math.min(p.workPhotos, 3)}/3)`, done: p.workPhotos >= 3, weight: 25 },
    { key: "profile", label: "Add a clear profile photo", done: p.hasProfilePhoto, weight: 15 },
    { key: "id", label: "Get your ID verified", done: p.idVerified, weight: 20 },
    { key: "bio", label: "Write a short description of your work", done: p.hasBio, weight: 10 },
    { key: "price", label: "Add your price range", done: p.hasPrice, weight: 10 },
    { key: "services", label: "Choose the services you offer", done: p.services > 0, weight: 10 },
    { key: "location", label: "Set your work location so you appear on the map", done: p.hasLocation, weight: 10 },
  ];
  const percent = steps.reduce((n, s) => n + (s.done ? s.weight : 0), 0);
  return { percent, steps };
}

/* ── Copied-photo detection ─────────────────────────────────────────────────────────────────────
 * A "difference hash" (dHash): shrink the photo to 9×8 grey pixels and record, for each row, whether
 * each pixel is brighter than the one to its right. 64 bits → 16 hex chars. Resizing, recompressing
 * or small colour changes barely change it, so two uploads of the same picture end up a few bits apart.
 */

/** dHash from 9×8 = 72 grey values (row by row, 0–255). */
export function dhashFromGrey(grey: ArrayLike<number>): string {
  if (grey.length !== 72) throw new Error("dHash needs 9×8 grey values");
  let hex = "";
  for (let y = 0; y < 8; y++) {
    let byte = 0;
    for (let x = 0; x < 8; x++) byte = (byte << 1) | (grey[y * 9 + x] > grey[y * 9 + x + 1] ? 1 : 0);
    hex += byte.toString(16).padStart(2, "0");
  }
  return hex;
}

export const isPhash = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{16}$/.test(v);

/** Number of differing bits between two hashes (0 = identical, 64 = opposite). */
export function hamming(a: string, b: string): number {
  let d = 0;
  for (let i = 0; i < 16; i += 4) {
    let x = parseInt(a.slice(i, i + 4), 16) ^ parseInt(b.slice(i, i + 4), 16);
    while (x) { d += x & 1; x >>= 1; }
  }
  return d;
}

/** Close enough to be the same picture. Flat, featureless images (a white wall) are ignored: every one looks alike. */
export const SAME_PHOTO_BITS = 6;
export function looksSame(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b || !isPhash(a) || !isPhash(b)) return false;
  if (a === "0000000000000000" || a === "ffffffffffffffff") return false;
  return hamming(a, b) <= SAME_PHOTO_BITS;
}

/** Ready-made rejection reasons for moderators (they can also write their own). Shown to the artisan. */
export const REJECT_REASONS = [
  "This looks like a stock or copied photo. Upload photos of jobs you did yourself.",
  "The photo is too blurry or dark. Retake it in good light.",
  "This photo doesn't show your work or your trade.",
  "The photo shows personal details (faces, phone numbers, addresses or plate numbers). Retake it without them.",
  "The caption doesn't describe the photo. Edit the caption to say what the job was.",
] as const;
