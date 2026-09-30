"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";

export function DecisionForm({ id }: { id: string }) {
  const router = useRouter(); const toast = useToast();
  const [rejecting, setRejecting] = useState(false); const [reason, setReason] = useState("");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function send(decision: "APPROVED" | "REJECTED") {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/verifications/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't save the decision.");
      toast("success", decision === "APPROVED" ? "Approved" : "Rejected"); router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }
  return (
    <div className="mt-3 space-y-3">
      {rejecting && <Textarea label="Reason (shown to the artisan)" value={reason} onChange={(e) => setReason(e.target.value)} hint="Say what to fix, e.g. “The ID photo is blurry. Upload a clearer photo.”" />}
      {error && <Alert variant="error" title={error} />}
      <div className="flex gap-2">
        {!rejecting ? <>
          <Button loading={busy} onClick={() => send("APPROVED")}>Approve</Button>
          <Button variant="outline" onClick={() => setRejecting(true)}>Reject…</Button></> : <>
          <Button variant="danger" loading={busy} onClick={() => send("REJECTED")}>Confirm rejection</Button>
          <Button variant="outline" onClick={() => setRejecting(false)}>Cancel</Button></>}
      </div>
    </div>
  );
}
