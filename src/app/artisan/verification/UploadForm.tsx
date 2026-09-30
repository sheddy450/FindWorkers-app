"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { useToast } from "@/components/ui/Toast";

export function UploadForm({ type, label }: { type: string; label: string }) {
  const router = useRouter(); const toast = useToast();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    const form = e.currentTarget; const file = new FormData(form).get("file");
    if (!(file instanceof File) || !file.size) return setError("Choose a file first.");
    if (file.size > 5 * 1024 * 1024) return setError("File must be under 5 MB.");
    setBusy(true);
    const body = new FormData(); body.set("type", type); body.set("file", file);
    try {
      const res = await fetch("/api/artisan/verification", { method: "POST", body });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Upload failed. Try again.");
      toast("success", `${label} document submitted`); form.reset(); router.refresh();
    } catch { setError("We couldn't reach the server. Check your connection and try again."); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={onSubmit} className="mt-3 space-y-3">
      <label className="block text-sm font-medium">Choose a JPG, PNG or PDF (up to 5 MB)
        <input name="file" type="file" accept="image/jpeg,image/png,application/pdf" className="mt-1 block w-full text-sm" /></label>
      {error && <Alert variant="error" title={error} />}
      <Button loading={busy} variant="outline">Submit for review</Button>
    </form>
  );
}
