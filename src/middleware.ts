import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { allowed } from "@/lib/auth/rbac";

export async function middleware(req: NextRequest) {
  // NextAuth names the session cookie "__Secure-next-auth.session-token" or "next-auth.session-token"
  // depending on how the server saw its own URL, and getToken's default only guesses which one
  // (from NEXTAUTH_URL / VERCEL env vars). A wrong guess makes a logged-in user look logged out
  // here, so they get bounced straight back to /login after signing in. Check both names.
  const token =
    (await getToken({ req, secureCookie: true })) ?? (await getToken({ req, secureCookie: false }));
  const { pathname } = req.nextUrl;
  if (!allowed(pathname, token?.role as never)) {
    const url = req.nextUrl.clone();
    url.pathname = token ? "/" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}
export const config = { matcher: ["/admin/:path*", "/artisan/:path*", "/requests/:path*", "/messages/:path*", "/profile/:path*"] };
