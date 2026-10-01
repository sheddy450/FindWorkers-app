/**
 * Rules for the Back button. Pure functions (no React) so they're easy to unit-test.
 *
 * Back first tries to return to the previous page *inside this app* (browser history). When there
 * isn't one (shared link, new tab, refresh, or right after login), it goes to a sensible parent
 * page instead — the "fallback" — so a deep link never strands someone.
 */
type Role = "CUSTOMER" | "ARTISAN" | "ADMIN";

/** Where "home" is for each role. Artisans and admins never use the customer homepage "/". */
export function roleHome(role?: Role | null): string {
  return role === "ARTISAN" ? "/artisan/dashboard" : role === "ADMIN" ? "/admin" : "/";
}

/** Pages that are "home" for someone: no Back button there. */
export function isHomeFor(pathname: string, role?: Role | null): boolean {
  return pathname === "/" || pathname === roleHome(role);
}

/** The parent page to use when there's no in-app page to go back to. */
export function fallbackFor(pathname: string, role?: Role | null): string {
  const home = roleHome(role);
  const parts = pathname.split("/").filter(Boolean);
  const [first, second, third] = parts;
  let target: string;

  if (first === "requests" && second === "new" && third) target = `/artisan-profile/${third}`;
  else if (first === "requests" && second) target = "/requests";
  else if (first === "messages" && second) target = "/messages";
  else if (first === "admin" && second === "users" && third) target = "/admin/users";
  else if (first === "admin" && second) target = "/admin";
  else if (first === "artisan" && second) target = "/artisan/dashboard";
  else if (first === "artisan-profile") target = "/search";
  else if (["categories", "search", "location", "login", "register"].includes(first ?? "")) target = "/";
  else target = home;

  // "/" is the customer homepage; artisans/admins get redirected away from it, so send them home instead.
  if (target === "/") target = home;
  return target === pathname ? home : target;
}

/** Pages Back must never return to: auth screens (pointless once signed in). */
const NEVER_BACK_TO = ["/login", "/register"];

/**
 * Updates the in-app visit stack after a navigation to `pathname`.
 * Going to the page just before the current one is treated as a Back step (pop);
 * a refresh of the same page changes nothing; anything else is a new visit (push).
 */
export function recordVisit(stack: readonly string[], pathname: string): string[] {
  const last = stack[stack.length - 1];
  if (last === pathname) return [...stack];
  if (stack.length >= 2 && stack[stack.length - 2] === pathname) return stack.slice(0, -1);
  return [...stack, pathname];
}

/**
 * The page Back would return to, or null if browser-back isn't safe here and the
 * fallback should be used instead (no in-app history, an auth screen, or the
 * customer homepage for a non-customer).
 */
export function previousInApp(stack: readonly string[], role?: Role | null): string | null {
  if (stack.length < 2) return null;
  const prev = stack[stack.length - 2];
  if (NEVER_BACK_TO.includes(prev)) return null;
  if (prev === "/" && (role === "ARTISAN" || role === "ADMIN")) return null;
  return prev;
}
