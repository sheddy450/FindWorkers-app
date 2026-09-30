"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { reviewSchema } from "@/lib/validation/review";

export function ReviewForm({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0); const [hover, setHover] = useState(0);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = String(new FormData(e.currentTarget).get("body") ?? "").trim() || undefined;
    const p = reviewSchema.safeParse({ rating, body });
    if (!p.success) return setError(p.error.flatten().fieldErrors.rating?.[0] ?? "Choose a rating.");
    setError(""); setBusy(true);
    try {
      const res = await fetch(`/api/requests/${requestId}/review`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(p.data) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't submit your review.");
      router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-card border border-line bg-white p-4">
      <p className="font-semibold">How did it go?</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            className={`grid h-10 w-10 place-items-center rounded-ctl ${(hover || rating) >= n ? "text-marigold" : "text-line"}`}>
            <Icon name="star" size={26} filled /></button>
        ))}
      </div>
      <Textarea label="Add a comment (optional)" name="body" hint="Verified-service reviews are marked so other customers know it's a real job." />
      {error && <Alert variant="error" title={error} />}
      <Button loading={busy} className="w-full">Submit review</Button>
    </form>
  );
}
