import Link from "next/link";
import { db } from "@/lib/db";
import { requirePageRole } from "@/lib/auth/session";
import { Alert } from "@/components/ui/Alert";
import { confirmProPayment, type ConfirmResult } from "@/server/services/pro.service";

/** Paystack sends the artisan back here after paying. We confirm with Paystack before showing anything as paid. */
export default async function ProCallback({ searchParams }: { searchParams: Promise<{ reference?: string; trxref?: string }> }) {
  const user = await requirePageRole("ARTISAN");
  const sp = await searchParams;
  const reference = sp.reference ?? sp.trxref ?? "";

  // Only the artisan who started the payment can confirm it from this page.
  const payment = reference ? await db.payment.findUnique({ where: { reference }, select: { userId: true } }) : null;
  let result: ConfirmResult = { state: "not_found" };
  if (payment?.userId === user.id) {
    try { result = await confirmProPayment(reference); }
    catch (e) { console.error("[pro] callback confirm failed", reference, e); result = { state: "pending" }; }
  }

  return (
    <main className="mx-auto max-w-md space-y-4 p-6">
      <h1 className="text-3xl font-bold text-brand">
        {result.state === "paid" ? "You're Pro!" : result.state === "pending" ? "Payment processing" : "Payment not completed"}
      </h1>
      {result.state === "paid" && (
        <Alert variant="success" title="Payment received">
          {result.proUntil ? `Your Pro plan is active until ${result.proUntil.toLocaleDateString("en-NG", { day: "numeric", month: "long", year: "numeric" })}.` : "Your Pro plan is active."}
          {" "}You'll now appear in the Featured slot and can see your profile stats.
        </Alert>
      )}
      {result.state === "pending" && (
        <Alert variant="info" title="We're waiting for Paystack to confirm">
          Bank transfers can take a few minutes. Your Pro plan starts automatically once it's confirmed. You don't need to pay again.
        </Alert>
      )}
      {(result.state === "failed" || result.state === "not_found") && (
        <Alert variant="error" title="We couldn't confirm a payment">
          You haven't been charged for Pro. If money left your account, contact us with your Paystack receipt.
        </Alert>
      )}
      <div className="flex flex-wrap gap-3">
        <Link href="/artisan/dashboard" className="inline-flex min-h-11 items-center rounded-ctl bg-brand px-4 font-semibold text-white">Go to dashboard</Link>
        <Link href="/artisan/pro" className="inline-flex min-h-11 items-center rounded-ctl border border-line bg-white px-4 font-semibold">Pro plan</Link>
      </div>
    </main>
  );
}
