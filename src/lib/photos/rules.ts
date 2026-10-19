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
