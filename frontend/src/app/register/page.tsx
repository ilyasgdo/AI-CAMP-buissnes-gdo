"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Api } from "@/lib/api";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Email et mot de passe requis");
      return;
    }
    setLoading(true);
    try {
      const res = await Api.register(email, password);
      const userId = res.user_id;
      localStorage.setItem("user_id", userId);
      // Stocker l'email pour affichage sur le Dashboard
      try { localStorage.setItem("user_email", email); } catch (_) {}
      document.cookie = `user_id=${userId}; path=/;`;
      toast.success("Compte créé ! Complétez votre profil.");
      router.push("/profile");
    } catch (err: any) {
      const msg = err?.message ?? "Erreur d’inscription";
      if (msg.includes("409") || msg.toLowerCase().includes("déjà utilisé") || msg.toLowerCase().includes("already")) {
        toast.error("Email déjà utilisé. Veuillez vous connecter.");
        // Pré-remplir l’email sur la page de connexion
        try { localStorage.setItem("prefill_email", email); } catch (_) {}
        router.push("/login?reason=already_exists");
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="max-w-sm mx-auto space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-2xl font-semibold">Créer un compte</h1>
          <p className="text-sm text-neutral-600">Commencez votre parcours personnalisé en quelques secondes.</p>
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
            {loading ? "Création en cours..." : "S’inscrire"}
          </Button>
        </form>
        <p className="text-sm text-center">
          Déjà un compte ? <Link href="/login" className="underline">Se connecter</Link>
        </p>
      </div>
    </div>
  );
}