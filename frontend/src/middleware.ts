import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Autoriser chemins publics (login/register accessibles sans authentification)
  const publicPaths = new Set<string>(["/", "/login", "/register", "/favicon.ico"]);
  const isPublic =
    publicPaths.has(pathname) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/public") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/api/health");

  if (isPublic) return NextResponse.next();

  const userId = req.cookies.get("user_id")?.value;

  // Protéger toutes les pages non publiques
  if (!userId) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(.*)"],
};