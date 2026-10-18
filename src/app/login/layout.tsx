import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to FindWorkers to book artisans, chat and follow your requests.",
  alternates: { canonical: "/login" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
