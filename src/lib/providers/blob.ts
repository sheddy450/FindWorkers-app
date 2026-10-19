import { NotConfiguredError } from "./storage";

/**
 * Minimal Vercel Blob client (public files), matching the official @vercel/blob SDK's HTTP calls:
 * PUT https://vercel.com/api/blob/?pathname=… and POST …/delete, API version 13.
 * Enable it in Vercel → Storage → Blob; that adds BLOB_READ_WRITE_TOKEN to the project.
 */
const API = (process.env.VERCEL_BLOB_API_URL?.trim() || "https://vercel.com/api/blob").replace(/\/+$/, "");
const API_VERSION = "13";

function token(): string {
  const t = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  if (!t) throw new NotConfiguredError("Photo storage isn't set up yet.");
  return t;
}
export const blobConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN?.trim();

function headers(t: string): Record<string, string> {
  const storeId = t.split("_")[3] ?? ""; // vercel_blob_rw_<storeId>_<secret>
  return { authorization: `Bearer ${t}`, "x-api-version": API_VERSION, "x-vercel-blob-store-id": storeId };
}

/** Uploads a public file. A random suffix is added so URLs can't be guessed or overwritten. */
export async function putPublic(pathname: string, body: Uint8Array, contentType: string): Promise<{ url: string; pathname: string }> {
  const t = token();
  const res = await fetch(`${API}/?${new URLSearchParams({ pathname })}`, {
    method: "PUT",
    headers: {
      ...headers(t), "x-vercel-blob-access": "public", "x-content-type": contentType,
      "x-add-random-suffix": "1", "x-cache-control-max-age": String(60 * 60 * 24 * 365),
    },
    body: Buffer.from(body),
    cache: "no-store",
  });
  const data = await res.json().catch(() => null) as { url?: string; pathname?: string; error?: { message?: string } } | null;
  if (!res.ok || !data?.url) throw new Error(`Blob upload failed (${res.status}): ${data?.error?.message ?? "no message"}`);
  return { url: data.url, pathname: data.pathname ?? pathname };
}

/** Deletes files by URL. Never throws: a leftover file is better than a failed request. */
export async function delBlobs(urls: string[]): Promise<void> {
  if (!urls.length || !blobConfigured()) return;
  try {
    const t = token();
    const res = await fetch(`${API}/delete`, {
      method: "POST", headers: { ...headers(t), "content-type": "application/json" },
      body: JSON.stringify({ urls }), cache: "no-store",
    });
    if (!res.ok) console.error("[blob] delete failed", res.status);
  } catch (e) { console.error("[blob] delete failed", e); }
}
