import Link from "next/link";
import type { Metadata } from "next";
import { Alert } from "@/components/ui/Alert";
import { resetLinkIsValid } from "@/server/services/password-reset.service";
import { ResetForm } from "./ResetForm";

export const metadata: Metadata = {
  title: "Choose a new password",
  robots: { index: false, follow: false },
  referrer: "no-referrer", // the token is in this page's URL: never pass it to another site
};

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const valid = await resetLinkIsValid(token);
  return (
    <main className="mx-auto max-w-sm p-6">
      <h1 className="text-3xl font-bold text-brand">Choose a new password</h1>
      {valid && token ? <ResetForm token={token} /> : (
        <div className="mt-6 space-y-4">
          <Alert variant="error" title="This link has expired or was already used">Reset links work once and expire after 30 minutes.</Alert>
          <Link href="/forgot-password" className="inline-flex min-h-11 w-full items-center justify-center rounded-ctl bg-brand px-4 font-semibold text-white">Send a new link</Link>
        </div>
      )}
    </main>
  );
}
