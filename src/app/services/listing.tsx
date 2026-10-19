import Link from "next/link";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { ArtisanCard, placeOf } from "@/components/ArtisanCard";
import { Photo } from "@/components/photos/Photo";
import { stockPhotoFor } from "@/lib/photos/stock";
import { cardPhotosFor, recentWork } from "@/server/services/photo-display.service";
import { guideForCategory } from "@/server/services/guides.service";
import { EmptyState } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { JsonLd } from "@/components/seo/JsonLd";
import { NIGERIA_STATES } from "@/lib/validation/artisan";
import { SITE_NAME, absoluteUrl, og, serviceDescription, serviceHeading, stateFromSlug, stateLabel, stateSlug } from "@/lib/seo/site";

/*
 * Server-rendered landing pages for searches like "electrician in Lagos":
 *   /services/[slug]          → that service across Nigeria
 *   /services/[slug]/[state]  → that service in one state
 * Unlike /search (which loads results in the browser), everything here is in the HTML Google reads.
 */

// cache(): generateMetadata and the page share one set of queries per request.
export const loadListing = cache(async (slug: string, stateParam?: string) => {
  const state = stateParam ? stateFromSlug(stateParam, NIGERIA_STATES) : null;
  if (stateParam && !state) return null;
  const category = await db.serviceCategory.findFirst({ where: { slug, isActive: true } });
  if (!category) return null;

  const base = { services: { some: { categoryId: category.id } }, user: { status: "ACTIVE" as const } };
  const [artisans, byState, others] = await Promise.all([
    db.artisan.findMany({
      where: { ...base, ...(state ? { state } : {}) },
      orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }, { createdAt: "asc" }], take: 30,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } },
    }),
    db.artisan.groupBy({ by: ["state"], where: { ...base, state: { not: null } }, _count: { _all: true } }),
    db.serviceCategory.findMany({ where: { isActive: true, id: { not: category.id } }, orderBy: { name: "asc" }, select: { slug: true, name: true } }),
  ]);
  const [photos, work, guide] = await Promise.all([cardPhotosFor(artisans.map((a) => a.userId)), recentWork(category.id, state), guideForCategory(category.id)]);
  const states = byState
    .filter((s): s is typeof s & { state: string } => !!s.state)
    .map((s) => ({ state: s.state, count: s._count._all }))
    .sort((a, b) => b.count - a.count || a.state.localeCompare(b.state));
  return { category, state, artisans, states, others, photos, work, guide };
});

type Listing = NonNullable<Awaited<ReturnType<typeof loadListing>>>;

export function listingPath(slug: string, state?: string | null) {
  return state ? `/services/${slug}/${stateSlug(state)}` : `/services/${slug}`;
}

export async function listingMetadata(slug: string, stateParam?: string): Promise<Metadata> {
  const l = await loadListing(slug, stateParam);
  if (!l) return { title: "Service not found", robots: { index: false } };
  const heading = serviceHeading(l.category.name, l.state);
  const description = serviceDescription(l.category.name, l.state, l.artisans.length);
  const path = listingPath(l.category.slug, l.state);
  return {
    title: `${heading}: verified & rated`,
    description,
    alternates: { canonical: path },
    openGraph: og({ title: `${heading} | ${SITE_NAME}`, description, url: path,
      image: (() => { const h = l.work[0] ?? stockPhotoFor(l.category.slug); return { url: h.url, width: h.width, height: h.height, alt: h.alt }; })() }),
    // A state page with no artisans yet is thin content: keep it out of Google until it has some.
    robots: l.artisans.length === 0 ? { index: false, follow: true } : undefined,
  };
}

const professionsOf = (a: { services: { category: { name: string } }[] }) => [...new Set(a.services.map((s) => s.category.name))];

