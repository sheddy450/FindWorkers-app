"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const items = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/verifications", label: "Verifications" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/requests", label: "Requests" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/categories", label: "Categories" },
];
export function AdminNav() {
  const path = usePathname();
  return (
    <nav aria-label="Admin" className="-mx-6 overflow-x-auto px-6"><div className="flex gap-2 pb-3">
      {items.map((i) => {
        const on = i.href === "/admin" ? path === "/admin" : path.startsWith(i.href);
        return <Link key={i.href} href={i.href} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-sm font-medium ${on ? "border-indigo bg-indigo text-white" : "border-line bg-white"}`}>{i.label}</Link>;
      })}
    </div></nav>
  );
}
