import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { AdminNav } from "@/components/AdminNav";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";

export const metadata = { title: "Guides" };

export default async function AdminGuides() {
  await requirePageRole("ADMIN");
  const guides = await db.guide.findMany({ orderBy: [{ status: "asc" }, { updatedAt: "desc" }], include: { category: { select: { name: true } } } });
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-brand">Guides</h1>
        <Link href="/admin/guides/new" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-700">New guide</Link>
      </div>
      <AdminNav />
      <p className="text-muted">Hiring guides shown at /guides, on the home page and on service pages. Drafts are only visible to admins.</p>
      {guides.length === 0 && <EmptyState icon="info" title="No guides yet" body="Write your first hiring guide." action={{ label: "New guide", href: "/admin/guides/new" }} />}
      <ul className="space-y-3">
        {guides.map((g) => (
          <li key={g.id}>
            <Link href={`/admin/guides/${g.id}`} className="block">
              <Card className="flex items-start justify-between gap-3 transition hover:border-brand/30 hover:shadow-md motion-reduce:transition-none">
                <div className="min-w-0">
                  <p className="font-semibold">{g.title}</p>
                  <p className="text-sm text-muted">{g.audience === "ARTISAN" ? "For artisans" : g.category?.name ?? "General"} · /guides/{g.slug} · updated {g.updatedAt.toLocaleDateString("en-NG")}</p>
                </div>
                <Badge tone={g.status === "PUBLISHED" ? "verified" : "warning"}>{g.status === "PUBLISHED" ? "Live" : "Draft"}</Badge>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
