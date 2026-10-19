import Link from "next/link";
import type { Metadata } from "next";
import { og } from "@/lib/seo/site";
import { GuideCard } from "@/components/guides/GuideCard";
import { EmptyState } from "@/components/ui/States";
import { listGuides } from "@/server/services/guides.service";

export const dynamic = "force-dynamic";
const description = "Plain advice for hiring artisans in Nigeria: what jobs should cost in naira, questions to ask, warning signs and checklists for plumbers, electricians, AC, tailors, generators and solar.";
export const metadata: Metadata = {
  title: "Hiring guides: prices, questions and checklists",
  description, alternates: { canonical: "/guides" },
  openGraph: og({ title: "Hiring guides | FindWorkers", description, url: "/guides" }),
};

export default async function Guides({ searchParams }: { searchParams: Promise<{ q?: string; service?: string; for?: string }> }) {
  const sp = await searchParams;
  const audience = sp.for === "artisans" ? "ARTISAN" as const : undefined;
  const [guides, all] = await Promise.all([
    listGuides({ q: sp.q, category: sp.service, audience }),
    listGuides(),
  ]);
  // Filter chips: only trades that actually have guides.
  const trades = [...new Map(all.filter((g) => g.category).map((g) => [g.category!.slug, g.category!.name])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const hasArtisan = all.some((g) => g.audience === "ARTISAN");
  const chip = (on: boolean) => `inline-flex min-h-10 items-center rounded-full px-4 text-sm font-medium transition-colors motion-reduce:transition-none ${on ? "bg-brand text-white" : "bg-white text-ink ring-1 ring-line/70 hover:text-brand hover:ring-brand/40"}`;
  const filtered = !!(sp.q || sp.service || audience);

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/" className="underline-offset-4 hover:underline">Home</Link><span aria-hidden> / </span><span>Guides</span></nav>
      <header className="mt-2 max-w-2xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">Hire with confidence</h1>
        <p className="mt-2 text-[17px] leading-relaxed text-muted">What jobs should cost, the questions to ask, and the warning signs to watch for. Written for homes and shops in Nigeria.</p>
      </header>

      <form action="/guides" method="get" role="search" className="mt-5 flex max-w-xl gap-2">
        {sp.service && <input type="hidden" name="service" value={sp.service} />}
        <label htmlFor="guide-q" className="sr-only">Search guides</label>
        <input id="guide-q" name="q" defaultValue={sp.q} placeholder="Search, e.g. AC gas, wiring, agbada" className="min-h-12 flex-1 rounded-full border border-line bg-white px-5 text-base focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15" />
        <button className="min-h-12 rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-700">Search</button>
      </form>

      <nav aria-label="Filter guides" className="mt-4 flex flex-wrap gap-2">
        <Link href="/guides" className={chip(!sp.service && !audience)} aria-current={!sp.service && !audience ? "page" : undefined}>All</Link>
        {trades.map(([slug, name]) => <Link key={slug} href={`/guides?service=${slug}`} className={chip(sp.service === slug)} aria-current={sp.service === slug ? "page" : undefined}>{name}</Link>)}
        {hasArtisan && <Link href="/guides?for=artisans" className={chip(!!audience)} aria-current={audience ? "page" : undefined}>For artisans</Link>}
      </nav>

      {guides.length === 0 ? (
        <div className="mt-6"><EmptyState icon="search" title={filtered ? "No guides match that" : "Guides are coming soon"} body={filtered ? "Try another word, or browse all guides." : "We're writing our first hiring guides. Check back soon."} action={filtered ? { label: "See all guides", href: "/guides" } : undefined} /></div>
      ) : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g, i) => <li key={g.id}><GuideCard g={g} priority={i < 2} /></li>)}
        </ul>
      )}

      <section aria-labelledby="checklist-dl" className="mt-10 flex flex-col gap-4 overflow-hidden rounded-[24px] bg-brand-700 p-6 text-white sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="max-w-lg">
          <h2 id="checklist-dl" className="text-2xl font-bold tracking-tight">First-time hiring checklist</h2>
          <p className="mt-1 text-white/85">One page to keep on your phone or print: what to check before, during and after any job.</p>
        </div>
        <a href="/downloads/first-time-hiring-checklist.pdf" download className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-highlight px-6 font-semibold text-ink hover:brightness-105">
          <svg aria-hidden viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
          Download the PDF
        </a>
      </section>
    </main>
  );
}
