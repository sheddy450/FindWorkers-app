"use client";
import { useMemo, useState } from "react";
import type { Faq } from "@/lib/content/faq";

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\w\s]/g, " ");

/** Searchable FAQs, grouped for customers and artisans, then by topic. Without JavaScript, everything shows. */
export function HelpSearch({ faqs, children }: { faqs: Faq[]; children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
  const hits = useMemo(() => faqs.filter((f) => !words.length || words.every((w) => norm(`${f.q} ${f.a} ${f.topic}`).includes(w))), [faqs, words.join(" ")]); // eslint-disable-line react-hooks/exhaustive-deps
  const groups = (["customers", "artisans"] as const).map((who) => {
    const list = hits.filter((f) => f.for === who);
    const topics = [...new Set(list.map((f) => f.topic))];
    return { who, topics: topics.map((t) => ({ topic: t, items: list.filter((f) => f.topic === t) })), count: list.length };
  });

  return (
    <>
      {/* Green banner: page title and quick links (passed in), then the search box */}
      <section className="mx-auto mt-3 max-w-5xl px-4 sm:px-6">
        <div className="relative overflow-hidden rounded-[28px] bg-brand-700 px-5 pb-7 pt-7 text-white sm:px-8">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(110%_80%_at_100%_0%,rgba(52,199,89,0.35),transparent_55%)]" />
          <div className="relative">
            {children}
      <div className="relative mt-6">
        <label htmlFor="help-q" className="sr-only">Search help</label>
        <svg aria-hidden viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-muted"><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></svg>
        <input id="help-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search, e.g. payment, verified, quotes, password"
          className="min-h-14 w-full rounded-full border-0 bg-white pl-12 pr-5 text-[17px] text-ink shadow-[0_20px_50px_-24px_rgba(0,40,24,0.6)] focus:outline-none focus:ring-4 focus:ring-highlight/50" />
      </div>
      <p className="mt-3 min-h-5 text-sm text-white/85" aria-live="polite">{words.length ? `${hits.length} answer${hits.length === 1 ? "" : "s"} found` : ""}</p>
          </div>
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-5xl gap-8 px-4 text-ink sm:px-6 lg:grid-cols-2">
        {groups.map((g) => (
          <section key={g.who} aria-labelledby={`for-${g.who}`} className="min-w-0">
            <h2 id={`for-${g.who}`} className="text-2xl font-bold tracking-tight">{g.who === "customers" ? "For customers" : "For artisans"}</h2>
            {g.count === 0 && <p className="mt-3 rounded-[16px] bg-white p-4 text-muted shadow-soft">No answers match &ldquo;{q}&rdquo; here. Try another word.</p>}
            {g.topics.map((t) => (
              <div key={t.topic} className="mt-5">
                <h3 className="mb-2 text-sm font-semibold text-muted">{t.topic}</h3>
                <div className="divide-y divide-line overflow-hidden rounded-[18px] bg-white shadow-soft ring-1 ring-line/70">
                  {t.items.map((f) => (
                    <details key={f.q} className="group" open={words.length > 0 && hits.length <= 3}>
                      <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3.5 font-semibold hover:bg-paper/60 [&::-webkit-details-marker]:hidden">
                        {f.q}
                        <span aria-hidden className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft text-brand transition-transform group-open:rotate-45 motion-reduce:transition-none">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.75" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                        </span>
                      </summary>
                      <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
                    </details>
                  ))}
                </div>
              </div>
            ))}
          </section>
        ))}
      </div>
    </>
  );
}
