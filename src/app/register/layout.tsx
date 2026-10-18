import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Create an account",
  description: "Join FindWorkers free: hire verified artisans near you, or list your skills and get job requests from customers in your area.",
  alternates: { canonical: "/register" },
};
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
