"use client";

import { ProfileForm } from "@/components/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="page-container max-w-3xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-300">
            Mon profil
          </span>
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Enrichissez votre profil pour une personnalisation digne d’une grande entreprise.
        </p>
      </div>
      <ProfileForm />
    </div>
  );
}