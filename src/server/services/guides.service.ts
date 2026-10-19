import { cache } from "react";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { HttpError } from "@/lib/http";
import { parseGuide, type Errors, type PriceRow } from "@/lib/guides/rules";

export class GuideFieldErrors extends Error { constructor(public errors: Errors) { super("Invalid guide"); } }

const LIST_FIELDS = {
  id: true, slug: true, title: true, summary: true, audience: true, body: true, questions: true, redFlags: true, checklist: true,
  publishedAt: true, updatedAt: true, category: { select: { id: true, slug: true, name: true } },
} as const;

/** Published guides, newest first. Optional text search (title/summary) and trade filter. */
export async function listGuides(opts: { q?: string; category?: string; audience?: "CUSTOMER" | "ARTISAN" } = {}) {
  const q = opts.q?.trim().slice(0, 80);
  return db.guide.findMany({
    where: {
      status: "PUBLISHED",
      ...(opts.audience ? { audience: opts.audience } : {}),
      ...(opts.category ? { category: { slug: opts.category } } : {}),
      ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { summary: { contains: q, mode: "insensitive" } }, { body: { contains: q, mode: "insensitive" } }] } : {}),
    },
    orderBy: { publishedAt: "desc" }, take: 60, select: LIST_FIELDS,
  });
}

/** One guide by slug. Drafts only when an admin previews. */
export const getGuide = cache(async (slug: string, includeDrafts = false) => {
  const g = await db.guide.findUnique({ where: { slug }, include: { category: { select: { id: true, slug: true, name: true } } } });
  if (!g || (g.status !== "PUBLISHED" && !includeDrafts)) return null;
  return { ...g, prices: (Array.isArray(g.prices) ? g.prices : []) as unknown as PriceRow[] };
});

/** Other guides: same trade first, then the newest. */
export async function relatedGuides(guide: { id: string; categoryId: string | null; audience: "CUSTOMER" | "ARTISAN" }, take = 3) {
  const all = await db.guide.findMany({ where: { status: "PUBLISHED", id: { not: guide.id }, audience: guide.audience }, orderBy: { publishedAt: "desc" }, take: 12, select: LIST_FIELDS });
  return [...all].sort((a, b) => Number(b.category?.id === guide.categoryId) - Number(a.category?.id === guide.categoryId)).slice(0, take);
}

/** The newest published customer guide for a trade (shown on that service's pages). */
export async function guideForCategory(categoryId: string) {
  return db.guide.findFirst({ where: { status: "PUBLISHED", audience: "CUSTOMER", categoryId }, orderBy: { publishedAt: "desc" }, select: { slug: true, title: true, summary: true } });
}

/* ── Admin ─────────────────────────────────────────────────────────────────────────────────────── */

export async function saveGuide(adminId: string, id: string | null, raw: Record<string, unknown>) {
  const p = parseGuide(raw);
  if (!p.ok) throw new GuideFieldErrors(p.errors);
  const v = p.value;
  if (v.categoryId && !(await db.serviceCategory.findUnique({ where: { id: v.categoryId }, select: { id: true } }))) throw new GuideFieldErrors({ categoryId: "Choose a service from the list." });
  const existing = id ? await db.guide.findUnique({ where: { id }, select: { id: true, publishedAt: true } }) : null;
  if (id && !existing) throw new HttpError(404, "Guide not found.");
  const data = {
    slug: v.slug, title: v.title, summary: v.summary, categoryId: v.categoryId, audience: v.audience, body: v.body,
    prices: v.prices.length ? (v.prices as unknown as Prisma.InputJsonValue) : Prisma.DbNull, pricesNote: v.pricesNote,
    questions: v.questions, redFlags: v.redFlags, checklist: v.checklist,
    status: v.publish ? ("PUBLISHED" as const) : ("DRAFT" as const),
    // Keep the original publish date when re-saving; set it the first time a guide goes live.
    publishedAt: v.publish ? existing?.publishedAt ?? new Date() : existing?.publishedAt ?? null,
  };
  try {
    const g = id ? await db.guide.update({ where: { id }, data }) : await db.guide.create({ data });
    await db.auditLog.create({ data: { actorId: adminId, action: id ? "guide.update" : "guide.create", entity: "Guide", entityId: g.id, meta: { slug: g.slug, status: g.status } } });
    return g;
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new GuideFieldErrors({ slug: "Another guide already uses this web address. Change the slug." });
    throw e;
  }
}

export async function deleteGuide(adminId: string, id: string) {
  const g = await db.guide.delete({ where: { id } }).catch(() => null);
  if (!g) throw new HttpError(404, "Guide not found.");
  await db.auditLog.create({ data: { actorId: adminId, action: "guide.delete", entity: "Guide", entityId: id, meta: { slug: g.slug } } });
}
