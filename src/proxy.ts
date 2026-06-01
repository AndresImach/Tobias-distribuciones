import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "admin_session";
const LOGIN_PATH = "/admin/login";

function getSecretKey() {
  const secret = process.env.SESSION_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "Missing SESSION_SECRET (or NEXTAUTH_SECRET) environment variable",
    );
  }
  return new TextEncoder().encode(secret);
}

async function isAuthenticated(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return typeof payload.userId === "number";
  } catch {
    return false;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = await isAuthenticated(request);

  // Protect the admin API: respond 401 instead of redirecting.
  if (pathname.startsWith("/api/admin")) {
    if (!authed) {
      return NextResponse.json(
        { error: "No autorizado" },
        { status: 401 },
      );
    }
    return NextResponse.next();
  }

  const isLoginPage = pathname === LOGIN_PATH;

  // Already authenticated users shouldn't see the login page.
  if (isLoginPage && authed) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Any other /admin route requires a valid session.
  if (!isLoginPage && !authed) {
    const loginUrl = new URL(LOGIN_PATH, request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
