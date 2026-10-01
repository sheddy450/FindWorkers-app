"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, type MouseEvent } from "react";
import type { Role } from "@prisma/client";
import { Icon } from "./ui/Icon";
import { fallbackFor, isHomeFor, previousInApp, recordVisit, roleHome } from "@/lib/nav/back";

/*
 * In-app visit history, kept in memory for this browser tab only.
 * It resets on a full page load (refresh, new tab, opening a shared link, or the hard redirect
 * after login), which is exactly when browser-back would leave the app or land on /login,
 * so in those cases Back uses the page's fallback parent instead.
 */
let visits: string[] = [];

const RoleCtx = createContext<Role | undefined>(undefined);

/** Wraps the app (in the root layout): records each in-app navigation and shares the user's role. */
export function BackNavProvider({ role, children }: { role?: Role; children: React.ReactNode }) {
  const path = usePathname();
  useEffect(() => { visits = recordVisit(visits, path); }, [path]);
  return <RoleCtx.Provider value={role}>{children}</RoleCtx.Provider>;
}

/** Returns where Back's link points (its no-JS / new-tab target) and a click handler that goes back. */
export function useGoBack(fallback?: string) {
  const router = useRouter();
  const path = usePathname();
  const role = useContext(RoleCtx);
  const href = fallback ?? fallbackFor(path, role);
  const goBack = useCallback(() => {
    if (previousInApp(visits, role)) router.back();
    else router.push(href);
  }, [router, role, href]);
  return { href, goBack };
}

/** A real link (works without JS, middle-click opens a new tab) that goes back in-app when clicked. */
export function BackButton({ fallback, className = "" }: { fallback?: string; className?: string }) {
  const { href, goBack } = useGoBack(fallback);
  function onClick(e: MouseEvent<HTMLAnchorElement>) {
    // Let the browser handle new-tab / new-window clicks normally.
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    goBack();
  }
  return (
    <Link href={href} onClick={onClick} aria-label="Go back"
      className={`-ml-2 inline-flex min-h-11 min-w-11 items-center gap-1 rounded-ctl px-2 font-semibold text-indigo transition-colors hover:bg-indigo-soft active:bg-indigo-soft motion-reduce:transition-none ${className}`}>
      <Icon name="back" size={22} /><span>Back</span>
    </Link>
  );
}

/** Sticky top bar with Back + a home link. Hidden on the home page (and on artisan/admin home pages). */
export function BackBar() {
  const path = usePathname();
  const role = useContext(RoleCtx);
  if (isHomeFor(path, role)) return null;
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-white/95 pt-[env(safe-area-inset-top)] backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-14 max-w-2xl items-center justify-between px-4">
        <BackButton />
        <Link href={roleHome(role)} aria-label="FindWorkers home" className="flex min-h-11 items-center gap-2 rounded-ctl px-1">
          <span aria-hidden className="grid h-7 w-7 place-items-center rounded-lg bg-indigo font-display text-sm font-bold text-marigold">F</span>
          <span className="font-display text-base font-bold text-indigo">FindWorkers</span>
        </Link>
      </div>
    </header>
  );
}
