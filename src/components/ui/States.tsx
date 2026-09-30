import { Icon, IconName } from "./Icon";
import { Button } from "./Button";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-ctl bg-line ${className}`} />;
}
/** Placeholder shaped like an artisan card, so layout doesn't jump when data loads. */
export function ArtisanCardSkeleton() {
  return (
    <div role="status" aria-label="Loading artisans" className="flex gap-3 rounded-card border border-line bg-white p-4">
      <Skeleton className="h-16 w-16 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-3/4" /></div>
    </div>
  );
}
type StateProps = { icon?: IconName; title: string; body: string; action?: { label: string; onClick?: () => void; href?: string } };
function Shell({ icon = "info", title, body, action, tone }: StateProps & { tone: string }) {
  return (
    <div className="mx-auto max-w-sm py-10 text-center">
      <div className={`mx-auto grid h-14 w-14 place-items-center rounded-full ${tone}`}><Icon name={icon} size={26} /></div>
      <h2 className="mt-4 text-xl font-semibold">{title}</h2>
      <p className="mt-1 text-muted">{body}</p>
      {action && (action.href
        ? <a href={action.href} className="mt-5 inline-flex min-h-11 items-center rounded-ctl bg-indigo px-4 font-semibold text-white">{action.label}</a>
        : <Button className="mt-5" onClick={action.onClick}>{action.label}</Button>)}
    </div>
  );
}
export const EmptyState = (p: StateProps) => <Shell {...p} tone="bg-indigo-soft text-indigo" />;
export const ErrorState = (p: StateProps) => <Shell icon="alert" {...p} tone="bg-danger-soft text-danger" />;
