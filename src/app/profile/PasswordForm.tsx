"use client";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { passwordChangeSchema } from "@/lib/validation/profile";

export function PasswordForm() {
  const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const f = new FormData(form);
    const input = { currentPassword: f.get("currentPassword"), newPassword: f.get("newPassword") };
    const p = passwordChangeSchema.safeParse(input);
    if (!p.success) {
      const fe = p.error.flatten().fieldErrors as Record<string, string[]>;
      return setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])));
    }
    setErrors({}); setBusy(true);
    try {
      const res = await fetch("/api/profile/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p.data) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])) : { form: data.error ?? "Couldn't change your password." });
      toast("success", "Password changed"); form.reset();
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <PasswordInput label="Current password" name="currentPassword" autoComplete="current-password" error={errors.currentPassword} />
      <PasswordInput label="New password" name="newPassword" autoComplete="new-password" hint="At least 10 characters." error={errors.newPassword} />
      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button loading={busy} variant="outline">Change password</Button>
    </form>
  );
}
