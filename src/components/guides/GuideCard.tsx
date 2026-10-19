import Link from "next/link";
import { Photo } from "@/components/photos/Photo";
import { stockPhotoFor } from "@/lib/photos/stock";
import { readMinutes } from "@/lib/guides/format";

type G = { slug: string; title: string; summary: string; audience: "CUSTOMER" | "ARTISAN"; body: string; questions: string[]; redFlags: string[]; checklist: string[];
  category: { slug: string; name: string } | null };

/** Guide card: photo of the trade, title, summary and reading time. */
export function GuideCard({ g, priority = false }: { g: G; priority?: boolean }) {
  const photo = stockPhotoFor(g.category?.slug ?? (g.audience === "ARTISAN" ? "carpenter" : null));
  const mins = readMinutes(g.body, g.questions, g.redFlags, g.checklist);
  return (
    <Link href={`/guides/${g.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 ring-line/70 transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-18px_rgba(0,107,64,0.45)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <span className="relative block">
        <Photo photo={{ ...photo, alt: "" }} trade={g.category?.name} sizes="(max-width: 640px) 100vw, 330px" priority={priority}
          className="aspect-[16/9] w-full [&_img]:transition-transform [&_img]:duration-700 group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-brand shadow-sm">
          {g.audience === "ARTISAN" ? "For artisans" : g.category?.name ?? "Hiring tips"}
        </span>
      </span>
      <span className="flex flex-1 flex-col p-4">
        <span className="text-lg font-bold leading-snug text-ink group-hover:text-brand">{g.title}</span>
        <span className="mt-1.5 line-clamp-3 text-[15px] leading-relaxed text-muted">{g.summary}</span>
        <span className="mt-auto pt-3 text-sm font-medium text-muted">{mins} min read</span>
      </span>
    </Link>
  );
}
