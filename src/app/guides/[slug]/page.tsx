import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth/session";
import { JsonLd } from "@/components/seo/JsonLd";
import { Photo } from "@/components/photos/Photo";
import { ArtisanCard, placeOf } from "@/components/ArtisanCard";
import { GuideBody } from "@/components/guides/GuideBody";
import { GuideCard } from "@/components/guides/GuideCard";
import { stockPhotoFor } from "@/lib/photos/stock";
import { parseBody, readMinutes } from "@/lib/guides/format";
import { naira } from "@/lib/jobs/rules";
import { SITE_NAME, absoluteUrl, clip, og } from "@/lib/seo/site";
import { getGuide, relatedGuides } from "@/server/services/guides.service";
import { cardPhotosFor } from "@/server/services/photo-display.service";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ preview?: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const g = await getGuide(slug);
  if (!g) return { title: "Guide not found", robots: { index: false } };
  const photo = stockPhotoFor(g.category?.slug);
  const path = `/guides/${g.slug}`;
  return { title: g.title, description: clip(g.summary), alternates: { canonical: path },
    openGraph: { ...og({ title: `${g.title} | ${SITE_NAME}`, description: clip(g.summary), url: path, image: { url: photo.url, width: photo.width, height: photo.height, alt: g.title } }), type: "article" } };
}

