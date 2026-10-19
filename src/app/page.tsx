import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { Icon } from "@/components/ui/Icon";
import { ArtisanCard, placeOf } from "@/components/ArtisanCard";
import { cardPhotosFor } from "@/server/services/photo-display.service";
import { serviceTiles, stateCounts } from "@/server/services/home.service";
import { HeroSearch } from "@/components/home/HeroSearch";
import { Faq } from "@/components/home/Faq";
import { Photo } from "@/components/photos/Photo";
import { glyphFor } from "@/components/photos/TradePlaceholder";
import { CITIES } from "@/lib/places/cities";
import { FAQS } from "@/lib/content/faq";
import { LocationSelector } from "@/components/LocationSelector";
import { pickRandom } from "@/lib/pro/rules";
import { JsonLd } from "@/components/seo/JsonLd";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL, absoluteUrl, og } from "@/lib/seo/site";

// Per-user (role redirects) and changes every visit (random featured pick): never pre-build at build time.
export const dynamic = "force-dynamic";
export const metadata = { alternates: { canonical: "/" }, openGraph: og({ title: SITE_TITLE, description: SITE_DESCRIPTION, url: "/" }) };

export default async function Home() {
  // "/" is the customer search homepage. An artisan or admin account has nothing to do here,
  // so send them straight to the screen that's actually theirs instead of a dead end.
  const me = await currentUser();
  if (me?.role === "ARTISAN") redirect("/artisan/dashboard");
  if (me?.role === "ADMIN") redirect("/admin");

  const [tiles, topRated, recent, proPool, byState] = await Promise.all([
    serviceTiles(),
    db.artisan.findMany({ where: { reviewCount: { gt: 0 }, user: { status: "ACTIVE" } }, orderBy: { avgRating: "desc" }, take: 4,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
    db.artisan.findMany({ where: { services: { some: {} }, user: { status: "ACTIVE" } }, orderBy: { createdAt: "desc" }, take: 6,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
    db.artisan.findMany({ where: { proUntil: { gt: new Date() }, services: { some: {} }, user: { status: "ACTIVE" } }, take: 30,
      include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } }),
    stateCounts(),
  ]);
  // Labelled paid slot: a random pick of Pro artisans, kept apart from the rating-based lists below.
  const featured = pickRandom(proPool, 2);
  const topRatedIds = new Set(topRated.map((a) => a.userId));
  const recommended = recent.filter((a) => !topRatedIds.has(a.userId)).slice(0, 4);
  const photos = await cardPhotosFor([...featured, ...topRated, ...recommended].map((a) => a.userId));
  // A service can repeat a category (different titles under the same trade) — collapse to unique names for display.
  const professionsOf = (a: { services: { category: { name: string } }[] }) => [...new Set(a.services.map((s) => s.category.name))];
  const card = (a: (typeof recent)[number], extra: { featured?: boolean } = {}) => (
    <ArtisanCard key={a.userId} {...extra} id={a.userId} businessName={a.businessName} categories={professionsOf(a)} avgRating={Number(a.avgRating)} reviewCount={a.reviewCount}
      priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo} availability={a.availability} verifiedCount={a.verifications.length}
      photos={photos[a.userId]} place={placeOf(a)} />
  );
  const totalArtisans = [...byState.values()].reduce((n, v) => n + v, 0);
  // Five tiles: one big + four small fills the grid exactly on phones (1 + 2×2) and desktops (1 tall + 2×2).
  const popular = tiles.slice(0, 5);
  const alphabetical = [...tiles].sort((a, b) => a.name.localeCompare(b.name));
  const mosaic = tiles.slice(0, 3);

  return (
    <main className="mx-auto max-w-5xl px-4 pb-6 pt-4 sm:px-6">
      <JsonLd data={[
        { "@context": "https://schema.org", "@type": "Organization", name: SITE_NAME, url: SITE_URL, logo: absoluteUrl("/apple-icon.png"), areaServed: { "@type": "Country", name: "Nigeria" } },
        { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE_URL },
      ]} />

      {/* ── Hero: the search reads like a sentence ─────────────────────────────── */}
      <section aria-labelledby="hero-title" className="relative overflow-hidden rounded-[28px] bg-brand-700 px-5 pb-6 pt-5 text-white shadow-soft sm:px-8 sm:pb-8 sm:pt-7">
        {/* soft light from the top-right and a faint grid, so the green has depth without decoration */}
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(52,199,89,0.35),transparent_55%)]" />
        <span aria-hidden className="pointer-events-none absolute inset-0 opacity-[0.07] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:28px_28px]" />

        <div className="relative grid items-center gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <div>
            <p className="flex items-center gap-2 font-display text-base font-bold">
              <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-white text-sm text-brand">F</span>FindWorkers
            </p>
            <h1 id="hero-title" className="mt-5 text-[2.35rem] font-extrabold leading-[1.04] tracking-[-0.02em] sm:text-5xl">
              Good hands for every job, close to home.
            </h1>
            <p className="mt-3 max-w-md text-[17px] leading-relaxed text-white/85">
              Plumbers, electricians, tailors, mechanics and more across Nigeria. See their work, read real reviews, compare prices in naira.
            </p>
            <div className="mt-6"><HeroSearch services={alphabetical.map(({ slug, name }) => ({ slug, name }))} /></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link href="/jobs/new" className="flex min-h-12 items-center justify-center whitespace-nowrap rounded-full bg-highlight px-3 text-[14px] font-semibold sm:text-[15px] text-ink shadow-soft transition hover:brightness-105 motion-reduce:transition-none">Post a job — free</Link>
              <Link href="/register?role=ARTISAN" className="flex min-h-12 items-center justify-center whitespace-nowrap rounded-full border border-white/50 px-3 text-[14px] font-semibold sm:text-[15px] text-white transition hover:bg-white/10 motion-reduce:transition-none">Join as an artisan</Link>
            </div>
          </div>

          {/* Photo stack: real trades, the thing customers are here for */}
          <div aria-hidden className="relative hidden h-[420px] lg:block">
            {mosaic.map((t, i) => (
              <div key={t.id} className={[
                "absolute overflow-hidden rounded-[22px] bg-brand shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] ring-4 ring-white/90",
                i === 0 ? "left-6 top-0 h-[250px] w-[62%] -rotate-3" : i === 1 ? "right-0 top-24 h-[220px] w-[52%] rotate-3" : "bottom-0 left-16 h-[170px] w-[48%] -rotate-1",
              ].join(" ")}>
                <Photo photo={t.photo} trade={t.name} sizes="340px" priority={i === 0} className="h-full w-full" />
                <span className="absolute bottom-2 left-2 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-ink">{t.name}</span>
              </div>
            ))}
          </div>
        </div>

        <ul aria-label="Why FindWorkers" className="relative mt-6 flex flex-wrap gap-x-5 gap-y-2 border-t border-white/15 pt-4 text-sm text-white/90">
          {totalArtisans > 0 && <li className="flex items-center gap-1.5"><Icon name="user" size={16} />{totalArtisans.toLocaleString("en-NG")} artisans in {byState.size} state{byState.size === 1 ? "" : "s"}</li>}
          <li className="flex items-center gap-1.5"><Icon name="shield" size={16} />Verified badges</li>
          <li className="flex items-center gap-1.5"><span className="text-star"><Icon name="star" size={16} filled /></span>Reviews from booked jobs</li>
          <li className="flex items-center gap-1.5"><Icon name="check" size={16} />Prices in naira</li>
        </ul>
      </section>
      <LocationSelector />

      {/* ── Popular services: photo tiles ─────────────────────────────────────── */}
      <section aria-labelledby="popular" className="mt-10">
        <div className="flex items-end justify-between gap-3">
          <h2 id="popular" className="text-2xl font-bold tracking-tight text-ink">Popular services</h2>
          <Link href="/categories" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">All services</Link>
        </div>
        <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {popular.map((t, i) => (
            <li key={t.id} className={i === 0 ? "col-span-2 sm:col-span-1 sm:row-span-2" : ""}>
              <Link href={`/services/${t.slug}`} className="group relative block h-full overflow-hidden rounded-[20px] shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
                <Photo photo={t.photo} trade={t.name} sizes={i === 0 ? "(max-width: 640px) 100vw, 330px" : "(max-width: 640px) 50vw, 330px"}
                  className={`w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none ${i === 0 ? "aspect-[16/9] sm:aspect-auto sm:h-full" : "aspect-[4/3]"}`} />
                <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 p-3.5 text-white">
                  <span className={`block font-bold leading-tight ${i === 0 ? "text-xl" : ""}`}>{t.name}</span>
                  <span className="text-xs text-white/85">{t.count > 0 ? `${t.count} artisan${t.count === 1 ? "" : "s"}` : "Be the first to hire"}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {featured.length > 0 && (
        <section aria-labelledby="featured" className="mt-10">
          <div className="flex items-end justify-between"><h2 id="featured" className="text-2xl font-bold tracking-tight text-ink">Featured artisans</h2><span className="text-sm text-muted">Paid placement</span></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{featured.map((a) => card(a, { featured: true }))}</div>
        </section>
      )}

      {/* ── How it works: a real sequence, so it's numbered ───────────────────── */}
      <section aria-labelledby="how" className="mt-10 rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-line/70 sm:p-7">
        <h2 id="how" className="text-2xl font-bold tracking-tight text-ink">How it works</h2>
        <ol className="mt-5 grid gap-5 sm:grid-cols-3 sm:gap-6">
          {[
            ["Post your job", "Say what you need and where. It takes two minutes and it's free."],
            ["Get quotes", "Artisans near you send their price. Compare reviews, photos and badges."],
            ["Hire and review", "Chat in the app, agree the details, then rate the work when it's done."],
          ].map(([title, body], i) => (
            <li key={title} className="relative flex gap-4 sm:block">
              <span aria-hidden className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand font-display text-lg font-bold text-white">{i + 1}</span>
              <div className="sm:mt-3">
                <h3 className="text-lg font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <Link href="/jobs/new" className="mt-6 inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-semibold text-white shadow-soft hover:bg-brand-700">Post a job — free</Link>
      </section>

      {topRated.length > 0 && (
        <section aria-labelledby="top" className="mt-10">
          <div className="flex items-end justify-between"><h2 id="top" className="text-2xl font-bold tracking-tight text-ink">Top-rated artisans</h2><Link href="/search" className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">See all</Link></div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">{topRated.map((a) => card(a))}</div>
        </section>
      )}

      {recommended.length > 0 && (
        <section aria-labelledby="recent" className="mt-10">
          <h2 id="recent" className="text-2xl font-bold tracking-tight text-ink">Recently joined</h2>
          <p className="mt-1 text-muted">New artisans on FindWorkers. Give them a try.</p>
          <div className="-mx-4 mt-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
            {recommended.map((a) => <div key={a.userId} className="w-[85%] shrink-0 snap-start sm:w-auto">{card(a)}</div>)}
          </div>
        </section>
      )}

      {/* ── All services with counts ──────────────────────────────────────────── */}
      <section aria-labelledby="all" className="mt-10">
        <h2 id="all" className="text-2xl font-bold tracking-tight text-ink">All services</h2>
        <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {alphabetical.map((t) => (
            <li key={t.id}>
              <Link href={`/services/${t.slug}`} className="flex min-h-14 items-center gap-3 rounded-[16px] bg-white px-3 py-2 shadow-soft ring-1 ring-line/60 transition hover:ring-brand/40 motion-reduce:transition-none">
                <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand">
                  <svg viewBox="0 0 64 64" width="24" height="24">{glyphFor(t.name)}</svg>
                </span>
                <span className="min-w-0 flex-1 truncate font-medium text-ink">{t.name}</span>
                <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.count > 0 ? "bg-brand-soft text-brand" : "bg-paper text-muted"}`}>
                  {t.count > 0 ? t.count : "New"}<span className="sr-only"> artisans</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Browse by city ───────────────────────────────────────────────────── */}
      <section aria-labelledby="cities" className="mt-10">
        <h2 id="cities" className="text-2xl font-bold tracking-tight text-ink">Browse by city</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {CITIES.map((c) => {
            const n = byState.get(c.state) ?? 0;
            return (
              <li key={c.slug}>
                <Link href={`/browse?city=${c.slug}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-4 text-[15px] font-medium text-ink shadow-soft ring-1 ring-line/60 transition hover:text-brand hover:ring-brand/40 motion-reduce:transition-none">
                  {c.name}{n > 0 && <span className="text-sm text-muted">{n}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ── Hiring tips (become hiring guides in the next step) ───────────────── */}
      <section aria-labelledby="tips" className="mt-10">
        <h2 id="tips" className="text-2xl font-bold tracking-tight text-ink">Hire with confidence</h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["shield", "Check the badges", "Verified means we've checked their ID or phone. Look at their work photos and read reviews from people who booked them."],
            ["chat", "Agree the price first", "Get the full price in the app chat before work starts, including materials, so there are no surprises."],
            ["check", "Pay in stages", "Pay part at the start and the rest when you're happy. Ask for receipts when you pay for materials."],
          ].map(([icon, title, body]) => (
            <li key={title} className="rounded-[20px] bg-brand-soft/70 p-5">
              <span aria-hidden className="grid h-10 w-10 place-items-center rounded-full bg-white text-brand shadow-sm"><Icon name={icon as "shield"} size={20} /></span>
              <h3 className="mt-3 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-1 text-[15px] leading-relaxed text-ink/75">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-title" className="mt-10">
        <h2 id="faq-title" className="text-2xl font-bold tracking-tight text-ink">Questions people ask</h2>
        <div className="mt-4"><Faq items={FAQS} /></div>
      </section>

      {/* ── For artisans ─────────────────────────────────────────────────────── */}
      <section aria-labelledby="artisans" className="relative mt-10 overflow-hidden rounded-[28px] bg-ink p-6 text-white sm:p-8">
        <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(90%_120%_at_0%_100%,rgba(0,122,73,0.55),transparent_60%)]" />
        <div className="relative max-w-lg">
          <h2 id="artisans" className="text-2xl font-bold tracking-tight sm:text-3xl">Are you an artisan? Get jobs from customers near you.</h2>
          <p className="mt-2 text-white/80">Joining is free. Show your best work, get verified, and quote for jobs posted in your state.</p>
          <Link href="/register?role=ARTISAN" className="mt-5 inline-flex min-h-12 items-center rounded-full bg-highlight px-6 font-semibold text-ink hover:brightness-105">Join as an artisan</Link>
        </div>
      </section>
    </main>
  );
}
