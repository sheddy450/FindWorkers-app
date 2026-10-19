import Link from "next/link";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/States";
import { Icon } from "@/components/ui/Icon";
import { RequestsTabs } from "@/components/RequestsTabs";
import { stateLabel } from "@/lib/seo/site";
import { JOB_LABEL, QUOTE_LABEL, TIMING_LABEL, budgetText, naira, type JobView } from "@/lib/jobs/rules";
import { jobBoard, myJobs } from "@/server/services/jobs.service";

export const metadata = { title: "Jobs" };

const TONE: Record<JobView, "brand" | "verified" | "neutral" | "danger"> = { OPEN: "brand", HIRED: "verified", CLOSED: "neutral", EXPIRED: "neutral" };
const ago = (d: Date) => {
  const m = Math.round((Date.now() - d.getTime()) / 60000);
  return m < 60 ? `${Math.max(1, m)} min ago` : m < 1440 ? `${Math.round(m / 60)} h ago` : `${Math.round(m / 1440)} d ago`;
};

export default async function Jobs() {
  const user = await requirePageRole("CUSTOMER", "ARTISAN");
  return user.role === "CUSTOMER" ? <CustomerJobs userId={user.id} /> : <ArtisanBoard userId={user.id} />;
}

async function CustomerJobs({ userId }: { userId: string }) {
  const jobs = await myJobs(userId);
  return (
    <main className="mx-auto max-w-md p-6 pb-28">
      <h1 className="text-2xl font-bold text-brand">Requests</h1>
      <RequestsTabs current="jobs" role="CUSTOMER" />
      <Link href="/jobs/new" className="mt-4 flex min-h-12 items-center justify-center gap-2 rounded-full bg-brand px-5 font-semibold text-white shadow-soft hover:bg-brand-700">
        <span aria-hidden className="text-lg leading-none">+</span> Post a job — free
      </Link>
      {jobs.length === 0 ? (
        <div className="mt-5"><EmptyState icon="requests" title="No jobs posted yet" body="Describe what you need and artisans near you will send you quotes. You choose who to hire." action={{ label: "Post your first job", href: "/jobs/new" }} /></div>
      ) : (
        <ul className="mt-5 space-y-3">
          {jobs.map((j) => (
            <li key={j.id}>
              <Link href={`/jobs/${j.id}`} className="block">
                <Card className="space-y-2 transition hover:border-brand/30 hover:shadow-md motion-reduce:transition-none">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0"><p className="truncate font-semibold">{j.title}</p><p className="text-sm text-muted">{j.category.name} · {j.lga}, {stateLabel(j.state)}</p></div>
                    <Badge tone={TONE[j.view]}>{JOB_LABEL[j.view]}</Badge>
                  </div>
                  <p className="text-sm">
                    {j.quoteCount > 0
                      ? <span className="font-semibold text-brand">{j.quoteCount} quote{j.quoteCount === 1 ? "" : "s"}{j.view === "OPEN" ? " · compare and hire" : ""}</span>
                      : <span className="text-muted">{j.view === "OPEN" ? "Waiting for quotes…" : "No quotes"}</span>}
                    <span className="text-muted"> · posted {ago(j.createdAt)}</span>
                  </p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

async function ArtisanBoard({ userId }: { userId: string }) {
  const board = await jobBoard(userId);
  return (
    <main className="mx-auto max-w-md p-6 pb-28">
      <h1 className="text-2xl font-bold text-brand">Requests</h1>
      <RequestsTabs current="jobs" role="ARTISAN" count={board.ready ? board.jobs.filter((j) => !j.myQuote).length : 0} />
      {!board.ready ? (
        <div className="mt-5"><EmptyState icon="wrench" title="Finish your profile to see jobs" body="Jobs are matched to the services and state on your profile. Add them and new jobs will show up here." action={{ label: "Edit profile", href: "/artisan/profile" }} /></div>
      ) : board.jobs.length === 0 ? (
        <div className="mt-5"><EmptyState icon="search" title={`No open jobs in ${stateLabel(board.state)} yet`} body="We'll notify you when a customer posts a job for your services. Clear work photos help you win the jobs that come in." action={{ label: "Add work photos", href: "/artisan/photos" }} /></div>
      ) : (
        <>
          <p className="mt-4 text-sm text-muted">Open jobs for your services in {stateLabel(board.state)}. Jobs in your area come first.</p>
          <ul className="mt-3 space-y-3">
            {board.jobs.map((j) => {
              const budget = budgetText(j.budgetMinKobo, j.budgetMaxKobo);
              return (
                <li key={j.id}>
                  <Link href={`/jobs/${j.id}`} className="block">
                    <Card className="space-y-2 transition hover:border-brand/30 hover:shadow-md motion-reduce:transition-none">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0"><p className="font-semibold">{j.title}</p>
                          <p className="flex items-center gap-1 text-sm text-muted"><Icon name="pin" size={14} />{j.lga}, {stateLabel(j.state)}{j.nearYou && <span className="ml-1 font-semibold text-brand">· Your area</span>}</p></div>
                        {j.myQuote ? <Badge tone={j.myQuote.status === "SENT" ? "brand" : "neutral"}>{j.myQuote.status === "SENT" ? `You quoted ${naira(j.myQuote.priceKobo)}` : QUOTE_LABEL[j.myQuote.status]}</Badge> : <Badge tone="warning">New</Badge>}
                      </div>
                      <p className="line-clamp-2 text-sm">{j.description}</p>
                      <p className="flex flex-wrap gap-x-3 text-xs text-muted">
                        <span>{j.category.name}</span><span>{TIMING_LABEL[j.timing]}</span>{budget && <span>Budget {budget}</span>}
                        <span>{j.quoteCount} quote{j.quoteCount === 1 ? "" : "s"}</span><span>{ago(j.createdAt)}</span>
                      </p>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </main>
  );
}
