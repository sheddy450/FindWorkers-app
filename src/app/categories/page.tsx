import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";
import { og } from "@/lib/seo/site";
import { Icon } from "@/components/ui/Icon";

export const metadata: Metadata = {
  title: "All services: plumbers, electricians, mechanics and more",
  description: "Browse every service on FindWorkers, from plumbers and electricians to mechanics, tailors and cleaners. Verified artisans with real reviews across Nigeria.",
  alternates: { canonical: "/categories" },
  openGraph: og({ title: "All services: plumbers, electricians, mechanics and more", description: "Browse every service on FindWorkers, from plumbers and electricians to mechanics, tailors and cleaners. Verified artisans with real reviews across Nigeria.", url: "/categories" }),
};

export default async function Categories() {
  const categories = await db.serviceCategory.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });
  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold text-brand">All services</h1>
      <p className="mt-1 text-muted">
        Pick a service to see verified artisans across Nigeria, then narrow it down to your state.
      </p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {categories.map((c: (typeof categories)[number]) => (
          <Link
            key={c.id}
            href={`/services/${c.slug}`}
            className="flex flex-col items-center gap-2 rounded-card border border-line bg-white p-4 text-center"
          >
            <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand">
              <Icon name="wrench" size={22} />
            </span>
            <span className="text-sm font-medium">{c.name}</span>
          </Link>
        ))}
      </div>
    </main>
  );
}
