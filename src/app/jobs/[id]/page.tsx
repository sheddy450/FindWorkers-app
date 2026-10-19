import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePageRole } from "@/lib/auth/session";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { Icon } from "@/components/ui/Icon";
import { StarRating } from "@/components/ui/StarRating";
import { stateLabel } from "@/lib/seo/site";
import { JOB_LABEL, QUOTE_LABEL, TIMING_LABEL, budgetText, naira, type JobView } from "@/lib/jobs/rules";
import { jobForViewer } from "@/server/services/jobs.service";
import { HelpTip } from "@/components/help/HelpTip";
import { CloseJobButton, HireButton, QuoteForm, WithdrawQuoteButton } from "./JobActions";

export const metadata = { title: "Job" };

const TONE: Record<JobView, "brand" | "verified" | "neutral"> = { OPEN: "brand", HIRED: "verified", CLOSED: "neutral", EXPIRED: "neutral" };

export default async function JobPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ posted?: string }> }) {
  const user = await requirePageRole("CUSTOMER", "ARTISAN", "ADMIN");
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const data = await jobForViewer(id, user);
  if (!data) notFound();
  const { job, view } = data;
  const budget = budgetText(job.budgetMinKobo, job.budgetMaxKobo);
  const when = job.timing === "ON_DATE" && job.preferredDate
    ? job.preferredDate.toLocaleDateString("en-NG", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" })
    : TIMING_LABEL[job.timing];

  return (
    <main className="mx-auto max-w-md space-y-5 p-6 pb-28">
      {data.role === "owner" && sp.posted !== undefined && view === "OPEN" && (
        <Alert variant="success" title="Your job is posted">
          {Number(sp.posted) > 0
            ? `We've told ${sp.posted} artisan${sp.posted === "1" ? "" : "s"} near you. Quotes will appear here, and we'll notify you as they arrive.`
            : "We'll show it to artisans as they look for work. Quotes will appear here, and we'll notify you as they arrive."}
        </Alert>
      )}

      <header className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium text-brand">{job.category.name}</p>
          <Badge tone={TONE[view]}>{JOB_LABEL[view]}</Badge>
        </div>
        <h1 className="text-2xl font-bold text-ink">{job.title}</h1>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-ctl bg-white p-3 shadow-soft"><dt className="text-xs text-muted">Where</dt><dd className="flex items-center gap-1 font-medium"><Icon name="pin" size={14} />{job.lga}, {stateLabel(job.state)}</dd></div>
          <div className="rounded-ctl bg-white p-3 shadow-soft"><dt className="text-xs text-muted">When</dt><dd className="font-medium">{when}</dd></div>
          <div className="col-span-2 rounded-ctl bg-white p-3 shadow-soft"><dt className="text-xs text-muted">Budget</dt><dd className="font-medium">{budget ?? "Open to quotes"}</dd></div>
        </dl>
        <p className="whitespace-pre-line rounded-card bg-white p-4 text-sm shadow-soft">{job.description}</p>
        <p className="text-xs text-muted">
          Posted {job.createdAt.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}
          {view === "OPEN" && ` · open for quotes until ${job.expiresAt.toLocaleDateString("en-NG", { day: "numeric", month: "short" })}`}
        </p>
      </header>

      {data.role === "owner" ? <OwnerQuotes data={data} /> : <ArtisanSide data={data} />}
    </main>
  );
}

type Data = NonNullable<Awaited<ReturnType<typeof jobForViewer>>>;

function OwnerQuotes({ data }: { data: Extract<Data, { role: "owner" }> }) {
  const { job, view, quotes, canAct } = data;
  return (
    <section aria-labelledby="quotes-title" className="space-y-3">
      <div className="flex items-baseline justify-between">
        <h2 id="quotes-title" className="flex items-center gap-2 text-lg font-semibold">Quotes{quotes.length > 0 && <span className="font-normal text-muted">({quotes.length})</span>} <HelpTip topic="quotes" /></h2>
        {quotes.length > 1 && view === "OPEN" && <span className="text-xs text-muted">Cheapest first</span>}
      </div>
      {view === "HIRED" && job.hiredRequestId && (
        <Alert variant="success" title="You hired someone for this job">
          Agree the exact address and time in the chat. <Link href={`/requests/${job.hiredRequestId}`} className="font-semibold underline">Open the request</Link>
        </Alert>
      )}
      {quotes.length === 0 && (
        <Card className="text-center text-sm text-muted">
          {view === "OPEN" ? "No quotes yet. Most jobs get their first quote within a day. We'll notify you." : "This job didn't get any quotes."}
          {view !== "OPEN" && <Link href={`/jobs/new?service=${job.category.slug}`} className="mt-2 block font-semibold text-brand underline">Post it again</Link>}
        </Card>
      )}
      <ul className="space-y-3">
        {quotes.map((q) => {
          const a = q.artisan;
          return (
            <li key={q.id}>
              <Card className={`space-y-3 ${q.status === "ACCEPTED" ? "border-verified ring-2 ring-verified/30" : ""}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link href={`/artisan-profile/${a.userId}`} className="font-semibold text-ink underline-offset-4 hover:underline">{a.businessName}</Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted">
                      <StarRating value={Number(a.avgRating)} count={a.reviewCount} />
                      {a.completedJobs > 0 && <span>· {a.completedJobs} jobs done</span>}
                    </div>
                    {a.verifications.length > 0 && <div className="mt-1"><Badge tone="verified">✓ {a.verifications.length} verified</Badge></div>}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="font-display text-xl font-bold text-brand">{naira(q.priceKobo)}</p>
                    {q.status === "ACCEPTED" && <Badge tone="verified">Hired</Badge>}
                  </div>
                </div>
                <p className="whitespace-pre-line text-sm">{q.message}</p>
                {q.canStart && <p className="text-sm"><span className="text-muted">Can start:</span> <span className="font-medium">{q.canStart}</span></p>}
                {canAct && view === "OPEN" && q.status === "SENT" && (
                  <div className="flex gap-2">
                    <HireButton jobId={job.id} quoteId={q.id} name={a.businessName} price={naira(q.priceKobo)} />
                    <Link href={`/artisan-profile/${a.userId}`} className="inline-flex min-h-11 items-center rounded-ctl border border-line bg-white px-4 font-semibold hover:bg-paper">Profile</Link>
                  </div>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
      {canAct && view === "OPEN" && (
        <div className="pt-2 text-center">
          <CloseJobButton jobId={job.id} hasQuotes={quotes.length > 0} />
        </div>
      )}
      {view === "OPEN" && quotes.length > 0 && (
        <p className="text-xs text-muted">Tip: check each artisan&apos;s photos and reviews before you hire. Pay for materials only after you&apos;ve agreed what&apos;s needed, and avoid paying everything up front.</p>
      )}
    </section>
  );
}

function ArtisanSide({ data }: { data: Extract<Data, { role: "artisan" }> }) {
  const { job, myQuote, quoteCount, blocker } = data;
  const active = myQuote?.status === "SENT";
  const initial = myQuote && myQuote.status === "SENT" ? { priceNaira: String(myQuote.priceKobo / 100), message: myQuote.message, canStart: myQuote.canStart ?? "" } : null;
  return (
    <section aria-labelledby="quote-title" className="space-y-3">
      <h2 id="quote-title" className="text-lg font-semibold">{active ? "Your quote" : "Send a quote"}</h2>
      <p className="text-sm text-muted">{quoteCount} artisan{quoteCount === 1 ? " has" : "s have"} quoted so far. The customer sees your profile, rating and photos next to your price.</p>
      {myQuote && myQuote.status !== "SENT" && (
        <Alert variant={myQuote.status === "ACCEPTED" ? "success" : "info"} title={QUOTE_LABEL[myQuote.status]}>
          {myQuote.status === "ACCEPTED" ? <>You got the job. <Link href={`/requests/${job.hiredRequestId ?? ""}`} className="font-semibold underline">Open the request</Link> to agree the address and time.</>
            : myQuote.status === "DECLINED" ? "The customer chose someone else or closed the job. Keep quoting: good photos and quick replies win jobs." : "You withdrew your quote."}
        </Alert>
      )}
      {blocker && !active ? (
        myQuote?.status === "ACCEPTED" || myQuote?.status === "DECLINED" ? null : <Alert variant="info" title={blocker} />
      ) : (
        <Card>
          <QuoteForm jobId={job.id} initial={initial} />
          {active && <div className="mt-3 border-t border-line pt-3"><WithdrawQuoteButton jobId={job.id} /></div>}
        </Card>
      )}
    </section>
  );
}
