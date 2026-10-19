import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { VerificationBadges } from "@/components/VerificationBadges";
import { ContactButtons } from "./ContactButtons";
import { ReviewsSection } from "./ReviewsSection";
import { bumpStat } from "@/server/services/pro.service";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { Photo } from "@/components/photos/Photo";
import { Gallery } from "@/components/photos/Gallery";
import { cardPhotosFor, profilePhotos } from "@/server/services/photo-display.service";
import { SITE_NAME, absoluteUrl, clip, og, stateLabel } from "@/lib/seo/site";

/** Search titles like "Ola Power Works: Electrician in Ikeja, Lagos". */
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const a = await db.artisan.findUnique({ where: { userId: id }, select: {
    businessName: true, bio: true, lga: true, state: true, avgRating: true, reviewCount: true, priceMinKobo: true,
    user: { select: { status: true } }, services: { select: { category: { select: { name: true } } } },
  } });
  if (!a || a.user.status !== "ACTIVE") return { title: "Artisan not found", robots: { index: false } };
  const trades = [...new Set(a.services.map((s) => s.category.name))].slice(0, 2).join(" & ") || "Artisan";
  const place = [a.lga, a.state && stateLabel(a.state)].filter(Boolean).join(", ");
  const title = `${a.businessName}: ${trades}${place ? ` in ${place}` : ""}`;
  const facts = [
    a.reviewCount > 0 ? `Rated ${Number(a.avgRating).toFixed(1)}/5 from ${a.reviewCount} review${a.reviewCount === 1 ? "" : "s"}` : null,
    a.priceMinKobo != null ? `from ₦${(a.priceMinKobo / 100).toLocaleString("en-NG")}` : null,
  ].filter(Boolean).join(", ");
  const description = clip(a.bio?.trim() ? `${facts ? `${facts}. ` : ""}${a.bio}` : `${trades}${place ? ` in ${place}` : ""} on ${SITE_NAME}. ${facts ? `${facts}. ` : ""}See verified badges and reviews, then call, WhatsApp or book.`);
  const path = `/artisan-profile/${id}`;
  const { cover, avatar } = (await cardPhotosFor([id]))[id];
  const pic = cover ?? avatar;
  return { title, description, alternates: { canonical: path }, openGraph: og({ title: `${title} | ${SITE_NAME}`, description, url: path, type: "profile",
    image: pic ? { url: pic.url, width: pic.width, height: pic.height, alt: pic.alt } : null }) };
}

const nairaRange = (min?: number | null, max?: number | null) =>
  min == null ? "Price on request" : `From ₦${(min / 100).toLocaleString("en-NG")}${max && max !== min ? ` – ₦${(max / 100).toLocaleString("en-NG")}` : ""}`;

