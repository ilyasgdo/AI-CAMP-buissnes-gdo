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
    pathname.startsWith("/api/health") ||
    // Laisser passer la gestion de session côté frontend pour pouvoir poser/retirer le cookie
    pathname.startsWith("/api/session/set") ||
    pathname.startsWith("/api/session/clear");

  if (isPublic) return NextResponse.next();

  const sessionToken = req.cookies.get("session_token")?.value;

  // Protéger toutes les pages non publiques
  if (!sessionToken) {
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