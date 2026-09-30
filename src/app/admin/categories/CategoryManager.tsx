"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Card } from "@/components/ui/Card";

type Cat = { id: string; name: string; slug: string; isActive: boolean };

export function CategoryManager({ initial }: { initial: Cat[] }) {
  const router = useRouter();
  const [error, setError] = useState(""); const [busyId, setBusyId] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);

  async function create(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const form = e.currentTarget; const name = String(new FormData(form).get("name") ?? "").trim();
    if (name.length < 2) return setError("Enter a name with at least 2 characters.");
    setBusyId("new");
    try {
      const res = await fetch("/api/admin/categories", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't create category.");
      form.reset(); router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusyId(null); }
  }

  async function toggle(id: string, isActive: boolean) {
    setBusyId(id); setError("");
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !isActive }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't update.");
      router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusyId(null); }
  }

  async function rename(id: string, name: string) {
    if (name.trim().length < 2) return setError("Name must be at least 2 characters.");
    setBusyId(id); setError("");
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: name.trim() }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't rename.");
      setEditing(null); router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusyId(null); }
  }

  return (
    <div className="space-y-4">
      <form onSubmit={create} className="flex gap-2">
        <div className="flex-1"><Input label="New category" name="name" placeholder="e.g. Solar installer" /></div>
        <Button loading={busyId === "new"} className="mt-6">Add</Button>
      </form>
      {error && <Alert variant="error" title={error} />}
      <div className="space-y-2">
        {initial.map((c) => (
          <Card key={c.id} className="flex items-center justify-between gap-2">
            {editing === c.id ? (
              <form onSubmit={(e) => { e.preventDefault(); rename(c.id, new FormData(e.currentTarget).get("name") as string); }} className="flex flex-1 gap-2">
                <input name="name" defaultValue={c.name} className="min-h-9 flex-1 rounded-ctl border border-line px-2" />
                <Button loading={busyId === c.id}>Save</Button>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>Cancel</Button>
              </form>
            ) : (
              <>
                <div><p className="font-medium">{c.name}</p><p className="text-xs text-muted">/{c.slug}</p></div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.isActive ? "verified" : "neutral"}>{c.isActive ? "Active" : "Hidden"}</Badge>
                  <Button variant="outline" onClick={() => setEditing(c.id)}>Rename</Button>
                  <Button variant={c.isActive ? "danger" : "primary"} loading={busyId === c.id} onClick={() => toggle(c.id, c.isActive)}>{c.isActive ? "Hide" : "Show"}</Button>
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
