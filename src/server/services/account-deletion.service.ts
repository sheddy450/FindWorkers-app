import { randomBytes } from "node:crypto";
import { verify } from "@node-rs/argon2";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { delBlobs } from "@/lib/providers/blob";
import { getStorage } from "@/lib/providers/storage";
import { FORMER_NAME, PENDING_REQUEST_STATUSES, REMOVED_ADDRESS, REMOVED_JOB, canSelfDelete, lockedPasswordHash } from "@/lib/account/deletion";

/**
 * A customer or artisan deletes their own account. See src/lib/account/deletion.ts for exactly what is
 * removed, cancelled and anonymised. Everything in the database happens in one transaction (all or
 * nothing); stored files are deleted afterwards, best effort, so a storage hiccup can't block deletion.
 */
export async function deleteOwnAccount(userId: string, password: string): Promise<void> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, status: true, passwordHash: true, deletedAt: true },
  });
  if (!user || user.deletedAt) throw new HttpError(404, "Account not found.");
  if (!canSelfDelete(user.role)) throw new HttpError(403, "Admin accounts can't be deleted from here.");
  const ok = await verify(user.passwordHash, password).catch(() => false);
  if (!ok) throw new HttpError(400, "That password isn't right.");
  const role = user.role;

  // Files to remove once the database work has committed.
  const [workPhotos, documents, requestPhotos] = await Promise.all([
    db.artisanPhoto.findMany({ where: { artisanId: userId }, select: { url: true, thumbUrl: true } }),
    db.verificationRecord.findMany({ where: { artisanId: userId, documentKey: { not: null } }, select: { documentKey: true } }),
    db.requestPhoto.findMany({ where: { request: { customerId: userId } }, select: { storageKey: true } }),
  ]);

  await db.$transaction(async (tx) => {
    // 1. Requests still in progress are cancelled, and the other person is told.
    const pending = await tx.serviceRequest.findMany({
      where: { OR: [{ customerId: userId }, { artisanId: userId }], status: { in: [...PENDING_REQUEST_STATUSES] } },
      select: { id: true, status: true, customerId: true, artisanId: true },
    });
    for (const r of pending) {
      await tx.serviceRequest.update({ where: { id: r.id }, data: { status: "CANCELLED" } });
      await tx.requestStatusEvent.create({ data: { requestId: r.id, fromStatus: r.status, toStatus: "CANCELLED", actorId: userId } });
      const other = r.customerId === userId ? r.artisanId : r.customerId;
      await tx.notification.create({ data: { userId: other, type: "request.status", payload: { requestId: r.id, to: "CANCELLED" } } });
    }

    // 2. Customer side: addresses and request photos go; open jobs close (artisans who quoted are told);
    //    every job's text is replaced.
    await tx.serviceRequest.updateMany({ where: { customerId: userId }, data: { address: REMOVED_ADDRESS } });
    await tx.requestPhoto.deleteMany({ where: { request: { customerId: userId } } });
    const openJobs = await tx.jobPost.findMany({ where: { customerId: userId, status: "OPEN" }, select: { id: true } });
    for (const j of openJobs) {
      await tx.jobPost.update({ where: { id: j.id }, data: { status: "CLOSED" } });
      const quoted = await tx.jobQuote.findMany({ where: { jobId: j.id, status: "SENT" }, select: { artisanId: true } });
      await tx.jobQuote.updateMany({ where: { jobId: j.id, status: "SENT" }, data: { status: "DECLINED" } });
      if (quoted.length) await tx.notification.createMany({ data: quoted.map((q) => ({ userId: q.artisanId, type: "quote.declined", payload: { jobId: j.id, closed: true } })) });
    }
    await tx.jobPost.updateMany({ where: { customerId: userId }, data: { ...REMOVED_JOB } });

    // 3. Artisan side: the public profile is emptied and hidden from search (no services, no location).
    if (role === "ARTISAN") {
      await tx.jobQuote.updateMany({ where: { artisanId: userId, status: "SENT" }, data: { status: "WITHDRAWN" } });
      await tx.artisanService.deleteMany({ where: { artisanId: userId } });
      await tx.availabilitySlot.deleteMany({ where: { artisanId: userId } });
      await tx.artisanPhoto.deleteMany({ where: { artisanId: userId } });
      await tx.verificationRecord.deleteMany({ where: { artisanId: userId } });
      await tx.artisanDailyStat.deleteMany({ where: { artisanId: userId } });
      await tx.artisan.updateMany({ where: { userId }, data: {
        businessName: FORMER_NAME.ARTISAN, bio: null, photoKey: null, yearsExperience: 0, state: null, lga: null,
        priceMinKobo: null, priceMaxKobo: null, availability: "UNAVAILABLE", proUntil: null,
      } });
      await tx.$executeRaw`UPDATE "Artisan" SET geog = NULL WHERE "userId" = ${userId}`;
    }

    // 4. Their helpful-votes on reviews go, and the counts follow.
    const votes = await tx.reviewVote.findMany({ where: { userId }, select: { reviewId: true } });
    for (const v of votes) await tx.review.updateMany({ where: { id: v.reviewId, helpfulCount: { gt: 0 } }, data: { helpfulCount: { decrement: 1 } } });
    await tx.reviewVote.deleteMany({ where: { userId } });

    // 5. Personal leftovers.
    await tx.notification.deleteMany({ where: { userId } });
    await tx.passwordResetToken.deleteMany({ where: { userId } });
    await tx.phoneOtp.deleteMany({ where: { userId } });
    await tx.block.deleteMany({ where: { OR: [{ blockerId: userId }, { blockedId: userId }] } });

    // 6. The account itself: no name, no contact details, no way to log in. passwordChangedAt ends
    //    every session at once; the phone number is free to register again.
    const now = new Date();
    await tx.user.update({ where: { id: userId }, data: {
      name: FORMER_NAME[role], email: null, phoneE164: null, phoneVerifiedAt: null,
      passwordHash: lockedPasswordHash(randomBytes(24).toString("hex")),
      status: "DEACTIVATED", deletedAt: now, passwordChangedAt: now,
    } });

    // 7. A record that it happened, with nothing personal in it.
    await tx.auditLog.create({ data: { actorId: userId, action: "account.deleted", entity: "User", entityId: userId, meta: { role } } });
  }, { timeout: 30_000 });

  // Stored files: work photos (Vercel Blob), ID documents and request photos (private storage).
  await delBlobs(workPhotos.flatMap((p) => [p.url, p.thumbUrl]));
  const keys = [...documents.map((d) => d.documentKey!), ...requestPhotos.map((p) => p.storageKey)];
  if (keys.length) {
    try {
      const storage = getStorage();
      await Promise.all(keys.map((k) => storage.delete(k).catch((e) => console.error("[account-delete] file", e))));
    } catch (e) { console.error("[account-delete] storage unavailable; files left:", keys.length, e); }
  }
}
