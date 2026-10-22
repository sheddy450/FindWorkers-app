import { NotConfiguredError } from "./storage";

/** Sends one text message. `toE164` is like "+2348031234567". */
export interface SmsProvider { send(toE164: string, text: string): Promise<void>; }

/**
 * Termii (https://developers.termii.com/messaging-api). Uses the "dnd" channel: it's the one meant
 * for transactional messages like codes, and reaches numbers on Do-Not-Disturb. The cheaper
 * "generic" channel doesn't deliver to MTN numbers between 8pm and 8am WAT.
 */
class TermiiSms implements SmsProvider {
  constructor(private apiKey: string, private senderId: string, private baseUrl: string) {}
  async send(toE164: string, text: string) {
    const res = await fetch(`${this.baseUrl.replace(/\/+$/, "")}/api/sms/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ api_key: this.apiKey, to: toE164.replace(/^\+/, ""), from: this.senderId, sms: text, type: "plain", channel: "dnd" }),
      cache: "no-store",
    });
    const body = await res.json().catch(() => null) as { code?: string; message?: string } | null;
    if (!res.ok || body?.code !== "ok") throw new Error(`Termii send failed (${res.status}): ${body?.message ?? "no message"}`);
  }
}

/** Development only: prints the message to the server log instead of sending it. */
class ConsoleSms implements SmsProvider {
  async send(toE164: string, text: string) { console.info(`[sms:dev] to ${toE164}: ${text}`); }
}

export function getSms(): SmsProvider {
  const kind = process.env.SMS_PROVIDER?.trim();
  if (kind === "termii") {
    const key = process.env.TERMII_API_KEY?.trim(), sender = process.env.TERMII_SENDER_ID?.trim();
    if (!key || !sender) throw new NotConfiguredError("Termii needs TERMII_API_KEY and TERMII_SENDER_ID.");
    return new TermiiSms(key, sender, process.env.TERMII_BASE_URL?.trim() || "https://api.ng.termii.com");
  }
  if (process.env.NODE_ENV !== "production") return new ConsoleSms();
  throw new NotConfiguredError("SMS isn't set up yet.");
}

/** True when codes can actually be delivered (used to show or hide the "Verify phone" button). */
export function smsConfigured(): boolean {
  try { getSms(); return true; } catch { return false; }
}
