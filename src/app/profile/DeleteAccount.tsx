"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";

/** "Delete my account": closed by default; explains exactly what happens, then needs password + tick. */
export function DeleteAccount({ role }: { role: "CUSTOMER" | "ARTISAN" }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError(""); setBusy(true);
    try {
      const res = await fetch("/api/account/delete", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: String(f.get("password") ?? ""), confirm: f.get("confirm") === "on" }),
      });
      if (!res.ok) { setError((await res.json().catch(() => ({}))).error ?? "We couldn't delete your account. Try again."); setBusy(false); return; }
      await signOut({ redirect: false }).catch(() => {});
      window.location.assign("/account-deleted");
    } catch { setError("We couldn't reach the server. Check your connection and try again."); setBusy(false); }
  }

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="font-semibold">Delete my account</p><p className="text-sm text-muted">Permanently remove your account and personal details.</p></div>
        <Button variant="outline" onClick={() => setOpen(true)} className="text-danger">Delete account</Button>
      </div>
    );
  }
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <h2 className="text-lg font-semibold text-danger">Delete my account</h2>
      <div className="space-y-2 text-sm leading-relaxed">
        <p className="font-semibold">This can&apos;t be undone. When you delete your account:</p>
        <ul className="list-disc space-y-1 pl-5 text-muted">
          <li>Your name, phone number, email and password are removed, and you&apos;re logged out everywhere.</li>
          {role === "ARTISAN" ? <>
            <li>Your public profile, services, work photos and ID documents are deleted. You disappear from search.</li>
            <li>Requests in progress are cancelled and your unanswered quotes are withdrawn. Customers are told.</li>
            <li>Reviews customers left you stay, but your profile no longer shows them.</li>
          </> : <>
            <li>Requests in progress are cancelled and your open jobs are closed. The artisans are told.</li>
            <li>Reviews you wrote stay, shown as &ldquo;Former customer&rdquo;, so artisans keep their ratings.</li>
          </>}
          <li>Messages and payment records are kept without your details, in case of a dispute or a legal need.</li>
          <li>You can sign up again later with the same phone number, as a new account.</li>
        </ul>
      </div>
      <PasswordInput label="Your password" name="password" required autoComplete="current-password" />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="confirm" required className="mt-0.5 h-5 w-5 accent-danger" />
        <span>I understand my account will be deleted and this can&apos;t be undone.</span>
      </label>
      {error && <Alert variant="error" title={error} />}
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={() => { setOpen(false); setError(""); }} disabled={busy}>Keep my account</Button>
        <Button type="submit" variant="danger" loading={busy}>Delete my account</Button>
      </div>
    </form>
  );
}
