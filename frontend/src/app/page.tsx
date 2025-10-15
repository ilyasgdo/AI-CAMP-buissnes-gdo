"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardTitle } from "@/components/ui/card";
import { LogIn, UserPlus, LogOut, Gauge, Rocket, BookOpen } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

export default function Home() {
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
    window.location.href = "/";
  };

  return (
    <section className="relative min-h-[70vh] grid place-items-center">
      {/* Fond premium */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-72 w-72 -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-200 to-purple-200 blur-3xl opacity-60" />
        <div className="absolute right-[10%] bottom-[-10%] h-64 w-64 rounded-full bg-gradient-to-br from-amber-200 to-pink-200 blur-3xl opacity-50" />
      </div>
      <AnimatedSection>
      <div className="mx-auto max-w-5xl text-center space-y-7">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600">
            Construisez votre parcours de formation IA
          </span>
        </h1>
        <p className="text-neutral-700 text-lg max-w-2xl mx-auto">
          Définissez votre profil, lancez la génération et explorez vos modules, leçons et quiz
          créés par l’orchestrateur AI.
        </p>

        {/* CTA principaux */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/profile">
            <Button className="h-11 px-5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md">Configurer mon profil</Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="outline" className="h-11 px-5 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md">Voir le dashboard</Button>
          </Link>
          {userId ? (
            <Button variant="destructive" className="h-11 px-5 gap-2 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md" onClick={logout}>
              <LogOut className="size-4" /> Déconnexion
            </Button>
          ) : (
            <>
              <Link href="/login">
                <Button className="h-11 px-5 gap-2 relative overflow-hidden transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-900 text-white">
                  <span className="absolute inset-0 opacity-0 hover:opacity-10 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.6),transparent_40%)] transition-opacity" />
                  <LogIn className="size-4" /> Se connecter
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="secondary" className="h-11 px-5 gap-2 transition-transform duration-300 hover:-translate-y-0.5 hover:shadow-md">
                  <UserPlus className="size-4" /> S’inscrire
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Valeur et fonctionnalités */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6">
          <Card className="group glass-card p-5 text-left transition-all duration-300 hover-raise">
            <CardTitle className="flex items-center gap-2"><Gauge className="size-4 group-hover:animate-float-slow" /> Personnalisation</CardTitle>
            <CardDescription>
              Un parcours adapté à votre secteur, niveau et outils utilisés.
            </CardDescription>
          </Card>
          <Card className="group glass-card p-5 text-left transition-all duration-300 hover-raise">
            <CardTitle className="flex items-center gap-2"><Rocket className="size-4 group-hover:animate-float-slow" /> Génération IA</CardTitle>
            <CardDescription>
              Modules, leçons et quiz générés et enrichis automatiquement.
            </CardDescription>
          </Card>
          <Card className="group glass-card p-5 text-left transition-all duration-300 hover-raise">
            <CardTitle className="flex items-center gap-2"><BookOpen className="size-4 group-hover:animate-float-slow" /> Interactif</CardTitle>
            <CardDescription>
              Quiz intégrés, chatbot contextuel, références et exemples concrets.
            </CardDescription>
          </Card>
        </div>
      </div>
      </AnimatedSection>
    </section>
  );
}