import { RESET_TTL_MIN } from "@/lib/auth/reset-token";

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/** Password reset email: plain-text version plus a simple green-and-white HTML version that works in all mail apps. */
export function resetEmail({ name, link }: { name: string; link: string }) {
  const first = name.trim().split(/\s+/)[0] || "there";
  const subject = "Reset your FindWorkers password";
  const text = [
    `Hi ${first},`,
    "",
    "We got a request to reset the password for your FindWorkers account. Open this link to choose a new one:",
    link,
    "",
    `The link works once and expires in ${RESET_TTL_MIN} minutes.`,
    "If you didn't ask for this, you can ignore this email. Your password won't change.",
    "",
    "FindWorkers · findworkersapp.com",
  ].join("\n");
  const html = `<!doctype html><html><body style="margin:0;background:#F4F7F5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#13201A">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7F5;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#FFFFFF;border-radius:16px;overflow:hidden">
<tr><td style="background:#007A49;padding:20px 24px;color:#FFFFFF;font-size:20px;font-weight:700">FindWorkers</td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 12px;font-size:16px">Hi ${esc(first)},</p>
<p style="margin:0 0 20px;font-size:16px;line-height:1.5">We got a request to reset the password for your FindWorkers account. Tap the button to choose a new one.</p>
<p style="margin:0 0 20px"><a href="${esc(link)}" style="display:inline-block;background:#007A49;color:#FFFFFF;text-decoration:none;font-weight:600;font-size:16px;padding:14px 24px;border-radius:12px">Reset password</a></p>
<p style="margin:0 0 8px;font-size:14px;color:#56665D;line-height:1.5">The link works once and expires in ${RESET_TTL_MIN} minutes. If the button doesn't work, copy this link into your browser:</p>
<p style="margin:0 0 20px;font-size:13px;word-break:break-all"><a href="${esc(link)}" style="color:#007A49">${esc(link)}</a></p>
<p style="margin:0;font-size:14px;color:#56665D;line-height:1.5">If you didn't ask for this, ignore this email. Your password won't change.</p>
</td></tr></table>
<p style="margin:16px 0 0;font-size:12px;color:#56665D">FindWorkers · findworkersapp.com</p>
</td></tr></table></body></html>`;
  return { subject, html, text };
}
