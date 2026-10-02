"use client";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export function UpgradeButton({ label, needsEmail }: { label: string; needsEmail: boolean }) {
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");

  async function pay() {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/pro/checkout", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) { setBusy(false); return setError(data.error ?? "Couldn't start the payment. Please try again."); }
      window.location.assign(data.url); // Paystack's secure checkout page
    } catch {
      setBusy(false); setError("We couldn't reach the server. Check your connection and try again.");
    }
  }

  if (needsEmail) return (
    <Alert variant="info" title="Add your email to upgrade">
      Paystack sends your receipt by email. <Link href="/profile" className="font-semibold underline">Add it in your Profile</Link>, then come back here.
    </Alert>
  );
  return (
    <div className="space-y-3">
      <Button variant="accent" loading={busy} onClick={pay} className="w-full">{label}</Button>
      {error && <Alert variant="error" title={error} />}
      <p className="text-center text-sm text-muted">Secure payment by Paystack · card, bank transfer or USSD</p>
    </div>
  );
}
