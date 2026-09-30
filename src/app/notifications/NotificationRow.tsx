"use client";
import Link from "next/link";
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export function NotificationRow({ id, label, href, createdAt, read }: { id: string; label: string; href: string; createdAt: string; read: boolean }) {
  const [isRead, setIsRead] = useState(read);
  async function markRead() {
    if (isRead) return;
    setIsRead(true);
    try { await fetch(`/api/notifications/${id}`, { method: "POST" }); } catch { setIsRead(false); }
  }
  return (
    <Link href={href} onClick={markRead}>
      <Card className={`flex items-center justify-between gap-2 ${!isRead ? "border-indigo" : ""}`}>
        <div><p className={!isRead ? "font-semibold" : ""}>{label}</p>
          <p className="text-xs text-muted">{new Date(createdAt).toLocaleString("en-NG")}</p></div>
        {!isRead && <Badge tone="brand">New</Badge>}
      </Card>
    </Link>
  );
}
