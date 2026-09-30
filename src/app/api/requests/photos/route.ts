import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { getStorage, NotConfiguredError } from "@/lib/providers/storage";
import { MAX_UPLOAD_BYTES, sniffFileType } from "@/lib/validation/upload";

/** Uploads a single job photo before the request is created, returns a storage key to attach on submit.
 *  Photos live in a customer-scoped path; the request API only accepts keys under the caller's own id. */
export const POST = handle(async (req) => {
  const user = await requireRole("CUSTOMER");
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) throw new HttpError(422, "Choose a photo to upload.");
  const buf = Buffer.from(await file.arrayBuffer());
  if (buf.length === 0 || buf.length > MAX_UPLOAD_BYTES) throw new HttpError(422, "File must be under 5 MB.");
  const kind = sniffFileType(buf);
  if (!kind || kind.ext === "pdf") throw new HttpError(422, "Upload a JPG or PNG photo.");
  const key = `requests/${user.id}/${randomUUID()}.${kind.ext}`;
  try { await getStorage().put(key, buf); }
  catch (e) { if (e instanceof NotConfiguredError) throw new HttpError(503, "Photo upload isn't available yet."); throw e; }
  return NextResponse.json({ key }, { status: 201 });
});
