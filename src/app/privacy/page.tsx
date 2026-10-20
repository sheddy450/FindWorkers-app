import Link from "next/link";
import { og } from "@/lib/seo/site";

export const metadata = {
  title: "Privacy",
  description: "What FindWorkers collects, why, who sees it, and your choices, including cookies.",
  alternates: { canonical: "/privacy" },
  openGraph: og({ title: "Privacy | FindWorkers", description: "How FindWorkers uses your information.", url: "/privacy" }),
};

/** Where privacy questions go. Make sure this mailbox exists (or change it) before launch. */
const CONTACT = "privacy@findworkersapp.com";
const UPDATED = "20 October 2026";

const H = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h2 id={id} className="mt-8 scroll-mt-20 text-xl font-bold tracking-tight text-ink">{children}</h2>
);

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-6 text-[15px] leading-relaxed text-ink sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight text-brand">Privacy</h1>
      <p className="mt-1 text-sm text-muted">Last updated {UPDATED}</p>
      <p className="mt-4">
        FindWorkers connects people who need a job done with artisans in Nigeria. This page explains, in plain words,
        what we collect, why, who can see it, and the choices you have under the Nigeria Data Protection Act 2023.
      </p>

      <H>What we collect</H>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li><strong>Your account:</strong> name, phone number, email (if you give one) and a scrambled copy of your password (we can&apos;t read it).</li>
        <li><strong>Artisans:</strong> business name, services, prices, area, photos of your work, and ID documents you upload for verification.</li>
        <li><strong>Jobs and requests:</strong> what you need done, your area or address, photos you add, messages, quotes and reviews.</li>
        <li><strong>Location:</strong> only if you allow it, to show artisans near you. Exact locations are not shown to other users.</li>
        <li><strong>Technical data:</strong> device and browser type, IP address and pages visited, to keep the site secure and working.</li>
      </ul>

      <H>Why we use it</H>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li>To run your account and connect customers with artisans (the service you signed up for).</li>
        <li>To keep people safe: verifying artisans, checking photos, stopping fraud and spam.</li>
        <li>To measure and improve our advertising, <strong>only if you accept cookies</strong> (see below).</li>
      </ul>

      <H>Who can see it</H>
      <ul className="mt-2 list-disc space-y-1.5 pl-5">
        <li><strong>Other users:</strong> customers see an artisan&apos;s public profile. Phone numbers are shown only to signed-in users who ask to contact or hire. ID documents are never shown to customers.</li>
        <li><strong>Our team:</strong> to review verifications, photos and reports.</li>
        <li><strong>Service providers</strong> who run parts of the site for us: hosting (Vercel), database (Neon), file storage, email and payments. They may only use your data to provide that service.</li>
        <li><strong>Meta (Facebook and Instagram):</strong> only if you accept cookies. See the next section.</li>
        <li>We do not sell your personal information.</li>
      </ul>

      <H id="cookies">Cookies and Meta</H>
      <p className="mt-2">
        We always use one essential cookie to keep you logged in, and one to remember your cookie choice.
      </p>
      <p className="mt-2">
        If you tap <strong>Accept</strong> on the cookie banner, we also load the Meta Pixel. It tells Meta when someone visits
        FindWorkers or takes an action such as creating an account, posting a job or booking an artisan, so we can see which
        ads work and show them to people likely to need us. For those actions our server also tells Meta directly, sending
        your email and phone number only in a scrambled (hashed) form. Meta handles this data under its own privacy policy.
      </p>
      <p className="mt-2">
        If you tap <strong>No thanks</strong>, none of this happens and the site works exactly the same. You can change your
        mind any time with <strong>Cookie choices</strong> at the bottom of every page.
      </p>

      <H>How long we keep it</H>
      <p className="mt-2">
        While your account is open. If you ask us to delete your account, we delete or anonymise your data, except records we
        must keep by law or to settle a dispute (for example, payment records).
      </p>

      <H>Your rights</H>
      <p className="mt-2">
        You can ask to see the data we hold about you, correct it, delete it, or withdraw consent you gave. Email{" "}
        <a href={`mailto:${CONTACT}`} className="font-semibold text-brand underline">{CONTACT}</a>. We reply within 30 days.
        If you&apos;re not happy with our answer, you can complain to the Nigeria Data Protection Commission (NDPC).
      </p>

      <p className="mt-8 text-sm text-muted">
        Questions about using FindWorkers? Visit the <Link href="/help" className="font-semibold text-brand underline">Help centre</Link>.
      </p>
    </main>
  );
}
