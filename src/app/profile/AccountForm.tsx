"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";
import { accountSchema } from "@/lib/validation/profile";

export function AccountForm({ name, email, phone }: { name: string; email: string | null; phone: string | null }) {
  const router = useRouter(); const toast = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input = { name: f.get("name"), email: String(f.get("email") ?? "").trim() };
    const p = accountSchema.safeParse(input);
    if (!p.success) {
      const fe = p.error.flatten().fieldErrors as Record<string, string[]>;
      return setErrors(Object.fromEntries(Object.entries(fe).map(([k, v]) => [k, v[0]])));
    }
    setErrors({}); setBusy(true);
    try {
      const res = await fetch("/api/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p.data) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setErrors(data.errors ? Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])) : { form: data.error ?? "Couldn't save changes." });
      toast("success", "Profile updated"); router.refresh();
    } catch { setErrors({ form: "We couldn't reach the server. Check your connection and try again." }); }
    finally { setBusy(false); }
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-4">
      <Input label="Full name" name="name" defaultValue={name} error={errors.name} />
      <Input label="Email" name="email" type="email" defaultValue={email ?? ""} hint="Used for sign-in and account notices." error={errors.email} />
      <Input label="Phone number" defaultValue={phone ?? "Not set"} readOnly disabled hint="Contact support to change your phone number." />
      {errors.form && <Alert variant="error" title={errors.form} />}
      <Button loading={busy}>Save changes</Button>
    </form>
  );
}
