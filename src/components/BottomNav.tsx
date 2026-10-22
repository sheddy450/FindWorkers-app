"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, IconName } from "./ui/Icon";
import type { Role } from "@prisma/client";

const CUSTOMER_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Home", icon: "home" }, { href: "/search", label: "Search", icon: "search" },
  { href: "/requests", label: "Requests", icon: "requests" }, { href: "/messages", label: "Messages", icon: "chat" },
  { href: "/profile", label: "Profile", icon: "user" },
];
// Artisans have no use for the customer search homepage or search tab — swap them for their
// dashboard, which is where "Home" should actually take them after login.
const ARTISAN_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/artisan/dashboard", label: "Dashboard", icon: "home" }, { href: "/requests", label: "Requests", icon: "requests" },
  { href: "/messages", label: "Messages", icon: "chat" }, { href: "/profile", label: "Profile", icon: "user" },
];
const ADMIN_ITEMS: { href: string; label: string; icon: IconName }[] = [
  { href: "/admin", label: "Admin", icon: "home" }, { href: "/", label: "Website", icon: "search" }, { href: "/profile", label: "Profile", icon: "user" },
];
const HIDDEN = ["/login", "/register", "/design", "/location"];

export function BottomNav({ role }: { role?: Role }) {
  const path = usePathname();
  const [unread, setUnread] = useState(0);
  // The tab lights up the moment it's tapped, instead of waiting for the next page to arrive.
  const [tapped, setTapped] = useState<string | null>(null);
  useEffect(() => setTapped(null), [path]);
  const items = role === "ARTISAN" ? ARTISAN_ITEMS : role === "ADMIN" ? ADMIN_ITEMS : CUSTOMER_ITEMS;

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return; // not logged in, or a transient error — just skip this tick
        const data = await res.json();
        if (!cancelled) setUnread((data.notifications ?? []).filter((n: { readAt: string | null }) => !n.readAt).length);
      } catch { /* ignore: badge just stays stale until the next successful poll */ }
    }
    poll();
    const t = setInterval(poll, 30000);
    return () => { cancelled = true; clearInterval(t); };
  }, [path]);

  if (HIDDEN.includes(path)) return null;
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line/80 bg-white/[0.97] pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgba(19,32,26,0.18)]">
      <ul className="mx-auto flex max-w-2xl">
        {items.map((i) => {
          const on = tapped ? tapped === i.href : i.href === "/" ? path === "/" : path.startsWith(i.href);
          return (
            <li key={i.href} className="flex-1">
              <Link href={i.href} aria-current={on ? "page" : undefined} onClick={() => setTapped(i.href)}
                className={`flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold transition-colors duration-150 active:scale-95 motion-reduce:transition-none ${on ? "text-brand" : "text-muted"}`}>
                <span className={`relative rounded-full px-4 py-1 transition-colors duration-150 motion-reduce:transition-none ${on ? "bg-brand-soft" : ""}`}>
                  <Icon name={i.icon} />
                  {i.href === "/profile" && unread > 0 && (
                    <span aria-hidden className="absolute right-2 top-0 h-2 w-2 rounded-full bg-danger" />
                  )}
                </span>{i.label}
              </Link>
            </li>);
        })}
      </ul>
    </nav>
  );
}
