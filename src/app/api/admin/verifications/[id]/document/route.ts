import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { requireRole } from "@/lib/auth/session";
import { getStorage } from "@/lib/providers/storage";
import { CONTENT_TYPES } from "@/lib/validation/upload";

/** Documents are private: only admins reach them, every view is logged, nothing is cached. */
export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const admin = await requireRole("ADMIN");
  const rec = await db.verificationRecord.findUnique({ where: { id: params.id } });
  if (!rec?.documentKey) throw new HttpError(404, "No document.");
  const data = await getStorage().get(rec.documentKey);
  if (!data) throw new HttpError(404, "Document not found.");
  await db.auditLog.create({ data: { actorId: admin.id, action: "verification.document_viewed", entity: "VerificationRecord", entityId: rec.id } });
  const ext = rec.documentKey.split(".").pop() as keyof typeof CONTENT_TYPES;
  return new Response(new Uint8Array(data), { headers: {
    "Content-Type": CONTENT_TYPES[ext] ?? "application/octet-stream",
    "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff", "Content-Disposition": "inline",
  } });
});
