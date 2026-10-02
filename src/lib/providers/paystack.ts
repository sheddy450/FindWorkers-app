import { NotConfiguredError } from "./storage";
import type { PaystackTx } from "@/lib/pro/rules";

/** Minimal Paystack client (server-side only: it uses the secret key). Docs: https://paystack.com/docs/api/transaction/ */
const API = "https://api.paystack.co";

export function paystackSecret(): string | null {
  return process.env.PAYSTACK_SECRET_KEY?.trim() || null;
}
export const paystackConfigured = () => !!paystackSecret();

async function call<T>(path: string, init?: { method?: "GET" | "POST"; body?: string }): Promise<T> {
  const secret = paystackSecret();
  if (!secret) throw new NotConfiguredError("Payments aren't set up yet.");
  const res = await fetch(`${API}${path}`, {
    method: init?.method ?? "GET",
    body: init?.body,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json" },
    cache: "no-store",
  });
  const body = await res.json().catch(() => null) as { status?: boolean; message?: string; data?: T } | null;
  if (!res.ok || !body?.status || body.data == null) {
    throw new Error(`Paystack ${path} failed (${res.status}): ${body?.message ?? "no message"}`);
  }
  return body.data;
}

/** Starts a payment and returns the Paystack checkout page URL to send the user to. */
export async function initializeTransaction(p: {
  email: string; amountKobo: number; reference: string; callbackUrl: string; metadata?: Record<string, unknown>;
}): Promise<string> {
  const data = await call<{ authorization_url: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({ email: p.email, amount: p.amountKobo, currency: "NGN", reference: p.reference,
      callback_url: p.callbackUrl, metadata: p.metadata }),
  });
  return data.authorization_url;
}

/** Asks Paystack for the real outcome of a transaction. Never trust status sent by the browser. */
export async function verifyTransaction(reference: string): Promise<PaystackTx> {
  const data = await call<PaystackTx>(`/transaction/verify/${encodeURIComponent(reference)}`);
  return { status: data.status, amount: data.amount, currency: data.currency, reference: data.reference };
}
