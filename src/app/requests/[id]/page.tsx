import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { HttpError } from "@/lib/http";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { StatusTimeline } from "@/components/StatusTimeline";
import { TRANSITIONS } from "@/lib/requests/rules";
import { Actions } from "./Actions";
import { ReviewForm } from "./ReviewForm";

export default async function RequestDetail({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { new?: string };
}) {
  const user = await requirePageRole("CUSTOMER", "ARTISAN", "ADMIN");
  const r = await db.serviceRequest.findUnique({
    where: { id: params.id },
    include: {
      category: true,
      artisan: { select: { businessName: true } },
      customer: { select: { name: true } },
      photos: true,
      review: true,
    },
  });
  if (!r) notFound();
  // Admins can open any request as a read-only observer; the ownership check only guards the other two roles.
  const side =
    user.id === r.customerId
      ? "CUSTOMER"
      : user.id === r.artisanId
        ? "ARTISAN"
        : user.role === "ADMIN"
          ? "ADMIN"
          : null;
  if (!side) throw new HttpError(403, "This isn't your request.");

  // REVIEWED is excluded here: it only happens through the review form below, which records the rating atomically.
  const options =
    side === "ADMIN"
      ? []
      : TRANSITIONS[r.status]
          .filter((t) => t.by === side && t.to !== "REVIEWED")
          .map((t) => {
            const variant: "primary" | "danger" =
              t.to === "REJECTED" || t.to === "CANCELLED"
                ? "danger"
                : "primary";

            return {
              to: t.to,
              label:
                t.to === "REJECTED"
                  ? "Decline"
                  : t.to === "CANCELLED"
                    ? "Cancel request"
                    : t.to === "COMPLETED"
                      ? "Confirm completed"
                      : t.to.replace("_", " "),
              variant,
            };
          });

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-brand">{r.category.name}</h1>
          <p className="text-muted">
            {side === "ADMIN"
              ? `${r.customer.name} → ${r.artisan.businessName}`
              : side === "ARTISAN"
                ? r.customer.name
                : r.artisan.businessName}{" "}
            · {r.address}
          </p>
        </div>
        {side !== "ADMIN" && (
          <Link
            href={`/messages/${r.id}`}
            className="text-sm font-semibold text-brand underline"
          >
            Message
          </Link>
        )}
      </div>
      {side === "ADMIN" && (
        <p className="mt-1 text-xs text-muted">Viewing as admin — read only</p>
      )}
      {searchParams.new === "1" && side === "CUSTOMER" && (
        <div className="mt-4">
          <Alert variant="success" title="Request sent">
            {r.artisan.businessName} has been notified and can accept or
            decline. You'll see updates here and get a notification either way.
          </Alert>
        </div>
      )}
      <div className="mt-6">
        <StatusTimeline status={r.status} />
      </div>
      <Card className="mt-6">
        <p className="text-sm">{r.description}</p>
        {r.preferredAt && (
          <p className="mt-2 text-sm text-muted">
            Preferred: {r.preferredAt.toLocaleString("en-NG")}
          </p>
        )}
        {r.photos.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {r.photos.map((photo: { id: string; storageKey: string }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={photo.id}
                src={`/api/request-photo?key=${encodeURIComponent(photo.storageKey)}`}
                alt="Job photo"
                className="h-20 w-20 rounded-ctl border border-line object-cover"
              />
            ))}
          </div>
        )}
      </Card>
      <div className="mt-6">
        <Actions id={r.id} options={options} />
      </div>
      {side === "CUSTOMER" && r.status === "COMPLETED" && (
        <div className="mt-6">
          <ReviewForm requestId={r.id} />
        </div>
      )}
      {r.status === "REVIEWED" && (
        <p className="mt-4 text-sm text-muted">Thanks for your review!</p>
      )}
    </main>
  );
}
