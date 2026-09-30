import "./globals.css";
import { ToastProvider } from "@/components/ui/Toast";
import { BottomNav } from "@/components/BottomNav";
import { Footer } from "@/components/Footer";
import { currentUser } from "@/lib/auth/session";
export const metadata = { title: "FindWorkers", description: "Find vetted local artisans near you" };
export default async function Root({ children }: { children: React.ReactNode }) {
  const me = await currentUser();
  return (
    <html lang="en"><body>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:m-2 focus:rounded-ctl focus:bg-white focus:p-3">Skip to content</a>
      <ToastProvider><div id="main" className="pb-20">{children}<Footer /></div><BottomNav role={me?.role} /></ToastProvider>
    </body></html>
  );
}
