"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/photos", label: "Photos" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/guides", label: "Guides" },
  { href: "/admin/pro", label: "Pro plan" },
];
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-6 overflow-x-auto px-6"><div className="flex gap-2 pb-3">
      {items.map((i) => {
        const on = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${on ? "border-brand bg-brand text-white" : "border-line bg-white"}`}>{i.label}</Link>;
      })}
      {/* The public site as customers see it, without logging out. */}
      <Link href="/" className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-full border border-brand/40 bg-brand-soft px-4 py-2 text-sm font-semibold text-brand hover:bg-brand hover:text-white">
        View website
        <svg aria-hidden viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M9 7h8v8" /></svg>
      </Link>
    </div></nav>
  );
}
