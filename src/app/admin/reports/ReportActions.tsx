"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export function ReportActions({ id }: { id: string }) {
  const router = useRouter();
  const [note, setNote] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState<string | null>(null);

  async function decide(status: "RESOLVED" | "DISMISSED") {
    setBusy(status); setError("");
    try {
      const res = await fetch(`/api/admin/reports/${id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status, note: note || undefined }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't save this decision.");
      router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(null); }
  }

  return (
    <div className="mt-3 space-y-2">
      <Textarea label="Note (optional, kept for the record)" value={note} onChange={(e) => setNote(e.target.value)} />
      {error && <Alert variant="error" title={error} />}
      <div className="flex gap-2">
        <Button loading={busy === "RESOLVED"} onClick={() => decide("RESOLVED")}>Mark resolved</Button>
        <Button variant="outline" loading={busy === "DISMISSED"} onClick={() => decide("DISMISSED")}>Dismiss</Button>
      </div>
    </div>
  );
}
