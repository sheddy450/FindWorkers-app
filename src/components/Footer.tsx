import Link from "next/link";
import { CookieChoicesLink } from "@/components/meta/ConsentBanner";

export function Footer() {
  return (
    <footer className="mx-auto max-w-5xl px-6 py-8 text-center text-sm text-muted">
      <nav aria-label="Footer" className="mb-3 flex flex-wrap justify-center gap-x-5 gap-y-2">
        <Link href="/help" className="hover:text-brand">Help centre</Link>
        <Link href="/guides" className="hover:text-brand">Hiring guides</Link>
        <Link href="/categories" className="hover:text-brand">All services</Link>
        <Link href="/jobs/new" className="hover:text-brand">Post a job</Link>
        <Link href="/register?role=ARTISAN" className="hover:text-brand">Join as an artisan</Link>
        <Link href="/privacy" className="hover:text-brand">Privacy</Link>
        <CookieChoicesLink />
      </nav>
      <p className="text-xs">© {new Date().getFullYear()} Shedrach Musa. All rights reserved.</p>
    </footer>
  );
}
