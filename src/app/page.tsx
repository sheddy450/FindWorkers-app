import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { Icon } from "@/components/ui/Icon";
import { ArtisanCard } from "@/components/ArtisanCard";
import { LocationSelector } from "@/components/LocationSelector";
import { EmptyState } from "@/components/ui/States";
import { pickRandom } from "@/lib/pro/rules";

// Per-user (role redirects) and changes every visit (random featured pick): never pre-build at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  // "/" is the customer search homepage. An artisan or admin account has nothing to do here,
  // so send them straight to the screen that's actually theirs instead of a dead end.
  const me = await currentUser();
  if (me?.role === "ARTISAN") redirect("/artisan/dashboard");
  if (me?.role === "ADMIN") redirect("/admin");

  const [categories, topRated, recent, proPool] = await Promise.all([
    db.serviceCategory.findMany({ where: { isActive: true }, orderBy: { name: "asc" }, take: 8 }),
    db.artisan.findMany({ where: { reviewCount: { gt: 0 } }, orderBy: { avgRating: "desc" }, take: 4,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
    db.artisan.findMany({ where: { services: { some: {} } }, orderBy: { createdAt: "desc" }, take: 4,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
    db.artisan.findMany({ where: { proUntil: { gt: new Date() }, services: { some: {} }, user: { status: "ACTIVE" } }, take: 30,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
  ]);
  // Labelled paid slot: a random pick of Pro artisans, kept apart from the rating-based lists below.
  const featured = pickRandom(proPool, 2);
  const topRatedIds = new Set(topRated.map((a) => a.userId));
  const recommended = recent.filter((a) => !topRatedIds.has(a.userId)).slice(0, 4);
  // A service can repeat a category (different titles under the same trade) — collapse to unique names for display.
  const professionsOf = (a: { services: { category: { name: string } }[] }) => [...new Set(a.services.map((s) => s.category.name))];

  return (
    <main className="mx-auto max-w-2xl p-4 sm:p-6">
      <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-brand to-brand-700 p-6 text-white shadow-soft">
        <span aria-hidden className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-white/10" />
        <span aria-hidden className="pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-highlight/20" />
        <p className="flex items-center gap-2 font-display text-base font-bold">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm text-brand">F</span>FindWorkers
        </p>
        <h1 id="hero-title" className="relative mt-4 text-[2rem] font-bold leading-[1.1]">Trusted artisans near you, when you need them</h1>
        <p className="relative mt-2 text-base text-white/90">Plumbers, electricians, tailors and more. Compare ratings and prices, then book in a few taps.</p>
        <Link href="/search" className="relative mt-5 flex min-h-14 items-center gap-3 rounded-full bg-white px-5 font-semibold text-brand shadow-soft transition hover:bg-brand-soft active:scale-[0.99] motion-reduce:transition-none">
          <Icon name="search" /> What service do you need?
        </Link>
      </section>
      <LocationSelector />

      <ul aria-label="Why FindWorkers" className="mt-5 grid grid-cols-3 gap-2 text-center text-sm">
        {([["shield", "Verified artisans", "text-verified"], ["star", "Real reviews", "text-star"], ["check", "Clear prices", "text-brand"]] as const).map(([icon, label, tone]) => (
          <li key={label} className="flex flex-col items-center gap-1.5 rounded-card bg-white px-2 py-3.5 font-medium shadow-soft">
            <span className={`grid h-9 w-9 place-items-center rounded-full bg-brand-soft ${tone}`}><Icon name={icon} filled={icon === "star"} size={18} /></span>{label}
          </li>
        ))}
      </ul>

      <section className="mt-6">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-ink">Popular services</h2><Link href="/categories" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">See all</Link></div>
        <div className="mt-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link key={c.id} href={`/search?category=${c.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 py-2 text-sm font-medium transition-colors hover:border-brand/40 hover:text-brand motion-reduce:transition-none">{c.name}</Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mt-8">
          <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-ink">Featured artisans</h2><span className="text-sm text-muted">Paid placement</span></div>
          <div className="mt-3 space-y-3">
            {featured.map((a) => (
              <ArtisanCard key={a.userId} featured id={a.userId} businessName={a.businessName} categories={professionsOf(a)} avgRating={Number(a.avgRating)} reviewCount={a.reviewCount}
                priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo} availability={a.availability} verifiedCount={a.verifications.length} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <div className="flex items-center justify-between"><h2 className="text-xl font-bold text-ink">Top-rated artisans</h2><Link href="/search" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">See all</Link></div>
        <div className="mt-3 space-y-3">
          {topRated.length === 0 && <EmptyState icon="star" title="No rated artisans yet" body="Be among the first to hire a local pro and leave a review." action={{ label: "Browse artisans", href: "/search" }} />}
          {topRated.map((a) => (
            <ArtisanCard key={a.userId} id={a.userId} businessName={a.businessName} categories={professionsOf(a)} avgRating={Number(a.avgRating)} reviewCount={a.reviewCount}
              priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo} availability={a.availability} verifiedCount={a.verifications.length} />
          ))}
        </div>
      </section>

      {recommended.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-bold text-ink">Recently joined</h2>
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
