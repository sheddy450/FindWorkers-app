"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import type { AccountStatus } from "@prisma/client";

export function StatusControls({ userId, status }: { userId: string; status: AccountStatus }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState<AccountStatus | null>(null);
  const [reason, setReason] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  async function apply(next: AccountStatus) {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/users/${userId}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next, reason: reason || undefined }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't update this account.");
      setConfirming(null); setReason(""); router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }

  if (confirming) {
    return (
      <div className="space-y-3 rounded-card border border-danger bg-danger-soft p-4">
        <p className="font-semibold text-danger">{confirming === "ACTIVE" ? "Reactivate this account?" : `${confirming === "SUSPENDED" ? "Suspend" : "Deactivate"} this account?`}</p>
        {confirming !== "ACTIVE" && <Textarea label="Reason (kept in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} />}
        {error && <Alert variant="error" title={error} />}
        <div className="flex gap-2">
          <Button variant="danger" loading={busy} onClick={() => apply(confirming)}>Confirm</Button>
          <Button variant="outline" onClick={() => setConfirming(null)}>Cancel</Button>
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-2">
      {status !== "SUSPENDED" && <Button variant="outline" onClick={() => setConfirming("SUSPENDED")}>Suspend</Button>}
      {status !== "DEACTIVATED" && <Button variant="danger" onClick={() => setConfirming("DEACTIVATED")}>Deactivate</Button>}
      {status !== "ACTIVE" && <Button onClick={() => setConfirming("ACTIVE")}>Reactivate</Button>}
    </div>
  );
}
