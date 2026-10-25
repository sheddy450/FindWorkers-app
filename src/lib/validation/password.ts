/**
 * Password rule for every place a password is set (sign-up, change, reset). Short enough for people
 * signing up on a phone from an ad (6+ characters), but the guessable classics are refused. Brute force
 * is handled by the login rate limits (8 tries per account per 15 minutes), not by length alone.
 */
export const PASSWORD_MIN = 6;
export const PASSWORD_MAX = 128;
export const PASSWORD_HINT = `At least ${PASSWORD_MIN} characters. Avoid 123456 or your phone number.`;

const COMMON = new Set([
  "123456", "1234567", "12345678", "123456789", "1234567890", "654321", "123123", "112233", "121212", "123321",
  "000000", "111111", "222222", "333333", "444444", "555555", "666666", "777777", "888888", "999999",
  "password", "password1", "passw0rd", "qwerty", "qwerty123", "abc123", "abcdef", "iloveyou", "letmein", "welcome",
  "findworkers", "nigeria", "jesus", "football", "aaaaaa", "asdfgh",
]);

/** Returns what's wrong with the password, or null if it's fine. `phone` is any form of their number. */
export function passwordProblem(password: string, phone?: string | null): string | null {
  if (password.length < PASSWORD_MIN) return `Use at least ${PASSWORD_MIN} characters.`;
  if (password.length > PASSWORD_MAX) return "That password is too long.";
  const p = password.trim().toLowerCase();
  if (COMMON.has(p) || /^(.)\1+$/.test(p)) return "That password is too easy to guess. Try another.";
  // Compare the 10-digit national number, whichever way either is written (0803…, 234803…, 803…).
  const national = (v: string) => v.replace(/\D/g, "").replace(/^(?:234|0)/, "");
  const mine = national(phone ?? "");
  if (mine.length === 10 && /^[\d\s+()-]+$/.test(password) && national(password) === mine)
    return "Don't use your phone number as your password.";
  return null;
}
