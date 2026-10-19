import Link from "next/link";
import type { Metadata } from "next";
import { og } from "@/lib/seo/site";
import { Photo } from "@/components/photos/Photo";
import { serviceTiles } from "@/server/services/home.service";

export const metadata: Metadata = {
  title: "All services: plumbers, electricians, mechanics and more",
  description: "Browse every service on FindWorkers, from plumbers and electricians to mechanics, tailors and cleaners. Verified artisans with real reviews across Nigeria.",
  alternates: { canonical: "/categories" },
  openGraph: og({ title: "All services: plumbers, electricians, mechanics and more", description: "Browse every service on FindWorkers, from plumbers and electricians to mechanics, tailors and cleaners. Verified artisans with real reviews across Nigeria.", url: "/categories" }),
};
// Counts and photos change as artisans join: build per request, not once at deploy time.
export const dynamic = "force-dynamic";

export default async function Categories() {
  const tiles = [...(await serviceTiles())].sort((a, b) => a.name.localeCompare(b.name));
  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6">
      <nav aria-label="Breadcrumb" className="text-sm text-muted"><Link href="/" className="underline-offset-4 hover:underline">Home</Link><span aria-hidden> / </span><span>Services</span></nav>
      <h1 className="mt-2 text-3xl font-bold text-brand sm:text-4xl">All services</h1>
      <p className="mt-1 max-w-prose text-muted">Pick a service to see verified artisans across Nigeria, then narrow it down to your state.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((t) => (
          <li key={t.id}>
            <Link href={`/services/${t.slug}`} className="group relative block overflow-hidden rounded-[18px] shadow-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
              <Photo photo={t.photo} trade={t.name} sizes="(max-width: 640px) 50vw, 240px" className="aspect-[4/3] w-full [&_img]:transition-transform [&_img]:duration-500 group-hover:[&_img]:scale-105 motion-reduce:[&_img]:transition-none" />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <span className="absolute inset-x-0 bottom-0 p-3 text-white">
                <span className="block font-semibold leading-tight">{t.name}</span>
                <span className="text-xs text-white/85">{t.count > 0 ? `${t.count} artisan${t.count === 1 ? "" : "s"}` : "New on FindWorkers"}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm text-muted">Can&apos;t find your service? <Link href="/jobs/new" className="font-semibold text-brand underline">Post a job</Link> and describe what you need.</p>
    </main>
  );
}
