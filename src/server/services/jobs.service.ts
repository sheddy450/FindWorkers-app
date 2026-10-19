import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { NIGERIA_STATES } from "@/lib/validation/artisan";
import { stateLabel } from "@/lib/seo/site";
import { LIMITS, minutesFrom, type Limit } from "@/lib/security/rate-limit-rules";
import { hitLimit } from "./rate-limit.service";
import {
  MAX_QUOTES_PER_JOB, expiryFrom, hiredRequestDescription, jobView, parseJob, parseQuote, quoteBlocker,
  type Errors,
} from "@/lib/jobs/rules";

export class FieldErrors extends Error { constructor(public errors: Errors) { super("Invalid input"); } }

const limited = async (limit: Limit, id: string, what: string) => {
  const r = await hitLimit(limit, id);
  if (!r.ok) throw new HttpError(429, `You've ${what} a lot recently. Try again in ${minutesFrom(r.retryAfterSec)} minutes.`);
};

/** Post a job, then let matching artisans (same service, same state) know about it. */
export async function createJob(customerId: string, raw: Record<string, unknown>) {
  const p = parseJob(raw, NIGERIA_STATES);
  if (!p.ok) throw new FieldErrors(p.errors);
  const v = p.value;
  const category = await db.serviceCategory.findFirst({ where: { id: v.categoryId, isActive: true }, select: { id: true } });
  if (!category) throw new FieldErrors({ categoryId: "Choose one of the services in the list." });
  await limited(LIMITS.jobPostPerUser, customerId, "posted jobs");

  const job = await db.jobPost.create({ data: {
    customerId, categoryId: v.categoryId, title: v.title, description: v.description, state: v.state, lga: v.lga,
    budgetMinKobo: v.budgetMinNaira != null ? v.budgetMinNaira * 100 : null, budgetMaxKobo: v.budgetMaxNaira != null ? v.budgetMaxNaira * 100 : null,
    timing: v.timing, preferredDate: v.preferredDate ? new Date(`${v.preferredDate}T12:00:00Z`) : null, expiresAt: expiryFrom(),
  } });

  const artisans = await db.artisan.findMany({
    where: { state: v.state, userId: { not: customerId }, services: { some: { categoryId: v.categoryId } }, user: { status: "ACTIVE" } },
    select: { userId: true }, take: 300,
  });
  if (artisans.length) {
    await db.notification.createMany({ data: artisans.map((a) => ({ userId: a.userId, type: "job.new", payload: { jobId: job.id } })) });
  }
  return { id: job.id, notified: artisans.length };
}

/** A customer's own jobs, newest first, with how many quotes each has. */
export async function myJobs(customerId: string) {
  const jobs = await db.jobPost.findMany({
    where: { customerId }, orderBy: { createdAt: "desc" }, take: 50,
    include: { category: { select: { name: true, slug: true } }, _count: { select: { quotes: { where: { status: { in: ["SENT", "ACCEPTED"] } } } } } },
  });
  return jobs.map((j) => ({ ...j, view: jobView(j), quoteCount: j._count.quotes }));
}

/** Open jobs an artisan can quote: their services, their state. Same LGA first, then newest. */
export async function jobBoard(artisanId: string) {
  const a = await db.artisan.findUnique({ where: { userId: artisanId }, select: { state: true, lga: true, services: { select: { categoryId: true } } } });
  if (!a?.state || a.services.length === 0) return { ready: false as const, jobs: [] };
  const jobs = await db.jobPost.findMany({
    where: { status: "OPEN", expiresAt: { gt: new Date() }, state: a.state, categoryId: { in: a.services.map((s) => s.categoryId) }, customerId: { not: artisanId } },
    orderBy: { createdAt: "desc" }, take: 60,
    include: {
      category: { select: { name: true, slug: true } },
      _count: { select: { quotes: { where: { status: { in: ["SENT", "ACCEPTED"] } } } } },
      quotes: { where: { artisanId }, select: { status: true, priceKobo: true } },
    },
  });
  const near = (lga: string) => !!a.lga && lga.trim().toLowerCase() === a.lga.trim().toLowerCase();
  const sorted = [...jobs].sort((x, y) => Number(near(y.lga)) - Number(near(x.lga)));
  return { ready: true as const, state: a.state, jobs: sorted.map((j) => ({ ...j, quoteCount: j._count.quotes, myQuote: j.quotes[0] ?? null, nearYou: near(j.lga) })) };
}

