import { NextResponse } from "next/server";
import { paystackSecret } from "@/lib/providers/paystack";
import { isValidPaystackSignature } from "@/lib/pro/rules";
import { confirmProPayment } from "@/server/services/pro.service";

/**
 * Paystack → FindWorkers payment notifications. Set this URL in the Paystack dashboard
 * (Settings → API Keys & Webhooks): https://<your-domain>/api/webhooks/paystack
 *
 * This is the backup for when the user closes the browser before returning from Paystack.
 * It re-checks every payment with Paystack's API, so even a valid signature can't grant Pro on its own.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!isValidPaystackSignature(raw, req.headers.get("x-paystack-signature"), paystackSecret() ?? "")) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }
  let event: { event?: string; data?: { reference?: string } };
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ error: "Bad JSON" }, { status: 400 }); }

  const reference = event.data?.reference;
  if (event.event === "charge.success" && reference?.startsWith("pro_")) {
    try {
      await confirmProPayment(reference);
    } catch (e) {
      console.error("[pro] webhook processing failed", reference, e);
      return NextResponse.json({ error: "Retry later" }, { status: 500 }); // Paystack retries non-2xx
    }
  }
  return NextResponse.json({ received: true });
}
