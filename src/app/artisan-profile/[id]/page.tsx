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

const nairaRange = (min?: number | null, max?: number | null) =>
  min == null ? "Price on request" : `From ₦${(min / 100).toLocaleString("en-NG")}${max && max !== min ? ` – ₦${(max / 100).toLocaleString("en-NG")}` : ""}`;

export default async function ArtisanProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [user, artisan] = await Promise.all([
    currentUser(),
    db.artisan.findUnique({ where: { userId: id }, include: {
      verifications: true, services: { include: { category: true } },
      reviews: { where: { hidden: false }, orderBy: { createdAt: "desc" }, take: 20, include: { customer: { select: { name: true } } } },
    } }),
  ]);
  if (!artisan) notFound();
  // Count real customer interest only: not the artisan looking at their own page, not admins.
  if (user?.id !== artisan.userId && user?.role !== "ADMIN") await bumpStat(artisan.userId, "profileViews");

  const myVotedIds = user
    ? (await db.reviewVote.findMany({ where: { userId: user.id, reviewId: { in: artisan.reviews.map((r) => r.id) } }, select: { reviewId: true } })).map((v) => v.reviewId)
    : [];

  return (
    <main className="mx-auto max-w-md p-6 pb-28">
      <div className="grid h-20 w-20 place-items-center rounded-full bg-indigo-soft text-2xl font-bold text-indigo">{artisan.businessName[0]?.toUpperCase()}</div>
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
