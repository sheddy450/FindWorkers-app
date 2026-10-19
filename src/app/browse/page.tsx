import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { NIGERIA_STATES } from "@/lib/validation/artisan";
import { cityOrState, CITIES } from "@/lib/places/cities";
import { og, stateLabel, stateSlug } from "@/lib/seo/site";
import { Photo } from "@/components/photos/Photo";
import { serviceTiles } from "@/server/services/home.service";

type SP = Promise<{ city?: string; service?: string; state?: string }>;

/**
 * /browse?city=Abuja&service=plumber — clean, shareable links for the home page search.
 * Service (+ city) → the existing service listing page. City alone → this page: every service in that city.
 */
export async function generateMetadata({ searchParams }: { searchParams: SP }): Promise<Metadata> {
  const sp = await searchParams;
  const place = cityOrState(sp.city ?? sp.state, NIGERIA_STATES);
  if (!place) return { title: "Browse artisans by city", robots: { index: false } };
  const title = `Artisans in ${place.label}: plumbers, electricians and more`;
  const description = `Find verified artisans in ${place.label}${place.label !== stateLabel(place.state) ? `, ${stateLabel(place.state)} State` : ""}: plumbers, electricians, mechanics, tailors and more, with real reviews and prices in naira.`;
  const path = `/browse?city=${CITIES.find((c) => c.name === place.label)?.slug ?? encodeURIComponent(place.label)}`;
  return { title, description, alternates: { canonical: path }, openGraph: og({ title, description, url: path }) };
}

export default async function Browse({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const place = cityOrState(sp.city ?? sp.state, NIGERIA_STATES);
  const service = sp.service
    ? await db.serviceCategory.findFirst({ where: { slug: sp.service, isActive: true }, select: { slug: true } })
    : null;

  if (service) redirect(place ? `/services/${service.slug}/${stateSlug(place.state)}` : `/services/${service.slug}`);
  if (!place) redirect(sp.city || sp.state ? "/categories?unknown=1" : "/categories");

  const [tiles, artisansHere] = await Promise.all([
    serviceTiles(),
    db.artisan.count({ where: { state: place.state, user: { status: "ACTIVE" }, services: { some: {} } } }),
  ]);
  const perService = await db.$queryRaw<{ categoryId: string; n: number }[]>`
    SELECT s."categoryId", COUNT(DISTINCT s."artisanId")::int AS n
    FROM "ArtisanService" s JOIN "Artisan" a ON a."userId" = s."artisanId" JOIN "User" u ON u.id = a."userId"
    WHERE u.status = 'ACTIVE' AND a.state = ${place.state}
    GROUP BY s."categoryId"`;
  const here = new Map(perService.map((r) => [r.categoryId, Number(r.n)]));
  const sorted = [...tiles].sort((a, b) => (here.get(b.id) ?? 0) - (here.get(a.id) ?? 0) || a.name.localeCompare(b.name));
  const stateNote = place.label !== stateLabel(place.state) ? ` (${stateLabel(place.state)} State)` : "";

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/" className="underline-offset-4 hover:underline">Home</Link><span aria-hidden> / </span>
        <Link href="/categories" className="underline-offset-4 hover:underline">Services</Link><span aria-hidden> / </span>
        <span>{place.label}</span>
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-brand sm:text-4xl">Artisans in {place.label}</h1>
        <p className="max-w-prose text-muted">
          {artisansHere > 0
            ? `${artisansHere} artisan${artisansHere === 1 ? "" : "s"} in ${stateLabel(place.state)}${stateNote ? " State" : ""} so far. Pick a service to compare reviews, photos and prices.`
            : `We don't have artisans listed in ${place.label}${stateNote} yet. Post your job and we'll alert artisans as they join, or look at a nearby city.`}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Link href={`/jobs/new?state=${encodeURIComponent(place.state)}`} className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-white shadow-soft hover:bg-brand-700">Post a job in {place.label}</Link>
          <Link href="/search" className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-5 font-semibold hover:bg-paper">Search near me</Link>
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {sorted.map((t) => {
          const n = here.get(t.id) ?? 0;
          return (
            <li key={t.id}>
              <Link href={`/services/${t.slug}/${stateSlug(place.state)}`} className="group relative block overflow-hidden rounded-[18px] shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <Photo photo={t.photo} trade={t.name} sizes="(max-width: 640px) 50vw, 240px" className="aspect-[4/3] w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none" />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3 text-white">
                  <span className="block font-semibold leading-tight">{t.name}</span>
                  <span className="text-xs text-white/85">{n > 0 ? `${n} in ${place.label}` : "None listed yet"}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <section aria-labelledby="other-cities" className="space-y-3">
        <h2 id="other-cities" className="text-xl font-bold">Other cities</h2>
        <ul className="flex flex-wrap gap-2">
          {CITIES.filter((c) => c.name !== place.label).map((c) => (
            <li key={c.slug}><Link href={`/browse?city=${c.slug}`} className="inline-flex min-h-11 items-center rounded-full border border-line bg-white px-4 text-sm font-medium hover:border-brand/40 hover:text-brand">{c.name}</Link></li>
          ))}
        </ul>
      </section>
    </main>
  );
}
