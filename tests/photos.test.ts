import { describe, it, expect } from "vitest";
import { hasMetadata, imageInfo, stripImageMetadata } from "../src/lib/photos/image";
import { blurDataUrlOk, captionError, completeness, isPhotoCategory, moveId, sameIds, sizeOk } from "../src/lib/photos/rules";

// --- tiny synthetic images (headers only; enough for parsing) ---
const le32 = (n: number) => [n & 255, (n >> 8) & 255, (n >> 16) & 255, (n >> 24) & 255];
const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));
function chunk(id: string, data: number[]) { const pad = data.length & 1 ? [0] : []; return [...ascii(id), ...le32(data.length), ...data, ...pad]; }
function riff(chunks: number[][]) { const body = chunks.flat(); return new Uint8Array([...ascii("RIFF"), ...le32(4 + body.length), ...ascii("WEBP"), ...body]); }
const vp8 = (w: number, h: number) => chunk("VP8 ", [0, 0, 0, 0x9d, 0x01, 0x2a, w & 255, (w >> 8) & 0x3f, h & 255, (h >> 8) & 0x3f, 0, 0]);
const vp8x = (w: number, h: number, flags: number) => chunk("VP8X", [flags, 0, 0, 0, (w - 1) & 255, ((w - 1) >> 8) & 255, 0, (h - 1) & 255, ((h - 1) >> 8) & 255, 0]);
const exif = chunk("EXIF", ascii("Exif GPS 6.52N 3.37E"));
const xmp = chunk("XMP ", ascii("<x:xmpmeta/>"));

function jpeg(w: number, h: number, withExif: boolean) {
  const app0 = [0xff, 0xe0, 0, 16, ...ascii("JFIF"), 0, 1, 1, 0, 0, 1, 0, 1, 0, 0];
  const exifData = ascii("Exif\0\0GPS:6.52N");
  const app1 = [0xff, 0xe1, 0, exifData.length + 2, ...exifData];
  const sof = [0xff, 0xc0, 0, 11, 8, (h >> 8) & 255, h & 255, (w >> 8) & 255, w & 255, 1, 1, 0x11, 0];
  const sos = [0xff, 0xda, 0, 8, 1, 1, 0, 0, 0x3f, 0, 0x12, 0x34, 0xff, 0xd9];
  return new Uint8Array([0xff, 0xd8, ...app0, ...(withExif ? app1 : []), ...sof, ...sos]);
}

describe("image detection", () => {
  it("reads lossy WebP size", () => expect(imageInfo(riff([vp8(1600, 900)]))).toEqual({ type: "webp", width: 1600, height: 900 }));
  it("reads extended WebP size", () => expect(imageInfo(riff([vp8x(1200, 800, 0x08), exif, vp8(1200, 800)]))).toEqual({ type: "webp", width: 1200, height: 800 }));
  it("reads JPEG size", () => expect(imageInfo(jpeg(1024, 768, true))).toEqual({ type: "jpeg", width: 1024, height: 768 }));
  it("rejects other files and animated WebP", () => {
    expect(imageInfo(new TextEncoder().encode("<svg onload=alert(1)>"))).toBeNull();
    expect(imageInfo(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 13, 10, 26, 10]))).toBeNull();
    expect(imageInfo(riff([vp8x(100, 100, 0x02), vp8(100, 100)]))).toBeNull();
    expect(imageInfo(riff([chunk("ANIM", [0, 0, 0, 0, 0, 0]), vp8(10, 10)]))).toBeNull();
  });
  it("rejects truncated files", () => expect(imageInfo(riff([vp8(10, 10)]).slice(0, 25))).toBeNull());
});

describe("removing location data", () => {
  it("strips EXIF and XMP from WebP and keeps it valid", () => {
    const img = riff([vp8x(1200, 800, 0x08 | 0x04), exif, xmp, vp8(1200, 800)]);
    expect(hasMetadata(img)).toBe(true);
    const clean = stripImageMetadata(img);
    expect(hasMetadata(clean)).toBe(false);
    expect(imageInfo(clean)).toEqual({ type: "webp", width: 1200, height: 800 });
    expect(clean[20] & 0x0c).toBe(0); // EXIF/XMP flags cleared in VP8X
    expect(le32(clean.length - 8)).toEqual([...clean.slice(4, 8)]); // RIFF size updated
    expect(new TextDecoder().decode(clean)).not.toContain("GPS");
  });
  it("strips EXIF from JPEG and keeps it valid", () => {
    const img = jpeg(800, 600, true);
    const clean = stripImageMetadata(img);
    expect(hasMetadata(clean)).toBe(false);
    expect(imageInfo(clean)).toEqual({ type: "jpeg", width: 800, height: 600 });
    expect(new TextDecoder().decode(clean)).not.toContain("GPS");
  });
  it("leaves clean images untouched", () => {
    const img = riff([vp8(10, 10)]);
    expect(stripImageMetadata(img)).toBe(img);
  });
});

describe("photo rules", () => {
  it("requires a real caption (it's the alt text)", () => {
    expect(captionError("")).not.toBeNull();
    expect(captionError("pic")).not.toBeNull();
    expect(captionError("New kitchen sink pipes")).toBeNull();
    expect(captionError("x".repeat(141))).not.toBeNull();
  });
  it("only accepts small inline blur previews", () => {
    expect(blurDataUrlOk("data:image/webp;base64,UklGRg==")).toBe(true);
    expect(blurDataUrlOk("https://evil.example/x.png")).toBe(false);
    expect(blurDataUrlOk("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false);
    expect(blurDataUrlOk("data:image/webp;base64," + "A".repeat(3000))).toBe(false);
  });
  it("checks sizes and categories", () => {
    expect(sizeOk(1600, 1200, 1600)).toBe(true);
    expect(sizeOk(1601, 10, 1600)).toBe(false);
    expect(isPhotoCategory("BEFORE")).toBe(true);
    expect(isPhotoCategory("SELFIE")).toBe(false);
  });
  it("reorders safely", () => {
    expect(moveId(["a", "b", "c"], "c", -1)).toEqual(["a", "c", "b"]);
    expect(moveId(["a", "b"], "a", -1)).toEqual(["a", "b"]);
    expect(sameIds(["a", "b", "c"], ["c", "a", "b"])).toBe(true);
    expect(sameIds(["a", "b"], ["a", "a"])).toBe(false);
    expect(sameIds(["a", "b"], ["a", "x"])).toBe(false);
  });
  it("scores profile completeness", () => {
    const none = completeness({ hasProfilePhoto: false, workPhotos: 0, hasBio: false, hasPrice: false, services: 0, hasLocation: false, idVerified: false });
    expect(none.percent).toBe(0);
    const all = completeness({ hasProfilePhoto: true, workPhotos: 5, hasBio: true, hasPrice: true, services: 2, hasLocation: true, idVerified: true });
    expect(all.percent).toBe(100);
    expect(none.steps[0].label).toContain("0/3");
  });
});
