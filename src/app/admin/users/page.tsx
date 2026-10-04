import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { AdminNav } from "@/components/AdminNav";
import type { Role } from "@prisma/client";

const STATUS_TONE = { ACTIVE: "verified", SUSPENDED: "warning", DEACTIVATED: "danger" } as const;

export default async function AdminUsers({ searchParams }: { searchParams: { q?: string; role?: string } }) {
  await requirePageRole("ADMIN");
  const q = (searchParams.q ?? "").trim();
  const role = (searchParams.role as Role | undefined) && ["CUSTOMER", "ARTISAN", "ADMIN"].includes(searchParams.role!) ? (searchParams.role as Role) : undefined;
  const users = await db.user.findMany({
    where: { ...(role ? { role } : {}), ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }, { phoneE164: { contains: q } }] } : {}) },
    orderBy: { createdAt: "desc" }, take: 50,
    select: { id: true, name: true, email: true, phoneE164: true, role: true, status: true, createdAt: true },
  });

  return (
    <main className="mx-auto max-w-2xl space-y-4 p-6">
      <h1 className="text-3xl font-bold text-brand">Users</h1>
      <AdminNav />
      <form className="flex gap-2">
        <input name="q" defaultValue={q} placeholder="Search name, email or phone" className="min-h-11 flex-1 rounded-ctl border border-line bg-white px-3" />
        <select name="role" defaultValue={role ?? ""} className="min-h-11 rounded-ctl border border-line bg-white px-2">
          <option value="">All roles</option><option value="CUSTOMER">Customers</option><option value="ARTISAN">Artisans</option><option value="ADMIN">Admins</option>
        </select>
        <button className="min-h-11 rounded-ctl bg-brand px-4 text-sm font-semibold text-white">Search</button>
      </form>
      {users.length === 0 && <EmptyState icon="user" title="No users found" body="Try a different search." />}
      <div className="space-y-2">
        {users.map((u) => (
          <Link key={u.id} href={`/admin/users/${u.id}`}>
            <Card className="flex items-center justify-between gap-2">
              <div><p className="font-semibold">{u.name}</p><p className="text-sm text-muted">{u.email ?? u.phoneE164} · {u.role}</p></div>
              <Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
