import Link from "next/link";
import type { Metadata } from "next";
import { JsonLd } from "@/components/seo/JsonLd";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FAQS } from "@/lib/content/faq";
import { og } from "@/lib/seo/site";
import { HelpSearch } from "./HelpSearch";

const description = "Answers for customers and artisans on FindWorkers: finding and hiring artisans, quotes, payment, verification, photos, the job board and your account.";
export const metadata: Metadata = {
  title: "Help centre", description, alternates: { canonical: "/help" },
  openGraph: og({ title: "Help centre | FindWorkers", description, url: "/help" }),
};

const QUICK = [
  { href: "/?tour=1", title: "Take the 1-minute tour", body: "See how searching, quotes and reviews work." },
  { href: "/guides", title: "Hiring guides", body: "Prices, questions to ask and red flags by trade." },
  { href: "/jobs/new", title: "Post a job", body: "Describe the job and get prices from artisans near you." },
  { href: "/guides/how-to-get-more-jobs", title: "For artisans: get more jobs", body: "Profile, photos and quoting tips that win work." },
];

export default function Help() {
  return (
    <main className="pb-6">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage",
        mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
      <div className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Help centre" }]} />
      </div>

      <HelpSearch faqs={FAQS}>
        <h1 className="text-[2.2rem] font-extrabold leading-[1.05] tracking-[-0.02em] sm:text-5xl">How can we help?</h1>
        <p className="mt-2 max-w-xl text-[17px] text-white/85">Search the answers below, or start with one of these.</p>
        <ul className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((q) => (
            <li key={q.href}>
              <Link href={q.href} className="block h-full rounded-[18px] bg-white/10 p-4 ring-1 ring-white/15 transition hover:bg-white/15 motion-reduce:transition-none">
                <span className="block font-semibold">{q.title}</span>
                <span className="mt-0.5 block text-sm text-white/80">{q.body}</span>
              </Link>
            </li>
          ))}
        </ul>
      </HelpSearch>

      <section className="mx-auto mt-10 max-w-5xl px-4 sm:px-6">
        <div className="rounded-[24px] bg-white p-5 shadow-soft ring-1 ring-line/70 sm:p-7">
          <h2 className="text-xl font-bold tracking-tight text-ink">Still stuck?</h2>
          <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-muted">
            <li><strong className="text-ink">A problem with a job:</strong> open the request and message the artisan first. Most issues are sorted out in the chat.</li>
            <li><strong className="text-ink">Someone behaved badly or cheated you:</strong> use <em>Report this artisan</em> on their profile, or report a review. Our team reviews every report.</li>
            <li><strong className="text-ink">Can&apos;t log in:</strong> use <Link href="/forgot-password" className="font-semibold text-brand underline">Forgot password</Link> to set a new one.</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
