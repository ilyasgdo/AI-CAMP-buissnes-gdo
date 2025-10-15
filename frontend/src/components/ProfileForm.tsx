"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Api } from "@/lib/api";

const schema = z.object({
  job: z.string().min(2, "Indiquez votre métier"),
  sector: z.string().min(2, "Indiquez votre secteur"),
  ai_level: z.string().min(1, "Niveau requis"),
  tools_used: z.string().optional(),
  work_style: z.string().optional(),
  // Champs avancés
  seniority: z.string().optional(),
  experience_years: z.coerce.number().int().min(0).max(60).optional(),
  company_size: z.string().optional(),
  preferred_models: z.string().optional(),
  learning_goals: z.string().optional(),
  availability_hours_per_week: z.coerce.number().int().min(0).max(168).optional(),
  timezone: z.string().optional(),
  language: z.string().optional(),
  industries: z.string().optional(),
  compliance_needs: z.string().optional(),
  data_privacy_notes: z.string().optional(),
  hardware_constraints: z.string().optional(),
  preferred_workflows: z.string().optional(),
});

export function ProfileForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: z.infer<typeof schema>) => {
    const existingUserId = typeof window !== "undefined" ? localStorage.getItem("user_id") : null;
    const toolsList = values.tools_used
      ? values.tools_used.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    const payload = {
      user_id: existingUserId ?? undefined,
      job: values.job,
      sector: values.sector,
      ai_level: values.ai_level,
      // Pack extras dans tools_used pour persistance JSON côté backend
      tools_used: {
        list: toolsList,
        extras: {
          seniority: values.seniority,
          experience_years: values.experience_years,
          company_size: values.company_size,
          preferred_models: values.preferred_models,
          learning_goals: values.learning_goals,
          availability_hours_per_week: values.availability_hours_per_week,
          timezone: values.timezone,
          language: values.language,
          industries: values.industries,
          compliance_needs: values.compliance_needs,
          data_privacy_notes: values.data_privacy_notes,
          hardware_constraints: values.hardware_constraints,
          preferred_workflows: values.preferred_workflows,
        },
      },
      work_style: values.work_style ?? undefined,
    };
    try {
      const res = await Api.postProfile(payload);
      // Persistance côté client
      localStorage.setItem("user_id", res.user_id);
      // Cookie pour le middleware
      document.cookie = `user_id=${res.user_id}; Path=/; Max-Age=31536000; SameSite=Lax`;

      toast.success("Profil enregistré. Génération du parcours en cours...");

      try {
        const pipeline = await Api.runPipeline(res.user_id);
        if (pipeline?.course_id) {
          localStorage.setItem("course_id", pipeline.course_id);
          toast.success("Modules personnalisés créés !");
          router.push(`/course/${pipeline.course_id}`);
          return;
        }
      } catch (err: any) {
        // En cas d’échec du pipeline, on redirige vers le dashboard
        toast.error(err?.message ?? "Le pipeline a échoué, vous pouvez réessayer depuis le tableau de bord.");
        router.push("/dashboard");
        return;
      }

      // Si la réponse pipeline n’a pas de course_id, fallback dashboard
      router.push("/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors de l’enregistrement");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Section 1: Rôle & Contexte */}
      <div className="glass-card p-5 hover-raise">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Rôle & Contexte</h2>
          <span className="text-xs text-neutral-500">Profil de base</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="job">Métier</Label>
            <Input id="job" placeholder="QA Analyst, Développeur..." {...register("job")} />
            {errors.job && (
              <p className="text-xs text-red-600 mt-1">{errors.job.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="sector">Secteur</Label>
            <Input id="sector" placeholder="Santé, Fintech, Éducation..." {...register("sector")} />
            {errors.sector && (
              <p className="text-xs text-red-600 mt-1">{errors.sector.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="ai_level">Niveau IA</Label>
            <Input id="ai_level" placeholder="Débutant, Intermédiaire, Avancé" {...register("ai_level")} />
            {errors.ai_level && (
              <p className="text-xs text-red-600 mt-1">{errors.ai_level.message}</p>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="seniority">Seniority</Label>
              <Input id="seniority" placeholder="Junior, Confirmé, Senior" {...register("seniority")} />
            </div>
            <div>
              <Label htmlFor="experience_years">Expérience (années)</Label>
              <Input id="experience_years" type="number" min={0} max={60} {...register("experience_years")} />
            </div>
          </div>
        </div>
      </div>

      {/* Section 2: Technologies & Outils */}
      <div className="glass-card p-5 hover-raise">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Technologies & Outils</h2>
          <span className="text-xs text-neutral-500">Stack et préférences</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="tools_used">Outils IA utilisés (séparés par des virgules)</Label>
            <Input id="tools_used" placeholder="Ollama, Rasa, LangChain..." {...register("tools_used")} />
          </div>
          <div>
            <Label htmlFor="preferred_models">Modèles préférés</Label>
            <Input id="preferred_models" placeholder="GPT-4o, Gemini 1.5, Llama3..." {...register("preferred_models")} />
          </div>
          <div>
            <Label htmlFor="company_size">Taille d’entreprise</Label>
            <Input id="company_size" placeholder="Startup, PME, Entreprise, Groupe" {...register("company_size")} />
          </div>
          <div>
            <Label htmlFor="hardware_constraints">Contraintes matérielles</Label>
            <Input id="hardware_constraints" placeholder="GPU, RAM, devices, etc." {...register("hardware_constraints")} />
          </div>
        </div>
      </div>

      {/* Section 3: Objectifs & Conformité */}
      <div className="glass-card p-5 hover-raise">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Objectifs & Conformité</h2>
          <span className="text-xs text-neutral-500">Cadre de mise en œuvre</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="learning_goals">Objectifs d’apprentissage</Label>
            <Textarea id="learning_goals" placeholder="Compétences à acquérir, axes de progression..." {...register("learning_goals")} />
          </div>
          <div>
            <Label htmlFor="work_style">Style de travail / Contraintes</Label>
            <Textarea id="work_style" placeholder="Télétravail, horaires, préférences d’apprentissage..." {...register("work_style")} />
          </div>
          <div>
            <Label htmlFor="compliance_needs">Conformité</Label>
            <Textarea id="compliance_needs" placeholder="RGPD, HIPAA, règles internes..." {...register("compliance_needs")} />
          </div>
          <div>
            <Label htmlFor="data_privacy_notes">Confidentialité des données</Label>
            <Textarea id="data_privacy_notes" placeholder="Sensibilité, protection, anonymisation..." {...register("data_privacy_notes")} />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
          <div>
            <Label htmlFor="availability_hours_per_week">Disponibilité (h/sem)</Label>
            <Input id="availability_hours_per_week" type="number" min={0} max={168} {...register("availability_hours_per_week")} />
          </div>
          <div>
            <Label htmlFor="timezone">Fuseau horaire</Label>
            <Input id="timezone" placeholder="Europe/Paris" {...register("timezone")} />
          </div>
          <div>
            <Label htmlFor="language">Langue</Label>
            <Input id="language" placeholder="fr, en..." {...register("language")} />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isSubmitting} className="transition-transform duration-300 hover:-translate-y-0.5">
          {isSubmitting ? "Enregistrement..." : "Enregistrer et continuer"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/dashboard")} className="transition-transform duration-300 hover:-translate-y-0.5">Passer</Button>
      </div>
    </form>
  );
}