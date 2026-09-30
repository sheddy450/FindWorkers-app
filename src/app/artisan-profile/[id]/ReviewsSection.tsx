"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StarRating } from "@/components/ui/StarRating";
import { EmptyState } from "@/components/ui/States";

type ReviewItem = { id: string; rating: number; body: string | null; isVerifiedService: boolean; helpfulCount: number; createdAt: string; customer: { name: string } };
type Sort = "newest" | "rating" | "helpful";

export function ReviewsSection({ reviews, loggedIn, myVotedIds }: { reviews: ReviewItem[]; loggedIn: boolean; myVotedIds: string[] }) {
  const [sort, setSort] = useState<Sort>("newest");
  const [voted, setVoted] = useState<Set<string>>(new Set(myVotedIds));
  const [counts, setCounts] = useState<Record<string, number>>(() => Object.fromEntries(reviews.map((r) => [r.id, r.helpfulCount])));
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const sorted = useMemo(() => {
    const list = [...reviews];
    if (sort === "newest") list.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    if (sort === "rating") list.sort((a, b) => b.rating - a.rating);
    if (sort === "helpful") list.sort((a, b) => (counts[b.id] ?? 0) - (counts[a.id] ?? 0));
    return list;
  }, [reviews, sort, counts]);

  async function toggleHelpful(id: string) {
    if (!loggedIn) return setError("Log in to mark a review as helpful.");
    setBusyId(id); setError("");
    try {
      const res = await fetch(`/api/reviews/${id}/helpful`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return setError(data.error ?? "Couldn't record your vote.");
      setVoted((prev) => { const next = new Set(prev); data.voted ? next.add(id) : next.delete(id); return next; });
      setCounts((prev) => ({ ...prev, [id]: (prev[id] ?? 0) + (data.voted ? 1 : -1) }));
    } catch { setError("Couldn't reach the server."); } finally { setBusyId(null); }
  }

  if (reviews.length === 0) return <EmptyState icon="star" title="No reviews yet" body="This artisan hasn't been reviewed. Their profile is still shown based on verification and availability." />;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-muted">{reviews.length} review{reviews.length === 1 ? "" : "s"}</p>
        <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="min-h-9 rounded-full border border-line bg-white px-3 text-sm">
          <option value="newest">Newest</option><option value="rating">Highest rated</option><option value="helpful">Most helpful</option>
        </select>
      </div>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="space-y-3">
        {sorted.map((r) => (
          <Card key={r.id}>
            <div className="flex items-center justify-between">
              <p className="font-semibold">{r.customer.name}</p>
              {r.isVerifiedService ? <Badge tone="verified">Verified service</Badge> : <Badge>Unverified</Badge>}
            </div>
            <StarRating value={r.rating} count={1} />
            {r.body && <p className="mt-1 text-sm">{r.body}</p>}
            <div className="mt-2 flex items-center justify-between">
              <button onClick={() => toggleHelpful(r.id)} disabled={busyId === r.id}
                className={`text-xs font-medium underline ${voted.has(r.id) ? "text-indigo" : "text-muted"}`}>
                Helpful{(counts[r.id] ?? 0) > 0 ? ` (${counts[r.id]})` : ""}
              </button>
              <div className="flex items-center gap-3">
                <p className="text-xs text-muted">{new Date(r.createdAt).toLocaleDateString("en-NG")}</p>
                {loggedIn && <Link href={`/report?type=REVIEW&id=${r.id}`} className="text-xs text-muted underline">Report</Link>}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
