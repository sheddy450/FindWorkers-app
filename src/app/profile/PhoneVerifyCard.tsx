"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";

type Props = { phone: string | null; verified: boolean; available: boolean };

export function PhoneVerifyCard({ phone, verified, available }: Props) {
  const router = useRouter(); const toast = useToast();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [wait, setWait] = useState(0);
  const [busy, setBusy] = useState<"send" | "check" | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  async function post(url: string, body?: object) {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong. Try again.");
    return data;
  }

  async function send() {
    setBusy("send"); setError("");
    try { const d = await post("/api/phone/send"); setSentTo(d.sentTo); setWait(d.resendAfterSec ?? 60); }
    catch (e) { setError((e as Error).message); } finally { setBusy(null); }
  }

  async function check(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy("check"); setError("");
    const code = String(new FormData(e.currentTarget).get("code") ?? "");
    try { await post("/api/phone/verify", { code }); toast("success", "Phone number verified"); router.refresh(); }
    catch (err) { setError((err as Error).message); } finally { setBusy(null); }
  }

  if (verified) return (
    <div className="flex items-center gap-3">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-verified-soft text-verified"><Icon name="check" size={18} /></span>
      <div><p className="font-semibold">Phone verified</p><p className="text-sm text-muted">{phone}</p></div>
    </div>
  );
  if (!phone) return <p className="text-sm text-muted">Add a phone number to your account to verify it.</p>;
  if (!available) return <p className="text-sm text-muted">Phone verification by SMS is coming soon.</p>;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Verify <span className="font-semibold text-ink">{phone}</span> so customers and artisans know it&apos;s really you. We&apos;ll text you a 6-digit code.</p>
      {sentTo && (
        <form onSubmit={check} className="space-y-3">
          <Input label={`Code sent to ${sentTo}`} name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]*" maxLength={7}
            placeholder="123456" required hint="It can take up to a minute to arrive. The code expires in 10 minutes." />
          <Button loading={busy === "check"} className="w-full">Verify</Button>
        </form>
      )}
      {error && <Alert variant="error" title={error} />}
      <Button type="button" variant={sentTo ? "outline" : "primary"} loading={busy === "send"} disabled={wait > 0} onClick={send} className="w-full">
        {sentTo ? (wait > 0 ? `Send a new code in ${wait}s` : "Send a new code") : "Text me a code"}
      </Button>
    </div>
  );
}