/** One job, shaped for whoever is looking. Customers see all quotes; artisans see only their own. */
export async function jobForViewer(jobId: string, viewer: { id: string; role: "CUSTOMER" | "ARTISAN" | "ADMIN" }) {
  const job = await db.jobPost.findUnique({
    where: { id: jobId },
    include: { category: { select: { id: true, name: true, slug: true } }, customer: { select: { name: true } } },
  });
  if (!job) return null;
  const view = jobView(job);
  const isOwner = job.customerId === viewer.id;
  const activeQuotes = { jobId, status: { in: ["SENT", "ACCEPTED"] as ("SENT" | "ACCEPTED")[] } };

  if (isOwner || viewer.role === "ADMIN") {
    const quotes = await db.jobQuote.findMany({
      where: activeQuotes, orderBy: { priceKobo: "asc" },
      include: { artisan: { select: { userId: true, businessName: true, avgRating: true, reviewCount: true, completedJobs: true, lga: true, state: true,
        verifications: { where: { status: "APPROVED" }, select: { type: true } } } } },
    });
    // The hired quote first, then cheapest first.
    quotes.sort((a, b) => Number(b.status === "ACCEPTED") - Number(a.status === "ACCEPTED"));
    return { job, view, role: "owner" as const, quotes, canAct: isOwner };
  }
  if (viewer.role !== "ARTISAN") return null; // other customers can't browse people's jobs
  const [artisan, myQuote, quoteCount] = await Promise.all([
    db.artisan.findUnique({ where: { userId: viewer.id }, select: { state: true, services: { select: { categoryId: true } } } }),
    db.jobQuote.findUnique({ where: { jobId_artisanId: { jobId, artisanId: viewer.id } } }),
    db.jobQuote.count({ where: activeQuotes }),
  ]);
  const offersService = !!artisan?.services.some((s) => s.categoryId === job.categoryId);
  const sameState = artisan?.state === job.state;
  // Artisans only see jobs they could quote, plus ones they already quoted.
  if (!myQuote && (!offersService || !sameState)) return null;
  const blocker = quoteBlocker({ view, isOwnJob: false, offersService, sameState, quoteCount,
    alreadyQuoted: !!myQuote && myQuote.status === "SENT" });
  return { job, view, role: "artisan" as const, myQuote, quoteCount, blocker };
}

/** Send a quote, or update one already sent. The customer is notified the first time. */
export async function sendQuote(artisanId: string, jobId: string, raw: Record<string, unknown>) {
  const p = parseQuote(raw);
  if (!p.ok) throw new FieldErrors(p.errors);
  const viewer = await jobForViewer(jobId, { id: artisanId, role: "ARTISAN" });
  if (!viewer || viewer.role !== "artisan") throw new HttpError(404, "Job not found.");
  if (viewer.blocker) throw new HttpError(409, viewer.blocker);
  if (viewer.myQuote && viewer.myQuote.status !== "SENT" && viewer.myQuote.status !== "WITHDRAWN") throw new HttpError(409, "This quote can't be changed any more.");
  await limited(LIMITS.quotePerUser, artisanId, "sent quotes");

  const data = { priceKobo: p.value.priceNaira * 100, message: p.value.message, canStart: p.value.canStart, status: "SENT" as const };
  const isNew = !viewer.myQuote || viewer.myQuote.status === "WITHDRAWN";
  return db.$transaction(async (tx) => {
    // Re-check the cap inside the transaction so two artisans can't both take the last slot.
    if (isNew) {
      const n = await tx.jobQuote.count({ where: { jobId, status: { in: ["SENT", "ACCEPTED"] } } });
      if (n >= MAX_QUOTES_PER_JOB) throw new HttpError(409, "This job already has the most quotes allowed.");
    }
    const q = await tx.jobQuote.upsert({ where: { jobId_artisanId: { jobId, artisanId } }, create: { jobId, artisanId, ...data }, update: data });
    if (isNew) await tx.notification.create({ data: { userId: viewer.job.customerId, type: "quote.new", payload: { jobId, quoteId: q.id } } });
    return q;
  });
}

