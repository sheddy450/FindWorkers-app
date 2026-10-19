import { CITIES } from "@/lib/places/cities";

/**
 * "I need a [service] in [city]" — the search reads like a sentence. A plain GET form to /browse,
 * so it works before (or without) JavaScript; /browse sends people to the right listing page.
 */
export function HeroSearch({ services }: { services: { slug: string; name: string }[] }) {
  const pick = "w-full appearance-none rounded-ctl border-0 bg-brand-soft/70 py-2.5 pl-3 pr-9 font-display text-[1.35rem] font-bold leading-tight text-brand-700 focus:bg-brand-soft focus:outline-none focus:ring-4 focus:ring-brand/20 sm:text-2xl";
  const chevron = (
    <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-brand"><path d="M6 9l6 6 6-6" /></svg>
  );
  return (
    <form action="/browse" method="get" role="search" aria-label="Find an artisan"
      className="rounded-[22px] bg-white p-4 text-ink shadow-[0_24px_60px_-28px_rgba(0,40,24,0.55)] sm:p-5">
      <div className="grid gap-x-3 gap-y-2 sm:grid-cols-[auto_1fr] sm:items-center">
        <label htmlFor="hero-service" className="text-lg font-semibold text-muted">I need a</label>
        <span className="relative">
          <select id="hero-service" name="service" defaultValue="" className={pick}>
            <option value="">service of any kind</option>
            {services.map((s) => <option key={s.slug} value={s.slug}>{s.name.toLowerCase()}</option>)}
          </select>
          {chevron}
        </span>
        <label htmlFor="hero-city" className="text-lg font-semibold text-muted">in</label>
        <span className="relative">
          <select id="hero-city" name="city" defaultValue="" className={pick}>
            <option value="">anywhere in Nigeria</option>
            {CITIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
          </select>
          {chevron}
        </span>
      </div>
      <button type="submit" className="mt-4 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-brand px-6 text-lg font-semibold text-white shadow-soft transition hover:bg-brand-700 active:scale-[0.99] motion-reduce:transition-none">
        <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        Find artisans
      </button>
    </form>
  );
}
