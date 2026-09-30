"use client";
import { useState } from "react";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button variant="outline" loading={busy} onClick={() => { setBusy(true); signOut({ callbackUrl: "/login" }); }}>
      Sign out
    </Button>
  );
}
