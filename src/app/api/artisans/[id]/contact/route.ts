import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { handle, HttpError } from "@/lib/http";
import { currentUser } from "@/lib/auth/session";
import { telHref, whatsappHref } from "@/lib/contact/links";
import { bumpStat } from "@/server/services/pro.service";
import { LIMITS, minutesFrom } from "@/lib/security/rate-limit-rules";
import { hitLimit } from "@/server/services/rate-limit.service";

/** Requires login and is rate-limited per account, so numbers can't be scraped. */
export const GET = handle(async (_req, { params }: { params: { id: string } }) => {
  const user = await currentUser();
  if (!user) throw new HttpError(401, "Log in to contact this artisan.");
  // Stops one account from harvesting every artisan's phone number.
  const limited = await hitLimit(LIMITS.contactRevealPerUser, user.id);
  if (!limited.ok) throw new HttpError(429, `You've viewed a lot of numbers. Try again in ${minutesFrom(limited.retryAfterSec)} minutes.`);
  const a = await db.artisan.findUnique({ where: { userId: params.id }, include: { user: { select: { phoneE164: true, status: true } } } });
  if (!a || a.user.status !== "ACTIVE") throw new HttpError(404, "Artisan not found.");
  const phone = a.user.phoneE164;
  if (!phone) throw new HttpError(409, "This artisan hasn't confirmed a phone number yet.");
  await db.auditLog.create({ data: { actorId: user.id, action: "artisan.contact_revealed", entity: "Artisan", entityId: params.id } });
  if (user.id !== params.id) await bumpStat(params.id, "contactReveals");
  return NextResponse.json({ tel: telHref(phone), whatsapp: whatsappHref(phone, `Hi ${a.businessName}, I found you on FindWorkers and I'd like to ask about a job.`) });
});
