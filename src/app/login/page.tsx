"use client";
import { signIn, getSession } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

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
      <h1 className="text-2xl font-bold text-indigo">Log in</h1>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="block text-sm font-medium">Phone or email
          <input name="identifier" required autoComplete="username" className="mt-1 w-full rounded-ctl border border-line bg-white p-3" /></label>
        <label className="block text-sm font-medium">Password
          <input name="password" type="password" required autoComplete="current-password" className="mt-1 w-full rounded-ctl border border-line bg-white p-3" /></label>
        {error && <p role="alert" className="rounded-ctl bg-danger-soft p-3 text-sm text-danger">{error}</p>}
        <Button loading={busy} className="w-full">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href="/register" className="font-semibold text-indigo underline">Create an account</Link></p>
    </main>
  );
}
