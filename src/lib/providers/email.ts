import { NotConfiguredError } from "./storage";

export type Email = { to: string; subject: string; html: string; text: string };
export interface EmailProvider { send(email: Email): Promise<void>; }

/** Resend (https://resend.com/docs/api-reference/emails/send-email). The "from" domain must be verified in Resend. */
class ResendEmail implements EmailProvider {
  constructor(private apiKey: string, private from: string) {}
  async send({ to, subject, html, text }: Email) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: this.from, to: [to], subject, html, text }),
      cache: "no-store",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { message?: string } | null;
      throw new Error(`Resend send failed (${res.status}): ${body?.message ?? "no message"}`);
    }
  }
}

/** Development only: prints the email to the server log instead of sending it. */
class ConsoleEmail implements EmailProvider {
  async send({ to, subject, text }: Email) { console.info(`[email:dev] to ${to} | ${subject}\n${text}`); }
}

export function getEmail(): EmailProvider {
  if (process.env.EMAIL_PROVIDER?.trim() === "resend") {
    const key = process.env.RESEND_API_KEY?.trim(), from = process.env.EMAIL_FROM?.trim();
    if (!key || !from) throw new NotConfiguredError("Resend needs RESEND_API_KEY and EMAIL_FROM.");
    return new ResendEmail(key, from);
  }
  if (process.env.NODE_ENV !== "production") return new ConsoleEmail();
  throw new NotConfiguredError("Email isn't set up yet.");
}

export function emailConfigured(): boolean {
  try { getEmail(); return true; } catch { return false; }
}
