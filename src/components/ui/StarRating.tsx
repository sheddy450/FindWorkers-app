import { Icon } from "./Icon";
/** Read-only stars. Shows "No reviews yet" instead of a misleading 0.0. */
export function StarRating({ value, count }: { value: number; count: number }) {
  if (!count) return <span className="text-sm text-muted">No reviews yet</span>;
  return (
    <span className="inline-flex items-center gap-1 text-sm" aria-label={`Rated ${value.toFixed(1)} out of 5 from ${count} reviews`}>
      <span className="text-star"><Icon name="star" size={16} filled /></span>
      <span className="font-semibold">{value.toFixed(1)}</span><span className="text-muted">({count})</span>
    </span>
  );
}
