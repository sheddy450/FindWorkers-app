"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function MarkAllRead() {
  const router = useRouter(); const [busy, setBusy] = useState(false);
  async function run() {
    setBusy(true);
    try { await fetch("/api/notifications/read-all", { method: "POST" }); router.refresh(); } finally { setBusy(false); }
  }
  return <Button variant="outline" loading={busy} onClick={run}>Mark all as read</Button>;
}
