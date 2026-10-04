import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/States";

export default async function Messages() {
  const user = await requirePageRole("CUSTOMER", "ARTISAN");

  const [requestRows, conversationRows] = await Promise.all([
    db.serviceRequest.findMany({
      where:
        user.role === "CUSTOMER"
          ? { customerId: user.id }
          : { artisanId: user.id },

      orderBy: {
        updatedAt: "desc",
      },

      include: {
        category: true,

        artisan: {
          select: {
            businessName: true,
          },
        },

        customer: {
          select: {
            name: true,
          },
        },

        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    }),

    db.conversation.findMany({
      where:
        user.role === "CUSTOMER"
          ? { customerId: user.id }
          : { artisanId: user.id },

      orderBy: {
        updatedAt: "desc",
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
            createdAt: "desc",
          },
          take: 1,
        },
      },
    }),
  ]);

  const threads: {
    kind: "request" | "conversation";
    id: string | number;
    name: string;
    subtitle: string;
    lastAt: Date;
    lastBody: string;
  }[] = [
    ...requestRows
      .filter((r: (typeof requestRows)[number]) => r.messages.length > 0)
      .map((r: (typeof requestRows)[number]) => ({
        kind: "request" as const,
        id: r.id,

        name:
          user.role === "CUSTOMER" ? r.artisan.businessName : r.customer.name,

        subtitle: r.category.name,
        lastAt: r.messages[0].createdAt,
        lastBody: r.messages[0].body,
      })),

    ...conversationRows
      .filter((c: (typeof conversationRows)[number]) => c.messages.length > 0)
      .map((c: (typeof conversationRows)[number]) => ({
        kind: "conversation" as const,
        id: c.id,

        name:
          user.role === "CUSTOMER"
            ? (c.artisan.artisan?.businessName ?? c.artisan.name)
            : c.customer.name,

        subtitle: "Direct message",
        lastAt: c.messages[0].createdAt,
        lastBody: c.messages[0].body,
      })),
  ].sort((a, b) => +b.lastAt - +a.lastAt);

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-bold text-brand">Messages</h1>

      {threads.length === 0 && (
        <div className="mt-6">
          <EmptyState
            icon="chat"
            title="No conversations yet"
            body="Message an artisan directly from their profile, or messages about a job appear here once a request is sent."
          />
        </div>
      )}

      <div className="mt-4 space-y-3">
        {threads.map((t) => (
          <Link
            key={`${t.kind}-${t.id}`}
            href={
              t.kind === "request"
                ? `/messages/${t.id}`
                : `/messages/inquiry/${t.id}`
            }
          >
            <Card>
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{t.name}</p>

                <span className="text-xs text-muted">
                  {t.lastAt.toLocaleDateString("en-NG")}
                </span>
              </div>

              <p className="text-sm text-muted">{t.subtitle}</p>

              <p className="mt-1 truncate text-sm">{t.lastBody}</p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
