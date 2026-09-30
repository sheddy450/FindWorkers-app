"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { RequestStatus } from "@prisma/client";

export function Actions({ id, options }: { id: string; options: { to: RequestStatus; label: string; variant?: "primary" | "danger" | "outline" }[] }) {
  const router = useRouter();
  const [error, setError] = useState(""); const [busy, setBusy] = useState<string | null>(null);
  async function act(to: RequestStatus) {
    setBusy(to); setError("");
    try {
      const res = await fetch(`/api/requests/${id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't update the request.");
      router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(null); }
  }
  if (!options.length) return null;
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">{options.map((o) => (
        <Button key={o.to} variant={o.variant ?? "primary"} loading={busy === o.to} onClick={() => act(o.to)}>{o.label}</Button>))}</div>
      {error && <Alert variant="error" title={error} />}
    </div>
  );
}
