import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { AccountForm } from "./AccountForm";
import { PasswordForm } from "./PasswordForm";
import { SignOutButton } from "./SignOutButton";
import { PhoneVerifyCard } from "./PhoneVerifyCard";
import { smsConfigured } from "@/lib/providers/sms";

export default async function Profile() {
  const user = await requirePageRole("CUSTOMER", "ARTISAN", "ADMIN");
  const [full, unreadCount] = await Promise.all([
    db.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, phoneE164: true, phoneVerifiedAt: true, role: true, createdAt: true } }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
  ]);
  if (!full) return null;

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-brand">Profile</h1>
        <SignOutButton />
      </div>

      <Card className="flex items-center justify-between gap-2">
        <div><p className="font-semibold">{full.name}</p><p className="text-sm text-muted">{full.role} · joined {full.createdAt.toLocaleDateString("en-NG")}</p></div>
        <Link href="/notifications" className="flex items-center gap-2">
          <span className="rounded-full border border-line bg-white px-3 py-1 text-sm font-medium">Notifications</span>
          {unreadCount > 0 && <Badge tone="danger">{unreadCount}</Badge>}
        </Link>
      </Card>

      {full.role === "ARTISAN" && (
        <Card className="flex flex-wrap gap-3 text-sm font-semibold text-brand underline">
          <Link href="/artisan/dashboard">Dashboard</Link><Link href="/artisan/profile">Edit business profile</Link><Link href="/artisan/verification">Verification</Link>
        </Card>
      )}
      {full.role === "ADMIN" && (
        <Card><Link href="/admin" className="text-sm font-semibold text-brand underline">Go to admin dashboard</Link></Card>
      )}

      <Card><h2 className="mb-3 text-lg font-semibold">Phone verification</h2><PhoneVerifyCard phone={full.phoneE164} verified={!!full.phoneVerifiedAt} available={smsConfigured()} /></Card>
      <Card><h2 className="mb-3 text-lg font-semibold">Account details</h2><AccountForm name={full.name} email={full.email} phone={full.phoneE164} /></Card>
      <Card><h2 className="mb-3 text-lg font-semibold">Password</h2><PasswordForm /></Card>
    </main>
  );
}
