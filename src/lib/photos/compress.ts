/**
 * Browser-side photo preparation (runs on the artisan's phone):
 * resize to ≤1600px, encode as WebP (JPEG where the browser can't make WebP), make a ≤480px
 * thumbnail and a tiny blur preview. Re-drawing through a canvas also discards EXIF metadata
 * (including GPS), and honours the photo's rotation so it isn't sideways.
 */
import { MAX_EDGE, THUMB_EDGE } from "./rules";

export type PreparedPhoto = { image: Blob; thumb: Blob; blur: string; width: number; height: number; previewUrl: string };

const MAX_INPUT_BYTES = 30 * 1024 * 1024;

async function decode(file: File): Promise<{ source: CanvasImageSource; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { source: bmp, width: bmp.width, height: bmp.height, close: () => bmp.close() };
    } catch { /* fall back to <img> below */ }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return { source: img, width: img.naturalWidth, height: img.naturalHeight, close: () => URL.revokeObjectURL(url) };
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("We couldn't open this photo. Try a JPG or PNG, or take a screenshot of it and upload that.");
  }
}

function draw(src: { source: CanvasImageSource; width: number; height: number }, maxEdge: number) {
  const scale = Math.min(1, maxEdge / Math.max(src.width, src.height));
  const w = Math.max(1, Math.round(src.width * scale)), h = Math.max(1, Math.round(src.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Your browser can't process photos. Try another browser.");
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff"; // transparent PNGs get a white background instead of black
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(src.source, 0, 0, w, h);
  return canvas;
}

function toBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** WebP if the browser can make it (some older Safari versions silently return PNG), otherwise JPEG. */
async function encode(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  const webp = await toBlob(canvas, "image/webp", quality);
  if (webp && webp.type === "image/webp") return webp;
  const jpeg = await toBlob(canvas, "image/jpeg", quality);
  if (!jpeg) throw new Error("We couldn't process this photo. Try another one.");
  return jpeg;
}

function blurPreview(src: { source: CanvasImageSource; width: number; height: number }): string {
  for (const edge of [16, 10]) {
    const c = draw(src, edge);
    let url = c.toDataURL("image/webp", 0.4);
    if (!url.startsWith("data:image/webp")) url = c.toDataURL("image/jpeg", 0.4);
    if (url.length <= 2400) return url;
  }
  return draw(src, 6).toDataURL("image/jpeg", 0.3);
}

export async function preparePhoto(file: File): Promise<PreparedPhoto> {
  if (!file.type.startsWith("image/") && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) throw new Error("That file isn't a photo.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That photo is too large (over 30 MB). Choose a smaller one.");
  const src = await decode(file);
  try {
    const full = draw(src, MAX_EDGE);
    const image = await encode(full, 0.82);
    const thumb = await encode(draw(src, THUMB_EDGE), 0.72);
    const blur = blurPreview(src);
    return { image, thumb, blur, width: full.width, height: full.height, previewUrl: URL.createObjectURL(thumb) };
  } finally {
    src.close();
  }
}
