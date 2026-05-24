import { NextRequest, NextResponse } from "next/server";
import { decodeSession, SESSION_COOKIE } from "./lib/auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/worker")) {
    const raw = req.cookies.get(SESSION_COOKIE)?.value;
    const session = await decodeSession(raw);
    if (!session || session.role !== "worker") {
      const url = req.nextUrl.clone();
      url.pathname = "/sign-in";
      url.searchParams.set("next", pathname);
      url.searchParams.set("required", "worker");
      return NextResponse.redirect(url);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/worker/:path*"],
};
