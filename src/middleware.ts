import { getToken } from "next-auth/jwt";
import { NextResponse, type NextRequest } from "next/server";
import { allowed } from "@/lib/auth/rbac";

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });
  const { pathname } = req.nextUrl;
  if (!allowed(pathname, token?.role as never)) {
    const url = req.nextUrl.clone();
    url.pathname = token ? "/" : "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
}
export const config = { matcher: ["/admin/:path*", "/artisan/:path*", "/requests/:path*", "/messages/:path*", "/profile/:path*"] };
