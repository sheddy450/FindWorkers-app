import type { Metadata } from "next";
// Private or utility pages: keep them out of search results.
export const metadata: Metadata = { robots: { index: false, follow: false } };
export default function Layout({ children }: { children: React.ReactNode }) { return <>{children}</>; }
