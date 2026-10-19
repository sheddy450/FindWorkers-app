/**
 * Loading screens shown the instant someone taps a link, while the page is built on the server.
 * Shaped like the real pages, so nothing jumps when the content arrives. Announced once to screen readers.
 */
const B = ({ className = "" }: { className?: string }) => <div aria-hidden className={`fw-skel rounded-[12px] ${className}`} />;

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <main className={`mx-auto ${wide ? "max-w-5xl" : "max-w-2xl"} p-4 sm:p-6`} aria-busy="true">
      <p className="sr-only" role="status">Loading…</p>
      {children}
    </main>
  );
}

const CardSkel = () => (
  <div aria-hidden className="overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 ring-line/70">
    <div className="fw-skel aspect-[16/9] w-full sm:aspect-[21/9]" />
    <div className="flex items-center gap-3 px-4 py-3"><div className="flex-1 space-y-2"><B className="h-4 w-1/2" /><B className="h-4 w-1/3" /></div><B className="h-10 w-10 rounded-full" /></div>
  </div>
);

/** Generic page: title, a line of text, a few cards. */
export function ListPageSkeleton() {
  return <Shell><B className="h-9 w-2/3" /><B className="mt-3 h-4 w-5/6" /><div className="mt-6 space-y-3">{[0, 1, 2, 3].map((i) => <B key={i} className="h-20 w-full rounded-[16px]" />)}</div></Shell>;
}

/** Search results and service listings: title, filters, artisan cards. */
export function CardsPageSkeleton({ hero = false }: { hero?: boolean }) {
  return (
    <Shell>
      {hero && <B className="mb-5 aspect-[21/9] w-full rounded-[16px]" />}
      <B className="h-9 w-3/4" /><B className="mt-3 h-4 w-full" /><B className="mt-2 h-4 w-2/3" />
      <div className="mt-4 flex gap-2">{[0, 1, 2].map((i) => <B key={i} className="h-10 w-24 rounded-full" />)}</div>
      <div className="mt-5 space-y-4"><CardSkel /><CardSkel /></div>
    </Shell>
  );
}

/** Photo tiles (all services, a city, guides). */
export function TilesPageSkeleton() {
  return (
    <Shell wide>
      <B className="h-10 w-1/2" /><B className="mt-3 h-4 w-2/3" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{Array.from({ length: 8 }).map((_, i) => <B key={i} className="aspect-[4/3] w-full rounded-[18px]" />)}</div>
    </Shell>
  );
}

/** Artisan profile. */
export function ProfileSkeleton() {
  return (
    <Shell>
      <B className="h-4 w-2/3" />
      <B className="mt-5 h-20 w-20 rounded-full" /><B className="mt-4 h-8 w-2/3" /><B className="mt-2 h-4 w-1/2" />
      <div className="mt-4 flex gap-2"><B className="h-8 w-32 rounded-full" /><B className="h-8 w-24 rounded-full" /></div>
      <B className="mt-5 h-4 w-full" /><B className="mt-2 h-4 w-5/6" />
      <div className="mt-6 grid grid-cols-2 gap-3"><B className="h-12 rounded-full" /><B className="h-12 rounded-full" /></div>
      <div className="mt-8 grid grid-cols-2 gap-2 sm:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <B key={i} className="aspect-square w-full" />)}</div>
    </Shell>
  );
}

/** Guide or long article. */
export function ArticleSkeleton() {
  return (
    <Shell wide>
      <B className="h-4 w-40" /><B className="mt-3 h-[300px] w-full rounded-[28px] sm:h-[360px]" />
      <div className="mt-8 max-w-[68ch] space-y-3">{["100%", "95%", "88%", "100%", "70%", "92%", "60%"].map((w, i) => <div key={i} style={{ width: w }}><B className="h-4" /></div>)}</div>
    </Shell>
  );
}

/** A request, job or chat. */
export function DetailSkeleton() {
  return (
    <Shell>
      <B className="h-5 w-32" /><B className="mt-3 h-9 w-4/5" />
      <div className="mt-4 grid grid-cols-2 gap-2"><B className="h-16" /><B className="h-16" /></div>
      <B className="mt-4 h-28 w-full rounded-[16px]" />
      <div className="mt-6 space-y-3"><B className="h-32 w-full rounded-[16px]" /><B className="h-24 w-full rounded-[16px]" /></div>
    </Shell>
  );
}

/** Home page: hero and tiles. */
export function HomeSkeleton() {
  return (
    <main className="mx-auto max-w-5xl px-4 pb-6 pt-4 sm:px-6" aria-busy="true">
      <p className="sr-only" role="status">Loading…</p>
      <div aria-hidden className="h-[520px] rounded-[28px] bg-brand-700/90 sm:h-[460px]" />
      <B className="mt-10 h-8 w-56" />
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3"><B className="col-span-2 aspect-[16/9] sm:col-span-1 sm:row-span-2 sm:aspect-auto" />{[0, 1, 2, 3].map((i) => <B key={i} className="aspect-[4/3]" />)}</div>
    </main>
  );
}
