"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { useToast } from "@/components/ui/Toast";
import { registerSchema } from "@/lib/validation/auth";
import { eventIdHeader, flushPixel, newEventId, track } from "@/lib/meta/pixel";
import { JOB_RESUME_PATH, safeNext } from "@/lib/jobs/draft";
import { PASSWORD_HINT } from "@/lib/validation/password";
import { CITIES } from "@/lib/places/cities";

type Errors = Partial<Record<"name" | "phone" | "email" | "password" | "form", string>>;
type Role = "CUSTOMER" | "ARTISAN";
const ROLES = [
  { value: "CUSTOMER", title: "I need a service", body: "Find and contact artisans near you", icon: "search" },
  { value: "ARTISAN", title: "I offer a service", body: "Get found by customers and manage requests", icon: "wrench" },
] as const;

/**
 * What a visitor who arrived with ?role= (from an ad, or a "Join as an artisan" button) sees above the
 * form: one clear promise and three short reasons, instead of a role picker. Kept to claims the
 * product actually delivers.
 */
const PITCH: Record<Role, { title: (city: string) => string; sub: string; points: string[] }> = {
  ARTISAN: {
    // Same heading for every artisan ad, whatever city the link names.
    title: () => "Get jobs for free in Nigeria",
    sub: "Create your free FindWorkers account in about a minute.",
    points: ["Job requests from customers near you, and jobs you can quote for", "Free to join and free to quote: no hidden fees", "Show your work photos and build your name with reviews"],
  },
  CUSTOMER: {
    title: (city) => `Find trusted artisans${city ? ` in ${city}` : " near you"}`,
    sub: "Create your free account in about a minute.",
    points: ["Verified badges and reviews from real, booked jobs", "Compare prices in naira before anyone comes", "Post your job free and let artisans send their price"],
  },
};

