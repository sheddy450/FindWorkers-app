import Link from "next/link";

export const metadata = { title: "Account deleted", robots: { index: false } };

export default function AccountDeleted() {
  return (
    <main className="mx-auto max-w-md p-6 text-center">
      <h1 className="text-3xl font-bold text-brand">Your account has been deleted</h1>
      <p className="mt-3 text-muted">Your personal details have been removed and you&apos;ve been logged out. Thank you for using FindWorkers.</p>
      <p className="mt-2 text-sm text-muted">Changed your mind? You can create a new account at any time.</p>
      <div className="mt-6 flex justify-center gap-2">
        <Link href="/" className="inline-flex min-h-11 items-center rounded-full bg-brand px-5 font-semibold text-white hover:bg-brand-700">Go to the home page</Link>
        <Link href="/register" className="inline-flex min-h-11 items-center rounded-full border border-line px-5 font-semibold hover:bg-paper">Create an account</Link>
      </div>
    </main>
  );
}
