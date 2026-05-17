import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const SESSION_COOKIE = "ezj_admin_session";
const CUSTOMER_SESSION_COOKIE = "ezj_customer_session";

function withPath(req: NextRequest) {
  // Surface the request path to server components.
  const reqHeaders = new Headers(req.headers);
  reqHeaders.set("x-pathname", req.nextUrl.pathname);
  return NextResponse.next({ request: { headers: reqHeaders } });
}

function gateSection(req: NextRequest, prefix: string): NextResponse {
  // Public auth pages
  if (
    req.nextUrl.pathname === `${prefix}/login` ||
    req.nextUrl.pathname === `${prefix}/setup` ||
    req.nextUrl.pathname.startsWith(`${prefix}/login/`) ||
    req.nextUrl.pathname.startsWith(`${prefix}/setup/`)
  ) {
    return withPath(req);
  }
  const sid = req.cookies.get(SESSION_COOKIE)?.value;
  if (!sid) {
    const url = req.nextUrl.clone();
    url.pathname = `${prefix}/login`;
    url.searchParams.set("next", req.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return withPath(req);
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    return gateSection(req, "/admin");
  }
  if (pathname === "/studio" || pathname.startsWith("/studio/")) {
    return gateSection(req, "/studio");
  }
  // Storefront customer area — gate to a logged-in customer session.
  if (pathname === "/account" || pathname.startsWith("/account/")) {
    const sid = req.cookies.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!sid) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/studio/:path*", "/account/:path*"],
};
