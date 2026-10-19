"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { REJECT_REASONS } from "@/lib/photos/rules";

export function PhotoDecision({ id, suggestStolen }: { id: string; suggestStolen?: boolean }) {
  const router = useRouter(); const toast = useToast();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState(suggestStolen ? REJECT_REASONS[0] : "");
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function send(decision: "APPROVED" | "REJECTED") {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/photos/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reason }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't save the decision.");
      toast("success", decision === "APPROVED" ? "Approved: it's live" : "Rejected: the artisan has been told why"); router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }
  return (
    <div className="space-y-3 border-t border-line pt-3">
      {rejecting && (
        <>
          <fieldset>
            <legend className="text-sm font-medium">Common reasons</legend>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {REJECT_REASONS.map((r) => (
                <button key={r} type="button" onClick={() => setReason(r)} aria-pressed={reason === r}
                  className={`rounded-full border px-3 py-1.5 text-left text-xs ${reason === r ? "border-brand bg-brand-soft text-brand" : "border-line bg-white hover:bg-paper"}`}>
                  {r.split(".")[0]}
                </button>
              ))}
            </div>
          </fieldset>
          <Textarea label="Reason (shown to the artisan)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} rows={3} />
        </>
      )}
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
