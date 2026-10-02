"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";

export function PriceForm({ priceNaira }: { priceNaira: number }) {
  const router = useRouter(); const toast = useToast();
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError(""); setBusy(true);
    const price = String(new FormData(e.currentTarget).get("price") ?? "");
    try {
      const res = await fetch("/api/admin/pro", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ price }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't save the price.");
      toast("success", "Pro price updated"); router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={save} className="flex items-end gap-2">
      <div className="flex-1"><Input label="Price for 30 days (₦)" name="price" inputMode="decimal" defaultValue={String(priceNaira)} error={error}
        hint="Applies to new payments only." /></div>
      <Button loading={busy} className="mb-6">Save</Button>
    </form>
  );
}
