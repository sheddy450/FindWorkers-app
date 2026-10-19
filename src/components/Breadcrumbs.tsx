import Link from "next/link";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl } from "@/lib/seo/site";

/** "Home / Services / Plumber / Lagos / Ola Plumbing" — the last item is the current page. Also tells Google the trail. */
export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList",
        itemListElement: items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.label, ...(it.href ? { item: absoluteUrl(it.href) } : {}) })) }} />
      <nav aria-label="Breadcrumb" className="text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
          {items.map((it, i) => (
            <li key={`${it.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
              {i > 0 && <span aria-hidden className="text-line">/</span>}
              {it.href && i < items.length - 1
                ? <Link href={it.href} className="underline-offset-4 hover:text-brand hover:underline">{it.label}</Link>
                : <span aria-current="page" className="truncate font-medium text-ink">{it.label}</span>}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
