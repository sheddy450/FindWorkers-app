"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { StarRating } from "@/components/ui/StarRating";
import { Alert } from "@/components/ui/Alert";

type Row = { id: string; rating: number; body: string | null; hidden: boolean; isVerifiedService: boolean; createdAt: string;
  customer: { name: string }; artisan: { businessName: string } };

export function ReviewRow({ review }: { review: Row }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [error, setError] = useState("");
  async function toggle() {
    setBusy(true); setError("");
    try {
      const res = await fetch(`/api/admin/reviews/${review.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ hidden: !review.hidden }) });
      if (!res.ok) return setError((await res.json().catch(() => ({}))).error ?? "Couldn't update this review.");
      router.refresh();
    } catch { setError("Couldn't reach the server."); } finally { setBusy(false); }
  }
  return (
    <Card>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-semibold">{review.artisan.businessName}</p>
          <p className="text-sm text-muted">by {review.customer.name} · {new Date(review.createdAt).toLocaleDateString("en-NG")}</p>
        </div>
        <div className="flex items-center gap-2">
          {review.isVerifiedService ? <Badge tone="verified">Verified</Badge> : <Badge>Unverified</Badge>}
          {review.hidden && <Badge tone="danger">Hidden</Badge>}
        </div>
      </div>
      <div className="mt-2"><StarRating value={review.rating} count={1} /></div>
      {review.body && <p className="mt-1 text-sm">{review.body}</p>}
      {error && <div className="mt-2"><Alert variant="error" title={error} /></div>}
      <Button variant={review.hidden ? "primary" : "danger"} loading={busy} onClick={toggle} className="mt-3">{review.hidden ? "Unhide" : "Hide"}</Button>
    </Card>
  );
}
