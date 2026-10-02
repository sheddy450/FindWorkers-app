/**
 * Finds NextAuth's session cookie value in a list of cookies.
 *
 * NextAuth v4 names it "__Secure-next-auth.session-token" on https and "next-auth.session-token"
 * on http, and splits it into ".0", ".1", … chunks when it's over ~4 KB. Checking every form
 * means the server recognises a signed-in user however the cookie was set.
 */
const NAMES = ["__Secure-next-auth.session-token", "next-auth.session-token"];

export function readSessionCookie(cookies: readonly { name: string; value: string }[]): string | null {
  const byName = new Map(cookies.map((c) => [c.name, c.value]));
  for (const name of NAMES) {
    const whole = byName.get(name);
    if (whole) return whole;
    const chunks: string[] = [];
    for (let i = 0; byName.has(`${name}.${i}`); i++) chunks.push(byName.get(`${name}.${i}`)!);
    if (chunks.length) return chunks.join("");
  }
  return null;
}
