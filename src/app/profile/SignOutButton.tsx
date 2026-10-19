"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

/**
 * Signs out, then goes to /login on the site the user is already on. We don't let NextAuth do the
 * redirect: it builds an absolute URL from NEXTAUTH_URL, and a stale value (e.g. an old *.vercel.app
 * address) sends people to a dead site. If the sign-out call itself fails, we still go to /login.
 */
export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  async function out() {
    setBusy(true);
    try { await signOut({ redirect: false }); }
    catch (e) { console.error("[auth] sign-out failed", e); }
    window.location.assign("/login");
  }
  return (
    <Button variant="outline" loading={busy} onClick={out}>
      Sign out
    </Button>
  );
}
