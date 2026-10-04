"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";

/** Numbers are fetched on click, only for signed-in users, and never sit in the page's initial HTML. */
export function ContactButtons({ artisanId, businessName, loggedIn }: { artisanId: string; businessName: string; loggedIn: boolean }) {
  const router = useRouter();
  const [links, setLinks] = useState<{ tel: string; whatsapp: string } | null>(null);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false); const [msgBusy, setMsgBusy] = useState(false);

  async function reveal() {
    if (!loggedIn) return setError("Log in to contact this artisan.");
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/artisans/${artisanId}/contact`);
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't load contact details.");
      setLinks(await res.json());
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }

  async function message() {
    if (!loggedIn) return setError("Log in to message this artisan.");
    setMsgBusy(true); setError("");
    try {
      const res = await fetch(`/api/artisans/${artisanId}/conversation`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Couldn't start a conversation.");
      router.push(`/messages/inquiry/${data.id}`);
    } catch { setError("Couldn't reach the server."); } finally { setMsgBusy(false); }
  }

  return (
    <div className="space-y-2">
      <Button variant="primary" loading={msgBusy} onClick={message} className="flex w-full items-center justify-center gap-2">
        <Icon name="chat" size={16} />Message {businessName}
      </Button>
      <div className="grid grid-cols-3 gap-2">
        {!links ? <>
          <Button variant="outline" loading={busy} onClick={reveal} className="col-span-1"><Icon name="phone" size={16} /></Button>
          <Button variant="accent" loading={busy} onClick={reveal} className="col-span-1"><Icon name="chat" size={16} /></Button>
        </> : <>
          <a href={links.tel} className="col-span-1 flex min-h-11 items-center justify-center gap-1 rounded-ctl border border-line bg-white text-sm font-semibold"><Icon name="phone" size={16} />Call</a>
          <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="col-span-1 flex min-h-11 items-center justify-center gap-1 rounded-ctl bg-verified text-sm font-semibold text-white"><Icon name="chat" size={16} />WhatsApp</a>
        </>}
        <Link href={`/requests/new/${artisanId}`} className="col-span-1 flex min-h-11 items-center justify-center rounded-ctl bg-highlight text-sm font-semibold">Request</Link>
      </div>
      {error && <Alert variant={loggedIn ? "error" : "info"} title={error} />}
    </div>
  );
}
