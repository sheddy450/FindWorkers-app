import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { EmptyState } from "@/components/ui/States";
import { LABEL } from "@/lib/requests/rules";
import { NotificationRow } from "./NotificationRow";
import { MarkAllRead } from "./MarkAllRead";

function describe(
  type: string,
  payload: any,
  categoryById: Map<string, string>,
): { label: string; href: string } {
  if (type === "request.new")
    return {
      label: `New service request: ${categoryById.get(payload.requestId) ?? "a job"}`,
      href: `/requests/${payload.requestId}`,
    };
  if (type === "request.status") {
    const status = String(payload.to) as keyof typeof LABEL;
    return {
      label: `Request update: ${LABEL[status] ?? payload.to}`,
      href: `/requests/${payload.requestId}`,
    };
  }
  if (type === "message.new")
    return payload.conversationId
      ? {
          label: "New message",
          href: `/messages/inquiry/${payload.conversationId}`,
        }
      : { label: "New message", href: `/messages/${payload.requestId}` };
  if (type === "verification.decision")
    return {
      label: `${payload.type} verification ${payload.decision === "APPROVED" ? "approved" : "not approved"}`,
      href: "/artisan/verification",
    };
  if (type === "pro.activated")
    return { label: "Your Pro plan is active", href: "/artisan/pro" };
  return { label: "Notification", href: "/" };
}

export default async function Notifications() {
  const user = await requirePageRole("CUSTOMER", "ARTISAN", "ADMIN");
  const notifications: Array<{
    id: string;
    type: string;
    payload: any;
    readAt: Date | null;
    createdAt: Date;
  }> = await db.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const requestIds = [
    ...new Set(
      notifications
        .filter((n) =>
          ["request.new", "request.status", "message.new"].includes(n.type),
        )
        .map((n) => (n.payload as any).requestId)
        .filter(Boolean),
    ),
  ];
  const requests: Array<{
    id: string;
    category: { name: string };
  }> = requestIds.length
    ? await db.serviceRequest.findMany({
        where: { id: { in: requestIds } },
        include: { category: true },
      })
    : [];
  const categoryById = new Map<string, string>(
    requests.map((r: { id: string; category: { name: string } }) => [
      r.id,
      r.category.name,
    ]),
  );

  const unreadCount = notifications.filter((n) => !n.readAt).length;

  return (
    <main className="mx-auto max-w-md p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-brand">Notifications</h1>
        {unreadCount > 0 && <MarkAllRead />}
      </div>
      {notifications.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon="info"
            title="Nothing yet"
            body="Updates about your requests, messages, and verification will show up here."
          />
        </div>
      )}
      <div className="mt-4 space-y-2">
        {notifications.map((n) => {
          const { label, href } = describe(n.type, n.payload, categoryById);
          return (
            <NotificationRow
              key={n.id}
              id={n.id}
              label={label}
              href={href}
              createdAt={n.createdAt.toISOString()}
              read={!!n.readAt}
            />
          );
        })}
      </div>
    </main>
  );
}
