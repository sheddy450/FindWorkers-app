import Link from "next/link";
import { Icon, IconName } from "./Icon";
import { Button } from "./Button";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-ctl bg-line ${className}`} />;
}
/** Placeholder shaped like an artisan card, so layout doesn't jump when data loads. */
export function ArtisanCardSkeleton() {
  return (
    <div role="status" aria-label="Loading artisans" className="overflow-hidden rounded-[20px] bg-white shadow-soft ring-1 ring-line/70">
      <div aria-hidden className="aspect-[16/9] w-full animate-pulse bg-line sm:aspect-[21/9]" />
      <div className="flex items-center gap-3 px-4 py-3">
        <div className="flex-1 space-y-2"><Skeleton className="h-4 w-1/2" /><Skeleton className="h-4 w-1/3" /></div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
    </div>
  );
}
type StateProps = { icon?: IconName; title: string; body: string; action?: { label: string; onClick?: () => void; href?: string } };
function Shell({ icon = "info", title, body, action, tone }: StateProps & { tone: string }) {
  return (
    <div className="mx-auto max-w-sm rounded-card border border-dashed border-line bg-white/60 px-6 py-10 text-center">
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${tone}`}><Icon name={icon} size={26} /></div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-muted">{body}</p>
      {action && (action.href
        ? <Link href={action.href} className="mt-5 inline-flex min-h-11 items-center rounded-ctl bg-brand px-4 font-semibold text-white hover:bg-brand-700">{action.label}</Link>
        : <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>)}
    </div>
  );
}
export const EmptyState = (p: StateProps) => <Shell {...p} tone="bg-brand-soft text-brand" />;
export const ErrorState = (p: StateProps) => <Shell icon="alert" {...p} tone="bg-danger-soft text-danger" />;