export async function withdrawQuote(artisanId: string, jobId: string) {
  const res = await db.jobQuote.updateMany({ where: { jobId, artisanId, status: "SENT" }, data: { status: "WITHDRAWN" } });
  if (res.count !== 1) throw new HttpError(409, "There's no active quote to withdraw.");
}

/**
 * Hire: the chosen quote becomes an accepted service request (the usual chat, status steps and review
 * follow from there). Every other quote is declined and those artisans are told.
 */
export async function acceptQuote(customerId: string, jobId: string, quoteId: string) {
  const now = new Date();
  return db.$transaction(async (tx) => {
    const job = await tx.jobPost.findUnique({ where: { id: jobId } });
    if (!job || job.customerId !== customerId) throw new HttpError(404, "Job not found.");
    if (jobView(job, now) !== "OPEN") throw new HttpError(409, job.status === "HIRED" ? "You've already hired someone for this job." : "This job is closed. Post it again to get new quotes.");
    const quote = await tx.jobQuote.findFirst({ where: { id: quoteId, jobId, status: "SENT" } });
    if (!quote) throw new HttpError(409, "That quote is no longer available. The artisan may have withdrawn it.");

    // Guarded: if the customer double-taps Hire, only one request is created.
    const claimed = await tx.jobPost.updateMany({ where: { id: jobId, status: "OPEN" }, data: { status: "HIRED" } });
    if (claimed.count !== 1) throw new HttpError(409, "You've already hired someone for this job.");

    const request = await tx.serviceRequest.create({ data: {
      customerId, artisanId: quote.artisanId, categoryId: job.categoryId, status: "ACCEPTED",
      description: hiredRequestDescription(job, quote),
      address: `${job.lga}, ${stateLabel(job.state)} (share the exact address in the chat)`,
      preferredAt: job.preferredDate,
    } });
    await tx.requestStatusEvent.createMany({ data: [
      { requestId: request.id, toStatus: "REQUESTED", actorId: customerId, at: now },
      { requestId: request.id, fromStatus: "REQUESTED", toStatus: "ACCEPTED", actorId: quote.artisanId, at: new Date(now.getTime() + 1) },
    ] });
    await tx.jobPost.update({ where: { id: jobId }, data: { hiredRequestId: request.id } });
    await tx.jobQuote.update({ where: { id: quote.id }, data: { status: "ACCEPTED" } });
    const others = await tx.jobQuote.findMany({ where: { jobId, status: "SENT", id: { not: quote.id } }, select: { artisanId: true } });
    await tx.jobQuote.updateMany({ where: { jobId, status: "SENT", id: { not: quote.id } }, data: { status: "DECLINED" } });
    await tx.notification.createMany({ data: [
      { userId: quote.artisanId, type: "quote.accepted", payload: { jobId, requestId: request.id } },
      ...others.map((o) => ({ userId: o.artisanId, type: "quote.declined", payload: { jobId } })),
    ] });
    return { requestId: request.id };
  });
}

/** The customer no longer needs the job: stop quotes and let artisans who quoted know. */
export async function closeJob(customerId: string, jobId: string) {
  return db.$transaction(async (tx) => {
    const res = await tx.jobPost.updateMany({ where: { id: jobId, customerId, status: "OPEN" }, data: { status: "CLOSED" } });
    if (res.count !== 1) throw new HttpError(409, "This job is already closed.");
    const quoted = await tx.jobQuote.findMany({ where: { jobId, status: "SENT" }, select: { artisanId: true } });
    await tx.jobQuote.updateMany({ where: { jobId, status: "SENT" }, data: { status: "DECLINED" } });
    if (quoted.length) await tx.notification.createMany({ data: quoted.map((q) => ({ userId: q.artisanId, type: "quote.declined", payload: { jobId, closed: true } })) });
  });
}
