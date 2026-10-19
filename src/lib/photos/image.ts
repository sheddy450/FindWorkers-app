/**
 * Server-side image checks without native libraries: identify WebP/JPEG by their bytes, read
 * dimensions, and strip metadata (EXIF holds GPS location; phones add it to photos).
 * The browser already re-encodes photos (which drops metadata); this is the backstop for anything
 * that bypasses the app's uploader.
 */
export type ImageInfo = { type: "webp" | "jpeg"; width: number; height: number };

const u32le = (b: Uint8Array, o: number) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const fourcc = (b: Uint8Array, o: number) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

function isWebp(b: Uint8Array) { return b.length >= 20 && fourcc(b, 0) === "RIFF" && fourcc(b, 8) === "WEBP"; }
function isJpeg(b: Uint8Array) { return b.length >= 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff; }

type Chunk = { id: string; start: number; dataStart: number; size: number; end: number };
function webpChunks(b: Uint8Array): Chunk[] | null {
  const chunks: Chunk[] = [];
  let o = 12;
  while (o + 8 <= b.length) {
    const size = u32le(b, o + 4);
    const dataStart = o + 8, end = dataStart + size + (size & 1);
    if (dataStart + size > b.length) return null; // truncated or malformed
    chunks.push({ id: fourcc(b, o), start: o, dataStart, size, end: Math.min(end, b.length) });
    o = end;
  }
  return chunks.length ? chunks : null;
}

function webpInfo(b: Uint8Array): ImageInfo | null {
  const chunks = webpChunks(b);
  if (!chunks) return null;
  if (chunks.some((c) => c.id === "ANIM" || c.id === "ANMF")) return null; // no animated images
  const x = chunks.find((c) => c.id === "VP8X");
  if (x && x.size >= 10) {
    if (b[x.dataStart] & 0x02) return null; // animation flag
    const w = 1 + (b[x.dataStart + 4] | (b[x.dataStart + 5] << 8) | (b[x.dataStart + 6] << 16));
    const h = 1 + (b[x.dataStart + 7] | (b[x.dataStart + 8] << 8) | (b[x.dataStart + 9] << 16));
    return { type: "webp", width: w, height: h };
  }
  const lossy = chunks.find((c) => c.id === "VP8 ");
  if (lossy && lossy.size >= 10) {
    const d = lossy.dataStart;
    if (b[d + 3] !== 0x9d || b[d + 4] !== 0x01 || b[d + 5] !== 0x2a) return null;
    return { type: "webp", width: (b[d + 6] | (b[d + 7] << 8)) & 0x3fff, height: (b[d + 8] | (b[d + 9] << 8)) & 0x3fff };
  }
  const lossless = chunks.find((c) => c.id === "VP8L");
  if (lossless && lossless.size >= 5 && b[lossless.dataStart] === 0x2f) {
    const v = u32le(b, lossless.dataStart + 1);
    return { type: "webp", width: (v & 0x3fff) + 1, height: ((v >>> 14) & 0x3fff) + 1 };
  }
  return null;
}

function jpegInfo(b: Uint8Array): ImageInfo | null {
  let o = 2;
  while (o + 4 <= b.length) {
    if (b[o] !== 0xff) return null;
    const marker = b[o + 1];
    if (marker === 0xd9 || marker === 0xda) return null; // reached image data without a size
    const len = (b[o + 2] << 8) | b[o + 3];
    const isSof = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof && o + 9 <= b.length) return { type: "jpeg", height: (b[o + 5] << 8) | b[o + 6], width: (b[o + 7] << 8) | b[o + 8] };
    o += 2 + len;
  }
  return null;
}

/** Type and size from the file's own bytes (the browser-supplied type is never trusted), or null. */
export function imageInfo(b: Uint8Array): ImageInfo | null {
  if (isWebp(b)) return webpInfo(b);
  if (isJpeg(b)) return jpegInfo(b);
  return null;
}

/** WebP: drops EXIF and XMP chunks and clears their flags. Returns the input unchanged if there's nothing to strip. */
function stripWebp(b: Uint8Array): Uint8Array {
  const chunks = webpChunks(b);
  if (!chunks) return b;
  const keep = chunks.filter((c) => c.id !== "EXIF" && c.id !== "XMP ");
  if (keep.length === chunks.length) return b;
  const parts = keep.map((c) => b.slice(c.start, c.end));
  const vp8x = keep.findIndex((c) => c.id === "VP8X");
  if (vp8x >= 0) parts[vp8x][8] &= ~(0x08 | 0x04); // clear EXIF + XMP flags
  const body = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(12 + body);
  out.set(b.slice(0, 12));
  const riffSize = 4 + body;
  out[4] = riffSize & 0xff; out[5] = (riffSize >>> 8) & 0xff; out[6] = (riffSize >>> 16) & 0xff; out[7] = (riffSize >>> 24) & 0xff;
  let o = 12;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

/** JPEG: drops APP1 (EXIF/XMP, which carries GPS) and APP13 (Photoshop/IPTC) segments; keeps everything else. */
function stripJpeg(b: Uint8Array): Uint8Array {
  const out: Uint8Array[] = [b.slice(0, 2)];
  let o = 2;
  while (o + 4 <= b.length && b[o] === 0xff) {
    const marker = b[o + 1];
    if (marker === 0xda) break; // start of scan: the rest is image data
    const len = (b[o + 2] << 8) | b[o + 3];
    const segEnd = o + 2 + len;
    if (segEnd > b.length) return b;
    if (marker !== 0xe1 && marker !== 0xed) out.push(b.slice(o, segEnd));
    o = segEnd;
  }
  out.push(b.slice(o));
  const total = out.reduce((n, p) => n + p.length, 0);
  const res = new Uint8Array(total);
  let p = 0;
  for (const part of out) { res.set(part, p); p += part.length; }
  return res;
}

/** Removes location and other metadata from a WebP or JPEG. */
export function stripImageMetadata(b: Uint8Array): Uint8Array {
  if (isWebp(b)) return stripWebp(b);
  if (isJpeg(b)) return stripJpeg(b);
  return b;
}

/** True if any EXIF/XMP metadata remains (used in tests and as a final safety check). */
export function hasMetadata(b: Uint8Array): boolean {
  if (isWebp(b)) return (webpChunks(b) ?? []).some((c) => c.id === "EXIF" || c.id === "XMP ");
  if (isJpeg(b)) {
    let o = 2;
    while (o + 4 <= b.length && b[o] === 0xff && b[o + 1] !== 0xda) {
      if (b[o + 1] === 0xe1 || b[o + 1] === 0xed) return true;
      o += 2 + ((b[o + 2] << 8) | b[o + 3]);
    }
  }
  return false;
}
