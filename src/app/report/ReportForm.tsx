"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { reportSchema } from "@/lib/validation/report";

export function ReportForm({ targetType, targetId, subjectLabel }: { targetType: "USER" | "REVIEW" | "ARTISAN"; targetId: string; subjectLabel: string }) {
  const router = useRouter();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const reason = String(new FormData(e.currentTarget).get("reason") ?? "").trim();
    const p = reportSchema.safeParse({ targetType, targetId, reason });
    if (!p.success) return setError(p.error.flatten().fieldErrors.reason?.[0] ?? "Enter a reason.");
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p.data) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't submit your report.");
      setDone(true);
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }

  if (done) return (
    <div className="space-y-3">
      <Alert variant="success" title="Report received">A member of our team will review it. This does not notify {subjectLabel} that you reported them.</Alert>
      <Button variant="outline" onClick={() => router.back()}>Go back</Button>
    </div>
  );
  return (
    <form onSubmit={submit} className="space-y-4">
      <Textarea label="What happened?" name="reason" hint="Be specific — this helps our team act on it quickly." />
      {error && <Alert variant="error" title={error} />}
      <Button loading={busy} className="w-full">Submit report</Button>
    </form>
  );
}
