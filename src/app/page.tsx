import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { Icon } from "@/components/ui/Icon";
import { ArtisanCard } from "@/components/ArtisanCard";
import { LocationSelector } from "@/components/LocationSelector";

export default async function Home() {
  // "/" is the customer search homepage. An artisan or admin account has nothing to do here,
  // so send them straight to the screen that's actually theirs instead of a dead end.
  const me = await currentUser();
  if (me?.role === "ARTISAN") redirect("/artisan/dashboard");
  if (me?.role === "ADMIN") redirect("/admin");

  const [categories, topRated, recent] = await Promise.all([
    db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 8 }),
    db.artisan.findMany({ where: { reviewCount: { gt: 0 } }, orderBy: { avgRating: "desc" }, take: 4,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
    db.artisan.findMany({ where: { services: { some: {} } }, orderBy: { createdAt: "desc" }, take: 4,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
  ]);
  const topRatedIds = new Set(topRated.map((a) => a.userId));
  const recommended = recent.filter((a) => !topRatedIds.has(a.userId)).slice(0, 4);
  // A service can repeat a category (different titles under the same trade) — collapse to unique names for display.
  const professionsOf = (a: { services: { category: { name: string } }[] }) => [...new Set(a.services.map((s) => s.category.name))];

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-3xl font-bold text-indigo">FindWorkers</h1>
      <p className="mt-1 text-muted">Find vetted local artisans near you</p>
      <LocationSelector />

      <Link href="/search" className="mt-5 flex min-h-14 items-center gap-3 rounded-card border border-line bg-white px-4 text-muted">
        <Icon name="search" /> What service do you need?
      </Link>

      <section className="mt-6">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Popular services</h2><Link href="/categories" className="text-sm font-semibold text-indigo underline">See all</Link></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/search?category=${c.slug}`} className="min-h-11 rounded-full border border-line bg-white px-4 py-2 text-sm font-medium">{c.name}</Link>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between"><h2 className="text-lg font-semibold">Top-rated artisans</h2><Link href="/search" className="text-sm font-semibold text-indigo underline">See all</Link></div>
        <div className="mt-3 space-y-3">
          {topRated.length === 0 && <p className="text-muted">No rated artisans yet — check back soon.</p>}
          {topRated.map((a) => (
            <ArtisanCard key={a.userId} id={a.userId} businessName={a.businessName} categories={professionsOf(a)} avgRating={Number(a.avgRating)} reviewCount={a.reviewCount}
              priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo} availability={a.availability} verifiedCount={a.verifications.length} />
          ))}
        </div>
      </section>

      {recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Recently joined</h2>
          <div className="space-y-3">
            {recommended.map((a) => (
              <ArtisanCard key={a.userId} id={a.userId} businessName={a.businessName} categories={professionsOf(a)} avgRating={Number(a.avgRating)} reviewCount={a.reviewCount}
                priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo} availability={a.availability} verifiedCount={a.verifications.length} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
