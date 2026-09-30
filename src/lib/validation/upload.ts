export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
/** Identify file type from its first bytes. The browser-supplied type is never trusted. */
export function sniffFileType(b: Buffer): { ext: "jpg" | "png" | "pdf" } | null {
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: "jpg" };
  if (b.length > 8 && b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { ext: "png" };
  if (b.length > 5 && b.subarray(0, 5).toString("latin1") === "%PDF-") return { ext: "pdf" };
  return null;
}
export const CONTENT_TYPES = { jpg: "image/jpeg", png: "image/png", pdf: "application/pdf" } as const;
