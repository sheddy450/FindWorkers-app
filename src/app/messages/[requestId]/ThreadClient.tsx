"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { ErrorState } from "@/components/ui/States";

type Msg = { id: string; body: string; createdAt: string; senderId: string; sender: { name: string } };

export function ThreadClient({ requestId, kind = "request", selfId, otherId, otherName, initiallyBlocked }: {
  requestId: string; kind?: "request" | "conversation"; selfId: string; otherId: string; otherName: string; initiallyBlocked: boolean;
}) {
  const base = kind === "conversation" ? `/api/conversations/${requestId}/messages` : `/api/requests/${requestId}/messages`;
  const [messages, setMessages] = useState<Msg[] | null>(null);
  const [error, setError] = useState(""); const [sendError, setSendError] = useState(""); const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(initiallyBlocked); const [blockBusy, setBlockBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch(base);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages(data.messages);
    } catch { setError("Couldn't load this conversation."); }
  }
  useEffect(() => { load(); const t = setInterval(load, 8000); return () => clearInterval(t); }, [base]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { bottomRef.current?.scrollIntoView({ block: "end" }); }, [messages]);

  async function send(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget; const body = String(new FormData(form).get("body") ?? "").trim();
    if (!body) return;
    setBusy(true); setSendError("");
    try {
      const res = await fetch(base, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ body }) });
      if (!res.ok) return setSendError((await res.json().catch(() => ({}))).error ?? "Couldn't send. Try again.");
      form.reset(); await load();
    } catch { setSendError("Couldn't reach the server."); } finally { setBusy(false); }
  }

  async function toggleBlock() {
    setBlockBusy(true); setSendError("");
    try {
      const res = await fetch(`/api/users/${otherId}/block`, { method: blocked ? "DELETE" : "POST" });
      if (!res.ok) return setSendError((await res.json().catch(() => ({}))).error ?? "Couldn't update block status.");
      setBlocked(!blocked);
    } catch { setSendError("Couldn't reach the server."); } finally { setBlockBusy(false); }
  }

  if (error) return <ErrorState title="Couldn't load this conversation" body="Check your connection and try again." action={{ label: "Try again", onClick: load }} />;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto py-4">
        {messages === null && <p className="text-center text-sm text-muted">Loading…</p>}
        {messages?.length === 0 && !blocked && (
          <p className="text-center text-sm text-muted">{kind === "conversation" ? `Say hello to ${otherName}.` : `Say hello to ${otherName} about this job.`}</p>
        )}
        {messages?.map((m) => {
          const mine = m.senderId === selfId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] rounded-card px-3 py-2 text-sm ${mine ? "bg-brand text-white" : "bg-white border border-line"}`}>
                <p>{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? "text-white/70" : "text-muted"}`}>{new Date(m.createdAt).toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit" })}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {blocked ? (
        <div className="space-y-2 border-t border-line pt-3">
          <p className="text-center text-sm text-muted">You've blocked {otherName}. They can't message you about this or any other job.</p>
          <Button variant="outline" loading={blockBusy} onClick={toggleBlock} className="w-full">Unblock</Button>
        </div>
      ) : (
        <>
          <form onSubmit={send} className="flex gap-2 border-t border-line bg-paper pt-3">
            <input name="body" placeholder="Type a message" autoComplete="off" className="min-h-11 flex-1 rounded-ctl border border-line bg-white px-3" />
            <Button loading={busy}>Send</Button>
          </form>
          <button type="button" onClick={toggleBlock} disabled={blockBusy} className="mt-2 text-center text-xs text-muted underline">Block {otherName}</button>
        </>
      )}
      {sendError && <div className="mt-2"><Alert variant="error" title={sendError} /></div>}
    </div>
  );
}
