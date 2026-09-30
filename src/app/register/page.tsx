"use client";
import Link from "next/link";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { registerSchema } from "@/lib/validation/auth";

type Errors = Partial<Record<"name" | "phone" | "email" | "password" | "terms" | "form", string>>;
const ROLES = [
  { value: "CUSTOMER", title: "I need a service", body: "Find and contact artisans near you", icon: "search" },
  { value: "ARTISAN", title: "I offer a service", body: "Get found by customers and manage requests", icon: "wrench" },
] as const;

export default function Register() {
  const toast = useToast();
  const [role, setRole] = useState<"CUSTOMER" | "ARTISAN">("CUSTOMER");
  const [errors, setErrors] = useState<Errors>({});
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email") ?? "").trim();
    const input = { name: f.get("name"), phone: f.get("phone"), email: email || undefined, password: f.get("password"), role };
    const next: Errors = {};
    const parsed = registerSchema.safeParse(input);
    if (!parsed.success) {
      const fe = parsed.error.flatten().fieldErrors;
      for (const k of ["name", "phone", "email", "password"] as const) if (fe[k]?.[0]) next[k] = fe[k]![0];
    }
    if (!f.get("terms")) next.terms = "Please accept the terms to continue.";
    setErrors(next);
    if (Object.keys(next).length || !parsed.success) return;

    setBusy(true);
    try {
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(input) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors) {
        setErrors(Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])));
      } else if (!res.ok) {
        setErrors({ form: data.error ?? "We couldn't create your account. Check your connection and try again." });
      } else {
        const login = await signIn("credentials", { identifier: String(f.get("phone")), password: String(f.get("password")), redirect: false });
        toast("success", "Account created");
        window.location.href = login?.error ? "/login" : role === "ARTISAN" ? "/artisan/profile" : "/location";
      }
    } catch {
      setErrors({ form: "We couldn't reach the server. Check your connection and try again." });
    } finally { setBusy(false); }
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-3xl font-bold text-indigo">Create your account</h1>
      <p className="mt-1 text-muted">Already registered? <Link href="/login" className="font-semibold text-indigo underline">Log in</Link></p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-5">
        <fieldset>
          <legend className="text-sm font-medium">What brings you here?</legend>
          <div className="mt-2 grid gap-3">
            {ROLES.map((r) => (
              <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-card border-2 bg-white p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-marigold ${role === r.value ? "border-indigo" : "border-line"}`}>
                <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${role === r.value ? "bg-indigo text-white" : "bg-indigo-soft text-indigo"}`}><Icon name={r.icon} /></span>
                <span><span className="block font-semibold">{r.title}</span><span className="text-sm text-muted">{r.body}</span></span>
              </label>
            ))}
          </div>
        </fieldset>

        <Input label="Full name" name="name" autoComplete="name" error={errors.name} />
        <Input label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567"
          hint="Nigerian mobile number. Used to log in." error={errors.phone} />
        <Input label="Email (optional)" name="email" type="email" autoComplete="email" error={errors.email} />
        <PasswordInput label="Password" name="password" autoComplete="new-password" hint="At least 10 characters." error={errors.password} />

        <div>
          <label className="flex items-start gap-3 text-sm">
            <input type="checkbox" name="terms" aria-invalid={!!errors.terms} className="mt-1 h-5 w-5 accent-indigo" />
            <span>I agree to the Terms of Use and Privacy Policy. My details are used only to run my account and connect me with artisans or customers.</span>
          </label>
          {errors.terms && <p role="alert" className="mt-1 text-sm text-danger">{errors.terms}</p>}
        </div>

        {errors.form && <Alert variant="error" title={errors.form} />}
        <Button loading={busy} className="w-full">Create account</Button>
        <p className="text-center text-sm text-muted">We won't ask for your location until you choose to share it.</p>
      </form>
    </main>
  );
}
