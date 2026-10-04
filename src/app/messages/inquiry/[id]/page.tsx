import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { HttpError } from "@/lib/http";
import { ThreadClient } from "../../[requestId]/ThreadClient";

export default async function InquiryThread({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requirePageRole("CUSTOMER", "ARTISAN");
  const { id } = await params;
  const c = await db.conversation.findUnique({
    where: {
      id,
    },
    include: {
      artisan: {
        select: {
          name: true,
          artisan: {
            select: {
              businessName: true,
            },
          },
        },
      },
      customer: {
        select: {
          name: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          sender: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });
  if (!c) notFound();
  const side =
    user.id === c.customerId
      ? "CUSTOMER"
      : user.id === c.artisanId
        ? "ARTISAN"
        : null;
  if (!side) throw new HttpError(403, "This isn't your conversation.");
  const otherId = side === "CUSTOMER" ? c.artisanId : c.customerId;
  const otherName =
    side === "CUSTOMER"
      ? (c.artisan.artisan?.businessName ?? c.artisan.name)
      : c.customer.name;
  const blocked = !!(await db.block.findUnique({
    where: { blockerId_blockedId: { blockerId: user.id, blockedId: otherId } },
  }));

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-brand">{otherName}</h1>
          <p className="text-sm text-muted">Direct message</p>
        </div>
        <div className="flex flex-col items-end gap-1 text-sm">
          {side === "CUSTOMER" && (
            <Link
              href={`/artisan-profile/${c.artisanId}`}
              className="font-semibold text-brand underline"
            >
              View profile
            </Link>
          )}
          <Link
            href={`/report?type=USER&id=${otherId}`}
            className="text-muted underline"
          >
            Report
          </Link>
        </div>
      </div>
      <ThreadClient
        requestId={c.id}
        kind="conversation"
        selfId={user.id}
        otherId={otherId}
        otherName={otherName}
        initiallyBlocked={blocked}
      />
    </main>
  );
}
