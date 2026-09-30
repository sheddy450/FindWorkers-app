import { randomUUID } from "crypto";
import type { VerificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { getStorage, NotConfiguredError } from "@/lib/providers/storage";
import { MAX_UPLOAD_BYTES, sniffFileType } from "@/lib/validation/upload";
import { SUBMITTABLE, VALIDITY_MONTHS, canDecide, canSubmit } from "@/lib/verification/rules";

export async function submitVerification(artisanId: string, type: VerificationType, file: Buffer) {
  if (!SUBMITTABLE.includes(type)) throw new HttpError(400, "This check can't be submitted with a document.");
  if (file.length === 0 || file.length > MAX_UPLOAD_BYTES) throw new HttpError(422, "File must be under 5 MB.");
  const kind = sniffFileType(file);
  if (!kind) throw new HttpError(422, "Upload a JPG, PNG or PDF file.");
  if (!(await db.artisan.findUnique({ where: { userId: artisanId }, select: { userId: true } })))
    throw new HttpError(409, "Complete your profile before submitting documents.");
  const existing = await db.verificationRecord.findUnique({ where: { artisanId_type: { artisanId, type } } });
  if (existing && !canSubmit(existing.status)) throw new HttpError(409, existing.status === "PENDING" ? "This document is already being reviewed." : "This check is already approved.");

  const key = `verification/${artisanId}/${type.toLowerCase()}-${randomUUID()}.${kind.ext}`;
  try { await getStorage().put(key, file); }
  catch (e) { if (e instanceof NotConfiguredError) throw new HttpError(503, "Document upload isn't available yet."); throw e; }

  return db.verificationRecord.upsert({
    where: { artisanId_type: { artisanId, type } },
    create: { artisanId, type, status: "PENDING", documentKey: key },
    update: { status: "PENDING", documentKey: key, rejectReason: null, reviewedBy: null, reviewedAt: null, expiresAt: null },
  });
}

export async function decideVerification(adminId: string, recordId: string, decision: "APPROVED" | "REJECTED", reason?: string) {
  const rec = await db.verificationRecord.findUnique({ where: { id: recordId } });
  if (!rec) throw new HttpError(404, "Submission not found.");
  if (!canDecide(rec.status)) throw new HttpError(409, "This submission was already reviewed.");
  if (decision === "REJECTED" && (!reason || reason.trim().length < 5)) throw new HttpError(422, "Give the artisan a reason they can act on.");
  const now = new Date();
  const expiresAt = decision === "APPROVED" ? new Date(new Date(now).setMonth(now.getMonth() + VALIDITY_MONTHS)) : null;
  return db.$transaction(async (tx) => {
    // Guarded update: if two admins click at once, only one wins.
    const res = await tx.verificationRecord.updateMany({
      where: { id: recordId, status: "PENDING" },
      data: { status: decision, reviewedBy: adminId, reviewedAt: now, rejectReason: decision === "REJECTED" ? reason!.trim() : null, expiresAt },
    });
    if (res.count !== 1) throw new HttpError(409, "This submission was already reviewed.");
    await tx.auditLog.create({ data: { actorId: adminId, action: `verification.${decision.toLowerCase()}`, entity: "VerificationRecord", entityId: recordId, meta: { type: rec.type, artisanId: rec.artisanId } } });
    await tx.notification.create({ data: { userId: rec.artisanId, type: "verification.decision", payload: { type: rec.type, decision, reason: reason ?? null } } });
  });
}
