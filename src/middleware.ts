import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path.startsWith("/api/auth")) return NextResponse.next();
  if (path.startsWith("/signin") || path.startsWith("/signup")) return NextResponse.next();
  if (
    path.startsWith("/v/") ||
    path.startsWith("/p/") ||
    path.startsWith("/quote/") ||
    path.startsWith("/api/public/")
  ) {
    return NextResponse.next();
  }

  const secret = process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET;
  const token = await getToken({ req: req, secret });
  if (!token) {
    const url = new URL("/signin", req.url);
    url.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api/auth|signin|signup|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
