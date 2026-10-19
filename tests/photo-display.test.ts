import { describe, it, expect } from "vitest";
import { buildGallery, pickCardPhotos, srcSetOf } from "../src/lib/photos/display";
import { dhashFromGrey, hamming, isPhash, looksSame } from "../src/lib/photos/rules";

type Cat = "PROFILE" | "PORTFOLIO" | "BEFORE" | "AFTER" | "WORKSHOP";
let n = 0;
const row = (category: Cat, o: Partial<{ isCover: boolean; pairKey: string | null; displayOrder: number; id: string }> = {}) => {
  n++;
  return { id: o.id ?? `p${n}`, url: `https://b/${n}.webp`, thumbUrl: `https://b/${n}-t.webp`, blurDataUrl: "data:image/webp;base64,AA==",
    caption: `photo ${n}`, width: 1600, height: 1200, category, isCover: o.isCover ?? false, pairKey: o.pairKey ?? null, displayOrder: o.displayOrder ?? n };
};

describe("card photos", () => {
  it("uses the chosen cover", () => {
    const c = row("PORTFOLIO", { isCover: true, displayOrder: 5 });
    expect(pickCardPhotos([row("PORTFOLIO", { displayOrder: 1 }), c]).cover?.id).toBe(c.id);
  });
  it("without a cover, prefers finished work over before/workshop", () => {
    const after = row("AFTER", { displayOrder: 3 });
    expect(pickCardPhotos([row("BEFORE", { displayOrder: 1 }), row("WORKSHOP", { displayOrder: 2 }), after]).cover?.id).toBe(after.id);
  });
  it("never uses the profile photo as the cover, and returns it as the avatar", () => {
    const prof = row("PROFILE");
    const r = pickCardPhotos([prof]);
    expect(r.cover).toBeNull();
    expect(r.avatar?.id).toBe(prof.id);
  });
  it("no photos → nothing (the card shows the trade illustration)", () => {
    expect(pickCardPhotos([])).toEqual({ cover: null, avatar: null });
  });
  it("uses the caption as alt text", () => {
    const p = row("PORTFOLIO", { isCover: true });
    expect(pickCardPhotos([p]).cover?.alt).toBe(p.caption);
  });
});

describe("gallery", () => {
  it("turns a before/after pair into one slider, in the artisan's order", () => {
    const a = row("PORTFOLIO", { displayOrder: 1 }), b = row("BEFORE", { pairKey: "k", displayOrder: 2 }),
      c = row("PORTFOLIO", { displayOrder: 3 }), d = row("AFTER", { pairKey: "k", displayOrder: 4 });
    const g = buildGallery([d, c, b, a, row("PROFILE")]);
    expect(g.items.map((i) => i.kind)).toEqual(["photo", "pair", "photo"]);
    const pair = g.items[1] as Extract<(typeof g.items)[number], { kind: "pair" }>;
    expect([pair.before.id, pair.after.id]).toEqual([b.id, d.id]);
    expect(g.lightbox.map((p) => p.id)).toEqual([a.id, b.id, d.id, c.id]);
  });
  it("a half pair (partner not approved) shows as a labelled single photo", () => {
    const g = buildGallery([row("BEFORE", { pairKey: "x" })]);
    expect(g.items[0]).toMatchObject({ kind: "photo", label: "Before" });
  });
});

describe("responsive sources", () => {
  it("offers the thumbnail and the full size", () => {
    expect(srcSetOf({ url: "u", thumbUrl: "t", width: 1600 })).toBe("t 480w, u 1600w");
    expect(srcSetOf({ url: "u", thumbUrl: "t", width: 300 })).toBe("t 300w, u 300w");
  });
});

describe("copied-photo detection", () => {
  const grad = Array.from({ length: 72 }, (_, i) => (i % 9) * 20 + Math.floor(i / 9));
  it("hashes to 16 hex chars", () => {
    const h = dhashFromGrey(grad);
    expect(isPhash(h)).toBe(true);
    expect(h).toBe("0000000000000000"); // brightness rises left→right everywhere
    expect(dhashFromGrey(grad.map((v) => 255 - v))).toBe("ffffffffffffffff");
  });
  it("hamming distance counts differing bits", () => {
    expect(hamming("0000000000000000", "0000000000000000")).toBe(0);
    expect(hamming("0000000000000000", "000000000000000f")).toBe(4);
    expect(hamming("0000000000000000", "ffffffffffffffff")).toBe(64);
  });
  it("same picture slightly changed → same; different → not; flat images ignored", () => {
    expect(looksSame("a1b2c3d4e5f60718", "a1b2c3d4e5f60719")).toBe(true);
    expect(looksSame("a1b2c3d4e5f60718", "5e4d3c2b1a09f8e7")).toBe(false);
    expect(looksSame("0000000000000000", "0000000000000000")).toBe(false);
    expect(looksSame(null, "a1b2c3d4e5f60718")).toBe(false);
  });
});
