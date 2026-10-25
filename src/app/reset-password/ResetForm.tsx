"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { PASSWORD_HINT, passwordProblem } from "@/lib/validation/password";

export function ResetForm({ token }: { token: string }) {
  const [errors, setErrors] = useState<{ password?: string; confirm?: string; form?: string }>({});
  const [busy, setBusy] = useState(false); const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const password = String(f.get("password") ?? ""), confirm = String(f.get("confirm") ?? "");
    const next: typeof errors = {};
    const problem = passwordProblem(password);
    if (problem) next.password = problem;
    if (confirm !== password) next.confirm = "The passwords don't match.";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/reset-password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password }) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors?.password) return setErrors({ password: data.errors.password[0] });
      if (!res.ok) return setErrors({ form: data.error ?? "We couldn't reset your password. Please try again." });
      setDone(true);
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  if (done) return (
    <div className="mt-6 space-y-4 rounded-card border border-line bg-white p-5 shadow-soft">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-brand-soft text-brand"><Icon name="check" size={24} /></span>
      <h2 className="text-xl font-semibold">Password changed</h2>
      <p className="text-muted">You can now log in with your new password. For your security, you&apos;ve been signed out on your other devices.</p>
      <Link href="/login" className="inline-flex min-h-11 w-full items-center justify-center rounded-ctl bg-brand px-4 font-semibold text-white">Log in</Link>
    </div>
  );
  return (
    <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4 rounded-card border border-line bg-white p-5 shadow-soft">
      <PasswordInput label="New password" name="password" autoComplete="new-password" hint={PASSWORD_HINT} error={errors.password} />
      <PasswordInput label="Confirm new password" name="confirm" autoComplete="new-password" error={errors.confirm} />
      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button loading={busy} className="w-full">Change password</Button>
    </form>
  );
}
