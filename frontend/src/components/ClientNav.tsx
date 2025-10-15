"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { UserCircle2, LogOut, LogIn, UserPlus } from "lucide-react";

export default function ClientNav() {
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const uid = localStorage.getItem("user_id");
      setUserId(uid);
    } catch (_) {}
  }, []);

  const logout = () => {
    try {
      localStorage.removeItem("user_id");
      localStorage.removeItem("course_id");
      document.cookie = "user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    } catch (_) {}
    // Redirection douce vers l’accueil
    window.location.href = "/";
  };

  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link href="/profile" className="hover:underline hidden sm:inline-block">
        Profil
      </Link>
      <Link href="/dashboard" className="hover:underline hidden sm:inline-block">
        Dashboard
      </Link>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <UserCircle2 className="size-4" />
            {userId ? "Mon compte" : "Compte"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          {userId ? (
            <>
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <UserCircle2 className="size-4" /> Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={logout} className="flex items-center gap-2">
                <LogOut className="size-4" /> Déconnexion
              </DropdownMenuItem>
            </>
          ) : (
            <>
              <DropdownMenuItem asChild>
                <Link href="/login" className="flex items-center gap-2">
                  <LogIn className="size-4" /> Se connecter
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/register" className="flex items-center gap-2">
                  <UserPlus className="size-4" /> S’inscrire
                </Link>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </nav>
  );
}