export function ListingPage({ l }: { l: Listing }) {
  const { category, state, artisans, states, others, photos, work, guide } = l;
  const heading = serviceHeading(category.name, state);
  const where = state ? stateLabel(state) : "Nigeria";
  const path = listingPath(category.slug, state);

  const ld = [
    {
      "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Services", item: absoluteUrl("/categories") },
        { "@type": "ListItem", position: 2, name: category.name, item: absoluteUrl(listingPath(category.slug)) },
        ...(state ? [{ "@type": "ListItem", position: 3, name: stateLabel(state), item: absoluteUrl(path) }] : []),
      ],
    },
    {
      "@context": "https://schema.org", "@type": "ItemList", name: heading,
      itemListElement: artisans.map((a, i) => ({ "@type": "ListItem", position: i + 1, url: absoluteUrl(`/artisan-profile/${a.userId}`), name: a.businessName })),
    },
  ];

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
      <JsonLd data={ld} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/categories" className="underline-offset-4 hover:underline">Services</Link>
        <span aria-hidden> / </span>
        {state ? <Link href={listingPath(category.slug)} className="underline-offset-4 hover:underline">{category.name}</Link> : <span>{category.name}</span>}
        {state && <><span aria-hidden> / </span><span>{stateLabel(state)}</span></>}
      </nav>

      {(() => {
        // Hero: the latest real work photo in this trade, or a credited example photo until there is one.
        const stock = work[0] ? null : stockPhotoFor(category.slug);
        return (
          <figure className="relative">
            <Photo photo={work[0] ?? stock} trade={category.name} priority placeholderSize="lg"
              sizes="(max-width: 700px) 100vw, 670px" className="aspect-[21/9] w-full rounded-card" />
            {stock && (
              <figcaption className="absolute bottom-2 right-2 rounded-full bg-ink/65 px-2 py-0.5 text-[11px] text-white">
                Example photo by <a href={stock.stock.page} target="_blank" rel="noopener noreferrer" className="underline">{stock.stock.by}</a> on{" "}
                <a href="https://unsplash.com/?utm_source=findworkers&utm_medium=referral" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
              </figcaption>
            )}
          </figure>
        );
      })()}

      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-brand">{heading}</h1>
        <p className="text-muted">
          {artisans.length > 0
            ? `${artisans.length} ${category.name.toLowerCase()} ${artisans.length === 1 ? "artisan" : "artisans"} in ${where} on FindWorkers. Check verified badges, real reviews from booked jobs, and prices in naira, then call, WhatsApp or send a request.`
            : `We don't have a ${category.name.toLowerCase()} listed in ${where} yet. New artisans join every week, so check back soon or search nearby.`}
        </p>
        <Link href={`/search?category=${category.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand px-5 font-semibold text-white shadow-soft hover:bg-brand-700">
          <Icon name="pin" size={16} />Find one near me
        </Link>
      </header>

      {guide && (
        <Link href={`/guides/${guide.slug}`} className="flex items-center gap-4 rounded-[20px] bg-brand-soft/70 p-4 ring-1 ring-brand/15 transition hover:ring-brand/40 motion-reduce:transition-none">
          <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-white text-xl text-brand shadow-sm">₦</span>
          <span className="min-w-0">
            <span className="block font-semibold text-ink">{guide.title}</span>
            <span className="block text-sm text-muted">Prices, questions to ask and red flags. Read before you hire.</span>
          </span>
        </Link>
      )}

      <section aria-label={`${heading} list`} className="space-y-3">
        {artisans.length === 0
          ? <EmptyState icon="search" title={`No ${category.name.toLowerCase()} in ${where} yet`} body="Try searching near your location, or look at nearby states below." action={{ label: "Search near me", href: `/search?category=${category.slug}` }} />
          : artisans.map((a) => (
            <ArtisanCard key={a.userId} id={a.userId} businessName={a.businessName} categories={professionsOf(a)} avgRating={Number(a.avgRating)} reviewCount={a.reviewCount}
              priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo} availability={a.availability} verifiedCount={a.verifications.length}
              photos={photos[a.userId]} place={placeOf(a)} />
          ))}
      </section>

      {work.length > 0 && (
        <section aria-labelledby="recent-work" className="space-y-3">
          <h2 id="recent-work" className="text-xl font-bold text-ink">Recent work in {category.name.toLowerCase()}{state ? `, ${stateLabel(state)}` : ""}</h2>
          <ul className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
            {work.map((w) => (
              <li key={w.id} className="w-56 shrink-0 snap-start">
                <Link href={`/artisan-profile/${w.artisanId}`} className="group block">
                  <Photo photo={w} trade={category.name} sizes="224px" className="aspect-[4/3] w-full rounded-card" />
                  <p className="mt-1.5 line-clamp-2 text-sm text-ink">{w.alt}</p>
                  <p className="text-xs font-medium text-brand group-hover:underline">{w.businessName}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {states.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-ink">{category.name} by state</h2>
          <ul className="flex flex-wrap gap-2">
            {states.map((s) => (
              <li key={s.state}>
                <Link href={listingPath(category.slug, s.state)} aria-current={s.state === state ? "page" : undefined}
                  className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-4 text-sm font-medium ${s.state === state ? "border-brand bg-brand text-white" : "border-line bg-white hover:border-brand/40 hover:text-brand"}`}>
                  {stateLabel(s.state)} <span className={s.state === state ? "text-white/80" : "text-muted"}>({s.count})</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {others.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-bold text-ink">Other services{state ? ` in ${stateLabel(state)}` : ""}</h2>
          <ul className="flex flex-wrap gap-2">
            {others.map((c) => (
              <li key={c.slug}><Link href={listingPath(c.slug, state)} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-medium hover:border-brand/40 hover:text-brand">{c.name}</Link></li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

export async function renderListing(slug: string, stateParam?: string) {
  const l = await loadListing(slug, stateParam);
  if (!l) notFound();
  return <ListingPage l={l} />;
}
