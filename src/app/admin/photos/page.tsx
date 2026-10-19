import Link from "next/link";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import { CATEGORY_LABEL } from "@/lib/photos/rules";
import { photoQueue } from "@/server/services/photo-moderation.service";
import { PhotoDecision } from "./PhotoDecision";

export const metadata = { title: "Photo review" };

const STATUS: Record<string, string> = { APPROVED: "live", PENDING: "waiting for review", REJECTED: "rejected" };

export default async function AdminPhotos() {
  await requirePageRole("ADMIN");
  const { items, total } = await photoQueue();
  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-brand">Photo review</h1>
      <AdminNav />
      <p className="text-muted">
        Oldest first{total > items.length ? ` · showing ${items.length} of ${total}` : ""}. Approve photos of real work by this artisan.
        Reject stock, copied, blurry or off-topic photos, and anything showing people&apos;s faces, phone numbers or addresses without need.
      </p>
      {items.length === 0 && <EmptyState icon="check" title="No photos to review" body="New uploads will show up here." />}
      {items.map((p) => (
        <Card key={p.id} className="space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <Link href={`/admin/users/${p.artisan.userId}`} className="font-semibold text-ink underline-offset-4 hover:underline">{p.artisan.businessName}</Link>
              <p className="truncate text-sm text-muted">{p.artisan.user.name}{p.artisan.lga || p.artisan.state ? ` · ${[p.artisan.lga, p.artisan.state].filter(Boolean).join(", ")}` : ""} · {p.artisan._count.photos} photo{p.artisan._count.photos === 1 ? "" : "s"}</p>
            </div>
            <div className="flex shrink-0 flex-wrap justify-end gap-1">
              <Badge tone="brand">{CATEGORY_LABEL[p.category]}</Badge>
              {p.service && <Badge>{p.service.name}</Badge>}
            </div>
          </div>

          <a href={p.url} target="_blank" rel="noopener noreferrer" className="block overflow-hidden rounded-ctl bg-paper" title="Open full size in a new tab">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.thumbUrl} alt={p.caption} loading="lazy" decoding="async" width={p.width} height={p.height}
              style={{ backgroundImage: `url("${p.blurDataUrl}")`, backgroundSize: "cover" }}
              className={`mx-auto max-h-80 w-auto object-contain ${p.category === "PROFILE" ? "rounded-full" : ""}`} />
          </a>
          <p className="text-sm"><span className="font-medium">Caption:</span> {p.caption}</p>
          <p className="text-xs text-muted">Uploaded {p.createdAt.toLocaleString("en-NG")} · {p.width}×{p.height}px</p>

          {p.lookalikes.length > 0 && (
            <Alert variant="warning" title="Looks like the same picture as a photo from another artisan">
              {p.lookalikes.map((l) => `${l.businessName} (${STATUS[l.status]}, uploaded ${l.earlier ? "earlier" : "later"})`).join("; ")}.
              {" "}Check who really did this job before approving.
            </Alert>
          )}
          {p.lookalikes.length > 0 && (
            <ul className="flex gap-2">
              {p.lookalikes.map((l) => (
                <li key={l.id}><Link href={`/admin/users/${l.artisanId}`} title={`${l.businessName}: ${l.caption}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.thumbUrl} alt={l.caption} className="h-16 w-16 rounded-ctl object-cover" loading="lazy" />
                </Link></li>
              ))}
            </ul>
          )}

          <p className="text-sm">
            <span className="text-muted">Stock or stolen? Search the web for this photo: </span>
            <a href={`https://lens.google.com/uploadbyurl?url=${encodeURIComponent(p.url)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">Google Lens</a>
            {" · "}
            <a href={`https://tineye.com/search?url=${encodeURIComponent(p.url)}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand underline">TinEye</a>
          </p>
          <PhotoDecision id={p.id} suggestStolen={p.lookalikes.some((l) => l.earlier)} />
        </Card>
      ))}
    </main>
  );
}
