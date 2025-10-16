import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token: unknown = body?.token;
    if (!token || typeof token !== "string") {
      return NextResponse.json({ error: "Token manquant" }, { status: 400 });
    }
    const res = NextResponse.json({ ok: true });
    res.cookies.set("session_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
    });
    return res;
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? "Erreur" }, { status: 500 });
  }
}