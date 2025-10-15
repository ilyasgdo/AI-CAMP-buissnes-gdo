"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Préremplissage de l’email après une erreur 409 (inscription)
  useEffect(() => {
    try {
      const prefill = localStorage.getItem("prefill_email");
      if (prefill) {
        setEmail(prefill);
        localStorage.removeItem("prefill_email");
      }
    } catch (_) {}
  }, []);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email et mot de passe requis");
      return;
    }
    setLoading(true);
    try {
      const res = await Api.login(email, password);
      const userId = res.user_id;
      localStorage.setItem("user_id", userId);
      // Stocker l'email pour affichage sur le Dashboard
      try { localStorage.setItem("user_email", email); } catch (_) {}
      document.cookie = `user_id=${userId}; path=/;`;
      toast.success("Connexion réussie ! Complétez votre profil.");
      router.push("/profile");
    } catch (err: any) {
      toast.error(err?.message ?? "Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Se connecter</h1>
          <p className="text-sm text-neutral-600">Accédez à votre parcours et continuez l’apprentissage.</p>
        </div>
        <form onSubmit={onSubmit} className="glass-card p-5 hover-raise space-y-3">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="password">Mot de passe</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <Button type="submit" disabled={loading} className="transition-transform duration-300 hover:-translate-y-0.5">
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>
        <p className="text-sm text-center">
          Pas de compte ? <Link href="/register" className="underline">Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}