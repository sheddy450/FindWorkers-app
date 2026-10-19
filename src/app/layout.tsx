import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { BackBar, BackNavProvider } from "@/components/BackButton";
import type { Metadata } from "next";
import { Suspense } from "react";
import { currentUser } from "@/lib/auth/session";
import { NavProgress } from "@/components/NavProgress";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/seo/site";
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_NG", title: SITE_TITLE, description: SITE_DESCRIPTION },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESCRIPTION },
  // Paste the code Google Search Console gives you into GOOGLE_SITE_VERIFICATION (Vercel env) to verify ownership.
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  formatDetection: { telephone: false },
};
export const viewport = { themeColor: "#007A49" };
export default async function Root({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  return (
    <html lang="en-NG"><body>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-ctl focus:bg-white focus:p-3">Skip to content</a>
      <Suspense fallback={null}><NavProgress /></Suspense>
      <ToastProvider><BackNavProvider role={me?.role}>
        <BackBar />
        <div id="main" className="pb-20">{children}<Footer /></div>
        <BottomNav role={me?.role} />
      </BackNavProvider></ToastProvider>
    </body></html>
  );
}
