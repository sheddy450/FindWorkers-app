import { JsonLd } from "@/components/seo/JsonLd";
import type { Faq as FaqItem } from "@/lib/content/faq";

/**
 * Accordion built on <details>: works without JavaScript, keyboard and screen-reader friendly.
 * Also tells Google these are FAQs (FAQPage structured data).
 */
export function Faq({ items, id = "faq" }: { items: FaqItem[]; id?: string }) {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <div id={id} className="divide-y divide-line overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 ring-line/70">
        {items.map((f) => (
          <details key={f.q} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-semibold text-ink marker:hidden hover:bg-paper/60 [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              </span>
            </summary>
            <p className="px-5 pb-5 text-[15px] leading-relaxed text-muted">{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}
