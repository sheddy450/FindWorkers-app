"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";

export default function ForgotPassword() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const email = String(new FormData(e.currentTarget).get("email") ?? "").trim();
    try {
      const res = await fetch("/api/auth/forgot-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Something went wrong. Please try again.");
      setSentTo(email);
    } catch { setError("We couldn't reach the server. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-3xl font-bold text-brand">Forgot your password?</h1>
      {sentTo ? (
        <div className="mt-6 space-y-4 rounded-card border border-line bg-white p-5 shadow-soft">
          <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="check" size={24} /></span>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-muted">If <span className="font-semibold text-ink">{sentTo}</span> belongs to a FindWorkers account, we&apos;ve sent it a link to reset your password. The link expires in 30 minutes.</p>
          <p className="text-sm text-muted">Nothing arrived after a few minutes? Check your spam folder, or make sure it&apos;s the email you registered with.</p>
          <Button variant="outline" className="w-full" onClick={() => setSentTo(null)}>Try a different email</Button>
        </div>
      ) : (
        <>
          <p className="mt-1 text-muted">Enter the email you registered with and we&apos;ll send you a link to choose a new password.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-card border border-line bg-white p-5 shadow-soft">
            <Input label="Email address" name="email" type="email" required autoComplete="email" inputMode="email" placeholder="you@example.com" />
            {error && <Alert variant="error" title={error} />}
            <Button loading={busy} className="w-full">Send reset link</Button>
          </form>
          <p className="mt-4 text-sm text-muted">Signed up with only a phone number? Email reset isn&apos;t available for your account yet. Contact us and we&apos;ll help you get back in.</p>
        </>
      )}
      <p className="mt-6 text-center text-sm text-muted">Remembered it? <Link href="/login" className="inline-flex min-h-11 items-center font-semibold text-brand underline">Back to log in</Link></p>
    </main>
  );
}