export default function Register() {
  const toast = useToast();
  const [role, setRole] = useState<Role>("CUSTOMER");
  // ?role= comes from ads and "Join as an artisan" buttons: the role is already known, so skip the picker.
  // ?city= (e.g. "abuja") personalises the heading. ?next= brings a customer back where they were.
  const [focused, setFocused] = useState(false);
  const [city, setCity] = useState("");
  const [returnTo, setReturnTo] = useState<string | null>(null);
  const [showEmail, setShowEmail] = useState(false);
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const r = (q.get("role") ?? "").toUpperCase();
    if (r === "ARTISAN" || r === "CUSTOMER") { setRole(r); setFocused(true); }
    setCity(CITIES.find((c) => c.slug === (q.get("city") ?? "").toLowerCase())?.name ?? "");
    setReturnTo(safeNext(q.get("next")));
  }, []);
  const forJob = returnTo === JOB_RESUME_PATH;
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
      if (next.email) setShowEmail(true);
    }
    setErrors(next);
    if (Object.keys(next).length || !parsed.success) return;
    setBusy(true);
    try {
      const eventId = newEventId("reg");
      const res = await fetch("/api/auth/register", { method: "POST", headers: { "Content-Type": "application/json", ...eventIdHeader(eventId) }, body: JSON.stringify(input) });
      const data = await res.json().catch(() => ({}));
      if (res.status === 422 && data.errors) {
        setErrors(Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k, (v as string[])[0]])));
      } else if (!res.ok) {
        setErrors({ form: data.error ?? "We couldn't create your account. Check your connection and try again." });
      } else {
        track("CompleteRegistration", { content_name: role === "ARTISAN" ? "artisan" : "customer", status: true }, eventId);
        const login = await signIn("credentials", { identifier: String(f.get("phone")), password: String(f.get("password")), redirect: false });
        toast("success", "Account created");
        await flushPixel(); // full page load next: let the Pixel finish sending
        window.location.href = login?.error ? `/login${returnTo ? `?next=${encodeURIComponent(returnTo)}` : ""}`
          : role === "ARTISAN" ? "/artisan/profile" : returnTo ?? "/location";
      }
    } catch {
      setErrors({ form: "We couldn't reach the server. Check your connection and try again." });
    } finally { setBusy(false); }
  }

  const pitch = focused && !forJob ? PITCH[role] : null;
  const loginHref = returnTo ? `/login?next=${encodeURIComponent(returnTo)}` : "/login";
  return (
    <main className={`mx-auto max-w-md ${pitch ? "px-4 pb-6 pt-3" : "p-6"}`}>
      {pitch ? (
        <section aria-labelledby="reg-title" className="relative overflow-hidden rounded-[22px] bg-brand-700 px-5 py-5 text-white">
          <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_80%_at_100%_0%,rgba(52,199,89,0.35),transparent_55%)]" />
          <div className="relative">
            <h1 id="reg-title" className="text-[1.65rem] font-extrabold leading-tight tracking-tight">{pitch.title(city)}</h1>
            <p className="mt-1 text-sm text-white/85">{pitch.sub}</p>
            <ul className="mt-3 space-y-1.5 text-sm leading-snug">
              {pitch.points.map((p) => (
                <li key={p} className="flex gap-2"><span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-highlight text-ink"><Icon name="check" size={14} /></span>{p}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : (
        <>
          <h1 className="text-3xl font-bold text-brand">{forJob ? "One last step: your free account" : "Create your account"}</h1>
          {forJob && <p className="mt-1 text-muted">Your job is saved. Create an account so artisans can send you their prices, then you&apos;ll post it.</p>}
        </>
      )}

      <form onSubmit={onSubmit} noValidate className={`${pitch ? "mt-4" : "mt-6"} space-y-4`}>
        {!focused && !forJob && (
          <fieldset>
            <legend className="text-sm font-medium">What brings you here?</legend>
            <div className="mt-2 grid gap-3">
              {ROLES.map((r) => (
                <label key={r.value} className={`flex cursor-pointer items-start gap-3 rounded-card border-2 bg-white p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-[3px] has-[:focus-visible]:outline-brand-700 ${role === r.value ? "border-brand" : "border-line"}`}>
                  <input type="radio" name="role" value={r.value} checked={role === r.value} onChange={() => setRole(r.value)} className="sr-only" />
                  <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${role === r.value ? "bg-brand text-white" : "bg-brand-soft text-brand"}`}><Icon name={r.icon} /></span>
                  <span><span className="block font-semibold">{r.title}</span><span className="text-sm text-muted">{r.body}</span></span>
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Input label={role === "ARTISAN" ? "Your name or business name" : "Your name"} name="name" autoComplete="name" error={errors.name} />
        <Input label="Phone number" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0803 123 4567"
          hint="You'll use it to log in." error={errors.phone} />
        {role === "ARTISAN" ? (
          <Input label="Email" name="email" type="email" inputMode="email" autoComplete="email" required
            hint="To reset your password if you forget it, and for Pro plan receipts." error={errors.email} />
        ) : showEmail ? (
          <Input label="Email (optional)" name="email" type="email" autoComplete="email" hint="For receipts and resetting your password." error={errors.email} />
        ) : (
          <button type="button" onClick={() => setShowEmail(true)} className="inline-flex min-h-11 items-center text-sm font-semibold text-brand underline-offset-4 hover:underline">+ Add email (optional)</button>
        )}
        <PasswordInput label="Create a password" name="password" autoComplete="new-password" hint={PASSWORD_HINT} error={errors.password} />

        {errors.form && <Alert variant="error" title={errors.form} />}
        <Button loading={busy} className="w-full">{forJob ? "Create account and continue" : "Create free account"}</Button>
        <p className="text-center text-xs text-muted">
          By creating an account you agree to our Terms of Use and <Link href="/privacy" className="font-semibold text-brand underline">Privacy Policy</Link>.
        </p>
        <p className="text-center text-sm text-muted">Already registered? <Link href={loginHref} className="font-semibold text-brand underline">Log in</Link></p>
        {focused && !forJob && (
          <p className="text-center text-sm text-muted">
            {role === "ARTISAN" ? "Looking to hire someone instead?" : "Are you an artisan?"}{" "}
            <button type="button" onClick={() => setRole(role === "ARTISAN" ? "CUSTOMER" : "ARTISAN")} className="font-semibold text-brand underline">
              {role === "ARTISAN" ? "Sign up to hire" : "Join as an artisan"}
            </button>
          </p>
        )}
      </form>
    </main>
  );
}