export default async function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, artisan, photos] = await Promise.all([
    currentUser(),
    db.artisan.findUnique({ where: { userId: id }, include: {
      verifications: true, services: { include: { category: true } },
      reviews: { where: { hidden: false }, orderBy: { createdAt: "desc" }, take: 20, include: { customer: { select: { name: true } } } },
    } }),
    profilePhotos(id),
  ]);
  if (!artisan) notFound();
  // Count real customer interest only: not the artisan looking at their own page, not admins.
  if (user?.id !== artisan.userId && user?.role !== "ADMIN") await bumpStat(artisan.userId, "profileViews");

  const myVotedIds = user
    ? (await db.reviewVote.findMany({ where: { userId: user.id, reviewId: { in: artisan.reviews.map((r) => r.id) } }, select: { reviewId: true } })).map((v) => v.reviewId)
    : [];

  const trades = [...new Set(artisan.services.map((s) => s.category.name))];
  const isOwner = user?.id === artisan.userId;
  const waiting = isOwner ? await db.artisanPhoto.count({ where: { artisanId: artisan.userId, moderationStatus: "PENDING" } }) : 0;
  const businessLd: Record<string, unknown> = {
    "@context": "https://schema.org", "@type": "LocalBusiness",
    name: artisan.businessName, url: absoluteUrl(`/artisan-profile/${artisan.userId}`),
    ...(artisan.bio ? { description: artisan.bio } : {}),
    ...(trades.length ? { knowsAbout: trades } : {}),
    ...(photos.avatar || photos.cover ? { image: [photos.avatar, photos.cover].filter(Boolean).map((p) => p!.url) } : {}),
    address: { "@type": "PostalAddress", addressCountry: "NG",
      ...(artisan.lga ? { addressLocality: artisan.lga } : {}), ...(artisan.state ? { addressRegion: stateLabel(artisan.state) } : {}) },
    ...(artisan.state ? { areaServed: { "@type": "State", name: stateLabel(artisan.state) } } : {}),
    ...(artisan.priceMinKobo != null ? { priceRange: nairaRange(artisan.priceMinKobo, artisan.priceMaxKobo).replace(/^From /, "") } : {}),
    ...(artisan.reviewCount > 0 ? { aggregateRating: { "@type": "AggregateRating", ratingValue: Number(artisan.avgRating).toFixed(1), reviewCount: artisan.reviewCount, bestRating: 5 } } : {}),
  };

  return (
    <main className="mx-auto max-w-md p-6 pb-28">
      <JsonLd data={businessLd} />
      {photos.avatar
        ? <Photo photo={photos.avatar} sizes="80px" priority className="h-20 w-20 rounded-full ring-4 ring-brand-soft" />
        : <div className="grid h-20 w-20 place-items-center rounded-full bg-brand-soft text-2xl font-bold text-brand">{artisan.businessName[0]?.toUpperCase()}</div>}
      <h1 className="mt-3 text-2xl font-bold">{artisan.businessName}</h1>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
        <StarRating value={Number(artisan.avgRating)} count={artisan.reviewCount} />
        <span>· {artisan.completedJobs} jobs completed</span>
        <span>· {artisan.lga}, {artisan.state}</span>
      </div>
      <div className="mt-3"><VerificationBadges records={artisan.verifications} /></div>
      <div className="mt-3 flex flex-wrap gap-2">{artisan.services.map((s) => <Badge key={s.id} tone="brand">{s.category.name}</Badge>)}</div>
      {artisan.bio && <p className="mt-4 text-sm">{artisan.bio}</p>}
      <p className="mt-3 font-semibold">{nairaRange(artisan.priceMinKobo, artisan.priceMaxKobo)}</p>
      <p className="text-sm text-muted">{artisan.yearsExperience} years of experience</p>

      <div className="mt-5"><ContactButtons artisanId={artisan.userId} businessName={artisan.businessName} loggedIn={!!user} /></div>
      {user && user.id !== artisan.userId && (
        <Link href={`/report?type=ARTISAN&id=${artisan.userId}`} className="mt-3 inline-block text-sm text-muted underline">Report this artisan</Link>
      )}

      {(photos.items.length > 0 || isOwner) && (
        <section className="mt-8" aria-labelledby="work-title">
          <h2 id="work-title" className="mb-3 text-lg font-semibold">Photos of {isOwner ? "your" : "their"} work{photos.lightbox.length > 0 && <span className="font-normal text-muted"> ({photos.lightbox.length})</span>}</h2>
          {photos.items.length > 0 && <Gallery items={photos.items} lightbox={photos.lightbox} trade={trades[0]} />}
          {isOwner && (
            <p className="mt-3 rounded-ctl bg-brand-soft p-3 text-sm text-brand">
              {photos.items.length === 0 ? "Customers can't see any photos of your work yet. " : ""}
              {waiting > 0 ? `${waiting} photo${waiting === 1 ? " is" : "s are"} waiting for review and will appear here once approved. ` : ""}
              <Link href="/artisan/photos" className="font-semibold underline">Manage your photos</Link>
            </p>
          )}
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
        <ReviewsSection
          reviews={artisan.reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() }))}
          loggedIn={!!user}
          myVotedIds={myVotedIds}
        />
      </section>
    </main>
  );
}
