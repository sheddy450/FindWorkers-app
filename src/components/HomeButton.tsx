import Link from "next/link";

/** A clear way back to the FindWorkers home page, shown at the top of dashboards. */
export function HomeButton({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group inline-flex min-h-11 items-center gap-2 rounded-full border border-brand/40 bg-brand-soft py-1.5 pl-1.5 pr-4 text-sm font-semibold text-brand shadow-[0_1px_2px_rgba(23,26,33,0.05)] transition-colors hover:bg-brand hover:text-white motion-reduce:transition-none ${className}`}>
      <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-white text-brand transition-transform group-hover:-translate-x-0.5 motion-reduce:transition-none">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20h14V9.5" /><path d="M10 20v-6h4v6" /></svg>
      </span>
      FindWorkers home
    </Link>
  );
}
