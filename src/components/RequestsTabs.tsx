import Link from "next/link";

/** Switch between Requests and Jobs inside the Requests tab (the bottom nav stays the same). */
export function RequestsTabs({ current, role, count }: { current: "requests" | "jobs"; role: "CUSTOMER" | "ARTISAN"; count?: number }) {
  const tabs = [
    { key: "requests", href: "/requests", label: "Requests" },
    { key: "jobs", href: "/jobs", label: role === "ARTISAN" ? "Job board" : "My jobs" },
  ] as const;
  return (
    <nav aria-label="Requests and jobs" className="mt-4 grid grid-cols-2 gap-1 rounded-full bg-brand-soft p-1">
      {tabs.map((t) => {
        const on = t.key === current;
        return (
          <Link key={t.key} href={t.href} aria-current={on ? "page" : undefined}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full text-sm font-semibold transition-colors motion-reduce:transition-none ${on ? "bg-white text-brand shadow-sm" : "text-brand/80 hover:text-brand"}`}>
            {t.label}
            {t.key === "jobs" && count ? <span className="rounded-full bg-brand px-1.5 text-xs text-white">{count}</span> : null}
          </Link>
        );
      })}
    </nav>
  );
}