export default async function GuidePage({ params, searchParams }: Props) {
  const [{ slug }, sp, me] = await Promise.all([params, searchParams, currentUser()]);
  const preview = sp.preview === "1" && me?.role === "ADMIN";
  const g = await getGuide(slug, preview);
  if (!g) notFound();

  const blocks = parseBody(g.body);
  const mins = readMinutes(g.body, g.questions, g.redFlags, g.checklist);
  const photo = stockPhotoFor(g.category?.slug ?? (g.audience === "ARTISAN" ? "carpenter" : null));
  const toc = [
    ...blocks.flatMap((b) => (b.type === "h2" ? [{ id: b.id, text: b.text }] : [])),
    ...(g.prices.length ? [{ id: "prices", text: "What it costs" }] : []),
    ...(g.questions.length ? [{ id: "questions", text: "Questions to ask" }] : []),
    ...(g.redFlags.length ? [{ id: "red-flags", text: "Red flags" }] : []),
    ...(g.checklist.length ? [{ id: "checklist", text: "Checklist" }] : []),
  ];

  const [related, artisans] = await Promise.all([
    relatedGuides(g),
    g.category && g.audience === "CUSTOMER"
      ? db.artisan.findMany({ where: { user: { status: "ACTIVE" }, services: { some: { categoryId: g.category.id } } },
          orderBy: [{ avgRating: "desc" }, { reviewCount: "desc" }], take: 3,
          include: { verifications: { where: { status: "APPROVED" } }, services: { include: { category: true } } } })
      : Promise.resolve([]),
  ]);
  const photos = await cardPhotosFor(artisans.map((a) => a.userId));
  const updated = g.updatedAt.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" });

  const ld = [
    { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.summary, image: [photo.url],
      datePublished: (g.publishedAt ?? g.createdAt).toISOString(), dateModified: g.updatedAt.toISOString(),
      author: { "@type": "Organization", name: SITE_NAME }, publisher: { "@type": "Organization", name: SITE_NAME, logo: { "@type": "ImageObject", url: absoluteUrl("/apple-icon.png") } },
      mainEntityOfPage: absoluteUrl(`/guides/${g.slug}`) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Guides", item: absoluteUrl("/guides") },
      { "@type": "ListItem", position: 2, name: g.title, item: absoluteUrl(`/guides/${g.slug}`) }] },
  ];

  const Toc = ({ className = "" }: { className?: string }) => (
    <ol className={`space-y-1 text-[15px] ${className}`}>
      {toc.map((t) => <li key={t.id}><a href={`#${t.id}`} className="block rounded-lg px-2 py-1.5 text-muted hover:bg-brand-soft hover:text-brand">{t.text}</a></li>)}
    </ol>
  );

  return (
    <main className="mx-auto max-w-5xl p-4 pb-28 sm:p-6">
      {g.status === "PUBLISHED" && <JsonLd data={ld} />}
      {preview && g.status !== "PUBLISHED" && (
        <p className="mb-4 rounded-ctl bg-highlight-soft p-3 text-sm font-medium">Draft preview: only admins can see this. <Link href={`/admin/guides/${g.id}`} className="underline">Back to the editor</Link></p>
      )}
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <Link href="/guides" className="underline-offset-4 hover:underline">Guides</Link>
        {g.category && <><span aria-hidden> / </span><Link href={`/guides?service=${g.category.slug}`} className="underline-offset-4 hover:underline">{g.category.name}</Link></>}
      </nav>

      <header className="relative mt-3 overflow-hidden rounded-[28px] bg-brand-700 text-white">
        {/* The photo sets its own position, so it sits in an absolutely-placed wrapper to never stretch the header. */}
        <div aria-hidden className="absolute inset-0 opacity-60">
          <Photo photo={{ ...photo, alt: "" }} trade={g.category?.name} sizes="(max-width: 1024px) 100vw, 1024px" priority className="h-full w-full" />
        </div>
        <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#002a17]/95 via-[#003a20]/70 to-[#003a20]/20" />
        <div className="relative flex min-h-[300px] flex-col justify-end p-5 sm:min-h-[360px] sm:p-8">
          <p className="text-sm font-semibold text-white/85">{g.audience === "ARTISAN" ? "For artisans" : g.category?.name ?? "Hiring tips"}</p>
          <h1 className="mt-2 max-w-3xl text-[2rem] font-extrabold leading-[1.08] tracking-[-0.02em] sm:text-5xl">{g.title}</h1>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-white/85">{g.summary}</p>
          <p className="mt-4 text-sm text-white/75">{mins} min read <span aria-hidden>·</span> Updated {updated}</p>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_260px]">
        <article className="min-w-0 max-w-[68ch]">
          {toc.length > 2 && (
            <details className="group mb-6 rounded-[18px] bg-white p-3 shadow-soft ring-1 ring-line/70 lg:hidden">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between px-2 font-semibold [&::-webkit-details-marker]:hidden">
                On this page
                <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand transition-transform group-open:rotate-180 motion-reduce:transition-none"><path d="M6 9l6 6 6-6" /></svg>
              </summary>
              <Toc className="mt-2" />
            </details>
          )}

          <GuideBody blocks={blocks} />

          {g.prices.length > 0 && (
            <section aria-labelledby="prices" className="mt-10">
              <h2 id="prices" className="scroll-mt-24 text-2xl font-bold tracking-tight text-ink">What it costs</h2>
              <p className="mt-2 rounded-ctl bg-highlight-soft px-3 py-2 text-sm text-ink"><strong>These are estimates, not fixed prices.</strong> {g.pricesNote}</p>
              <div className="mt-3 overflow-hidden rounded-[18px] bg-white shadow-soft ring-1 ring-line/70">
                <table className="w-full text-left text-[15px]">
                  <caption className="sr-only">Estimated prices in naira</caption>
                  <thead className="bg-brand-soft/70 text-sm text-brand-700"><tr><th scope="col" className="px-4 py-3 font-semibold">Job</th><th scope="col" className="px-4 py-3 text-right font-semibold">Estimate</th></tr></thead>
                  <tbody className="divide-y divide-line">
                    {g.prices.map((p) => (
                      <tr key={p.item}>
                        <td className="px-4 py-3 align-top"><span className="font-medium text-ink">{p.item}</span>{p.note && <span className="block text-sm text-muted">{p.note}</span>}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-right align-top font-semibold tabular-nums text-brand-700">{naira(p.low * 100)} – {naira(p.high * 100)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {g.questions.length > 0 && (
            <section aria-labelledby="questions" className="mt-10">
              <h2 id="questions" className="scroll-mt-24 text-2xl font-bold tracking-tight text-ink">Questions to ask before hiring</h2>
              <ul className="mt-4 space-y-2">
                {g.questions.map((q) => (
                  <li key={q} className="flex gap-3 rounded-[16px] bg-white p-4 text-[16px] shadow-soft ring-1 ring-line/60">
                    <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft font-bold text-brand">?</span><span>{q}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {g.redFlags.length > 0 && (
            <section aria-labelledby="red-flags" className="mt-10 rounded-[20px] bg-danger-soft p-5 sm:p-6">
              <h2 id="red-flags" className="scroll-mt-24 text-2xl font-bold tracking-tight text-danger">Red flags to watch for</h2>
              <ul className="mt-3 space-y-2.5">
                {g.redFlags.map((r) => (
                  <li key={r} className="flex gap-3 text-[16px] text-ink"><span aria-hidden className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-danger text-sm font-bold text-white">!</span><span>{r}</span></li>
                ))}
              </ul>
            </section>
          )}

          {g.checklist.length > 0 && (
            <section aria-labelledby="checklist" className="mt-10">
              <h2 id="checklist" className="scroll-mt-24 text-2xl font-bold tracking-tight text-ink">Checklist</h2>
              <p className="mt-1 text-sm text-muted">Tick as you go. Nothing is saved; it&apos;s just for you.</p>
              <ul className="mt-3 divide-y divide-line overflow-hidden rounded-[18px] bg-white shadow-soft ring-1 ring-line/70">
                {g.checklist.map((c, i) => (
                  <li key={c}><label className="flex cursor-pointer items-start gap-3 px-4 py-3.5 text-[16px] has-[:checked]:text-muted has-[:checked]:line-through">
                    <input type="checkbox" id={`chk-${i}`} className="mt-1 h-5 w-5 shrink-0 accent-[#007A49]" />{c}
                  </label></li>
                ))}
              </ul>
              <a href="/downloads/first-time-hiring-checklist.pdf" download className="mt-3 inline-flex text-sm font-semibold text-brand underline">Download the first-time hiring checklist (PDF)</a>
            </section>
          )}

          {g.category && g.audience === "CUSTOMER" && (
            <section aria-labelledby="hire" className="mt-12">
              <div className="flex items-end justify-between gap-3">
                <h2 id="hire" className="text-2xl font-bold tracking-tight text-ink">Artisans who do this work</h2>
                <Link href={`/services/${g.category.slug}`} className="inline-flex min-h-11 shrink-0 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">See all</Link>
              </div>
              {artisans.length === 0 && <p className="mt-3 text-muted">No one is listed for this service yet. Post your job and we&apos;ll alert artisans as they join.</p>}
              <div className="mt-4 space-y-4">
                {artisans.map((a) => (
                  <ArtisanCard key={a.userId} id={a.userId} businessName={a.businessName} categories={[...new Set(a.services.map((s) => s.category.name))]}
                    avgRating={Number(a.avgRating)} reviewCount={a.reviewCount} priceMinKobo={a.priceMinKobo} priceMaxKobo={a.priceMaxKobo}
                    availability={a.availability} verifiedCount={a.verifications.length} photos={photos[a.userId]} place={placeOf(a)} />
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3 rounded-[20px] bg-brand-soft/70 p-5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[16px] text-ink"><strong>Ready to hire?</strong> Post your job and let artisans near you send their prices.</p>
                <Link href={`/jobs/new?service=${g.category.slug}`} className="inline-flex min-h-12 shrink-0 items-center justify-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-700">Post a job — free</Link>
              </div>
            </section>
          )}
          {g.audience === "ARTISAN" && (
            <div className="mt-10 flex flex-wrap gap-3">
              <Link href="/artisan/photos" className="inline-flex min-h-12 items-center rounded-full bg-brand px-6 font-semibold text-white hover:bg-brand-700">Add work photos</Link>
              <Link href="/jobs" className="inline-flex min-h-12 items-center rounded-full border border-line bg-white px-6 font-semibold hover:bg-paper">Open the job board</Link>
            </div>
          )}
        </article>

        {toc.length > 2 && (
          <aside className="hidden lg:block">
            <nav aria-label="On this page" className="sticky top-6 rounded-[20px] bg-white p-3 shadow-soft ring-1 ring-line/70">
              <p className="px-2 pb-1 pt-1 text-sm font-semibold text-ink">On this page</p>
              <Toc />
            </nav>
          </aside>
        )}
      </div>

      {related.length > 0 && (
        <section aria-labelledby="more" className="mt-14">
          <h2 id="more" className="text-2xl font-bold tracking-tight text-ink">More guides</h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{related.map((r) => <li key={r.id}><GuideCard g={r} /></li>)}</ul>
        </section>
      )}
    </main>
  );
}
