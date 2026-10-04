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
    // Everything below is in try/catch: if the auth request fails (server error, timeout, network),
    // signIn/getSession throw instead of returning, which used to leave the button stuck on
    // "Please wait…" with no message.
    try {
      const res = await signIn("credentials", { identifier: f.get("identifier"), password: f.get("password"), redirect: false });
      if (!res || res.error) {
        setBusy(false);
        return setError(
          res?.error === "CredentialsSignin" ? "Phone/email or password is incorrect."
          : res?.error === "RateLimited" ? "Too many login attempts. For your security, wait 15 minutes and try again."
          : "We couldn't sign you in right now. Please try again in a moment.");
      }
      // Route by role rather than always to "/" — that page is the customer search homepage and
      // has nothing useful for an artisan or admin account to land on. Read `next` from the URL
      // directly (not useSearchParams) so this page doesn't need a Suspense boundary.
      const next = new URLSearchParams(window.location.search).get("next");
      const session = await getSession();
      const role = (session?.user as { role?: string } | undefined)?.role;
      if (!role) {
        // Signed in, but the browser didn't keep the session cookie: redirecting now would just
        // bounce back to this page.
        setBusy(false);
        return setError("You were signed in, but your browser didn't keep the session. Check that cookies are allowed for this site and try again.");
      }
      const home = role === "ADMIN" ? "/admin" : role === "ARTISAN" ? "/artisan/dashboard" : "/";
      // Only same-site paths: "//evil.com" also starts with "/" but leaves the site.
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/login") ? next : null;
      window.location.assign(safeNext ?? home);
    } catch (err) {
      console.error("Login failed", err);
      setBusy(false);
      setError("We couldn't reach the server. Check your connection and try again.");
    }
  }
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-3xl font-bold text-brand">Welcome back</h1>
      <p className="mt-1 text-muted">Log in to book artisans and follow your requests.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4 rounded-card border border-line bg-white p-5 shadow-[0_1px_2px_rgba(23,26,33,0.05)]">
        <Input label="Phone or email" name="identifier" required autoComplete="username" placeholder="0803 123 4567 or you@example.com" />
        <PasswordInput label="Password" name="password" required autoComplete="current-password" />
        {error && <Alert variant="error" title={error} />}
        <Button loading={busy} className="w-full">Log in</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">New here? <Link href="/register" className="inline-flex min-h-11 items-center font-semibold text-brand underline">Create an account</Link></p>
    </main>
  );
}
