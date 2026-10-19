"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { parseQuote } from "@/lib/jobs/rules";

async function post(url: string, method: "POST" | "DELETE" = "POST", body?: unknown) {
  const res = await fetch(url, { method, headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data: data as { error?: string; errors?: Record<string, string>; requestId?: string } };
}

export function HireButton({ jobId, quoteId, name, price }: { jobId: string; quoteId: string; name: string; price: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false), [err, setErr] = useState("");
  async function hire() {
    setBusy(true); setErr("");
    try {
      const r = await post(`/api/jobs/${jobId}/quotes/${quoteId}/accept`);
      if (!r.ok || !r.data.requestId) return setErr(r.data.error ?? "Couldn't hire. Try again.");
      router.push(`/requests/${r.data.requestId}?hired=1`);
    } catch { setErr("We couldn't reach the server. Check your connection."); } finally { setBusy(false); }
  }
  if (!confirm) return <Button className="flex-1" onClick={() => setConfirm(true)}>Hire</Button>;
  return (
    <div className="flex-1 space-y-2">
      <p className="text-sm">Hire <strong>{name}</strong> for <strong>{price}</strong>? The other artisans will be told you chose someone else.</p>
      {err && <Alert variant="error" title={err} />}
      <div className="flex gap-2">
        <Button loading={busy} onClick={hire}>Yes, hire</Button>
        <Button variant="outline" onClick={() => setConfirm(false)} disabled={busy}>Cancel</Button>
      </div>
    </div>
  );
}

export function CloseJobButton({ jobId, hasQuotes }: { jobId: string; hasQuotes: boolean }) {
  const router = useRouter(); const toast = useToast();
  const [confirm, setConfirm] = useState(false), [busy, setBusy] = useState(false);
  async function close() {
    setBusy(true);
    const r = await post(`/api/jobs/${jobId}/close`).catch(() => ({ ok: false, data: { error: "Couldn't reach the server." } }));
    setBusy(false);
    if (!r.ok) return toast("error", r.data.error ?? "Couldn't close the job.");
    toast("success", "Job closed."); router.refresh();
  }
  if (!confirm) return <button type="button" onClick={() => setConfirm(true)} className="text-sm font-medium text-muted underline">I don&apos;t need this any more</button>;
  return (
    <div className="space-y-2 text-sm">
      <p>Close this job?{hasQuotes ? " Artisans who quoted will be told." : ""}</p>
      <div className="flex justify-center gap-2">
        <Button variant="danger" loading={busy} onClick={close}>Close job</Button>
        <Button variant="outline" onClick={() => setConfirm(false)}>Keep it open</Button>
      </div>
    </div>
  );
}

export function QuoteForm({ jobId, initial }: { jobId: string; initial: { priceNaira: string; message: string; canStart: string } | null }) {
  const router = useRouter(); const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string | undefined>>({}); const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const raw: Record<string, string> = {};
    new FormData(e.currentTarget).forEach((v, k) => { raw[k] = String(v); });
    const check = parseQuote(raw);
    if (!check.ok) return setErrors(check.errors);
    setErrors({}); setBusy(true);
    try {
      const r = await post(`/api/jobs/${jobId}/quotes`, "POST", raw);
      if (!r.ok) return setErrors(r.data.errors ?? { form: r.data.error ?? "Couldn't send your quote." });
      toast("success", initial ? "Quote updated." : "Quote sent. We'll tell you if the customer hires you.");
      router.refresh();
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection." }); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input label="Your price (₦)" name="priceNaira" inputMode="numeric" placeholder="e.g. 15,000" defaultValue={initial?.priceNaira} error={errors.priceNaira}
        hint="The full price for the job, including labour. Say in the message if materials are extra." />
      <Textarea label="Message to the customer" name="message" rows={4} maxLength={600} defaultValue={initial?.message} error={errors.message}
        placeholder="What your price covers, how long it takes, and why you're a good fit." />
      <Input label="When can you start? (optional)" name="canStart" maxLength={60} placeholder="e.g. Tomorrow morning" defaultValue={initial?.canStart} error={errors.canStart} />
      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button type="submit" loading={busy} className="w-full">{initial ? "Update quote" : "Send quote"}</Button>
      <p className="text-xs text-muted">Don&apos;t include phone numbers. If you&apos;re hired, the customer gets your contact and you can chat in the app.</p>
    </form>
  );
}

export function WithdrawQuoteButton({ jobId }: { jobId: string }) {
  const router = useRouter(); const toast = useToast();
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} className="text-sm font-medium text-muted underline"
      onClick={async () => {
        setBusy(true);
        const r = await post(`/api/jobs/${jobId}/quotes`, "DELETE").catch(() => ({ ok: false, data: { error: "Couldn't reach the server." } }));
        setBusy(false);
        if (!r.ok) return toast("error", r.data.error ?? "Couldn't withdraw.");
        toast("success", "Quote withdrawn."); router.refresh();
      }}>Withdraw my quote</button>
  );
}
