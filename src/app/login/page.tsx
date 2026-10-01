"use client";
import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input, PasswordInput } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

export default function Login() {
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setBusy(true); setError("");
    const f = new FormData(e.currentTarget);
    const res = await signIn("credentials", { identifier: f.get("identifier"), password: f.get("password"), redirect: false });
    if (res?.error) { setBusy(false); return setError("Phone/email or password is incorrect."); }
    // Route by role rather than always to "/" — that page is the customer search homepage and
    // has nothing useful for an artisan or admin account to land on. Read `next` from the URL
    // directly (not useSearchParams) so this page doesn't need a Suspense boundary.
    const next = new URLSearchParams(window.location.search).get("next");
    const session = await getSession();
    const role = (session?.user as { role?: string } | undefined)?.role;
    const home = role === "ADMIN" ? "/admin" : role === "ARTISAN" ? "/artisan/dashboard" : "/";
    window.location.href = next && next.startsWith("/") ? next : home;
  }
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-3xl font-bold text-indigo">Welcome back</h1>
      <p className="mt-1 text-muted">Log in to book artisans and follow your requests.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-card border border-line bg-white p-5 shadow-[0_1px_2px_rgba(23,26,33,0.05)]">
        <Input label="Phone or email" name="identifier" required autoComplete="username" placeholder="0803 123 4567 or you@example.com" />
        <PasswordInput label="Password" name="password" required autoComplete="current-password" />
        {error && <Alert variant="error" title={error} />}
        <Button loading={busy} className="w-full">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-indigo underline">Create an account</Link></p>
    </main>
  );
}
