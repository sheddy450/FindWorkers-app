import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { blobConfigured } from "@/lib/providers/blob";
import { completeness, MAX_WORK_PHOTOS } from "@/lib/photos/rules";
import { PhotoManager, type ManagedPhoto } from "./PhotoManager";

export const metadata = { title: "Your photos" };

export default async function ArtisanPhotosPage() {
  const user = await requirePageRole("ARTISAN");
  const artisan = await db.artisan.findUnique({
    where: { userId: user.id },
    include: {
      photos: { orderBy: [{ displayOrder: "asc" }, { createdAt: "asc" }] },
      services: { include: { category: { select: { id: true, name: true } } } },
      verifications: { where: { type: "IDENTITY", status: "APPROVED" }, select: { id: true } },
    },
  });
  if (!artisan) redirect("/artisan/profile");
  const [loc] = await db.$queryRaw<{ has: boolean }[]>`SELECT geog IS NOT NULL AS has FROM "Artisan" WHERE "userId" = ${user.id}`;

  const photos: ManagedPhoto[] = artisan.photos.map((p) => ({
    id: p.id, thumbUrl: p.thumbUrl, blurDataUrl: p.blurDataUrl, caption: p.caption, category: p.category,
    categoryId: p.categoryId, pairKey: p.pairKey, isCover: p.isCover, status: p.moderationStatus, rejectReason: p.rejectReason,
  }));
  const services = [...new Map(artisan.services.map((s) => [s.category.id, s.category])).values()];
  const work = photos.filter((p) => p.category !== "PROFILE");
  const { percent, steps } = completeness({
    hasProfilePhoto: photos.some((p) => p.category === "PROFILE" && p.status !== "REJECTED"),
    workPhotos: work.filter((p) => p.status !== "REJECTED").length,
    hasBio: !!artisan.bio?.trim(), hasPrice: artisan.priceMinKobo != null, services: services.length,
    hasLocation: !!loc?.has || !!(artisan.state && artisan.lga), idVerified: artisan.verifications.length > 0,
  });
  const todo = steps.filter((s) => !s.done);

  return (
    <main className="mx-auto max-w-2xl space-y-5 p-4 sm:p-6">
      <div>
        <h1 className="text-3xl font-bold text-brand">Your photos</h1>
        <p className="mt-1 text-muted">Customers hire people whose work they can see. Show your best jobs: clear, bright photos of finished work.</p>
      </div>

      <Card className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="font-semibold">Profile strength</p>
          <p className="font-display text-2xl font-bold text-brand">{percent}%</p>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-brand-soft" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profile strength">
          <div className="h-full rounded-full bg-brand transition-[width] duration-500 motion-reduce:transition-none" style={{ width: `${percent}%` }} />
        </div>
        {todo.length > 0 ? (
          <ul className="space-y-1.5 text-sm">
            {todo.slice(0, 3).map((s) => (
              <li key={s.key} className="flex items-center gap-2">
                <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
                {s.key === "work" || s.key === "profile" ? s.label
                  : <Link href={s.key === "id" ? "/artisan/verification" : "/artisan/profile"} className="font-medium text-brand underline-offset-4 hover:underline">{s.label}</Link>}
              </li>
            ))}
          </ul>
        ) : <p className="text-sm text-muted">Your profile is complete. Keep adding recent jobs to stay fresh.</p>}
        <p className="text-xs text-muted">Profiles with clear work photos stand out in search and on your service&apos;s page.</p>
      </Card>

      {!blobConfigured() && <Alert variant="info" title="Photo uploads are coming soon">We&apos;re setting up photo storage. You&apos;ll be able to add photos here shortly.</Alert>}

      <PhotoManager photos={photos} services={services} maxWork={MAX_WORK_PHOTOS} enabled={blobConfigured()} />
    </main>
  );
}
