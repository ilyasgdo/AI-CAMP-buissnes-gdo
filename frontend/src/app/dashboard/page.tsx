"use client";

import { useEffect, useState } from "react";
import { Api } from "@/lib/api";
import type { CourseAggregate, ToolsPractices } from "@/types/api";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import AnimatedSection from "@/components/AnimatedSection";

export default function DashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseAggregate | null>(null);
  const [tp, setTp] = useState<ToolsPractices | null>(null);
  const [userCourses, setUserCourses] = useState<Array<{ id: string; title: string; createdAt: string; modulesCount: number }>>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const uid = localStorage.getItem("user_id");
    setUserId(uid);
    try {
      const mail = localStorage.getItem("user_email");
      setUserEmail(mail);
    } catch (_) {}
    // Optionnel: charger dernier course_id si stocké
    const cid = localStorage.getItem("course_id");
    if (cid) setCourseId(cid);
  }, []);

  useEffect(() => {
    const fetchTp = async () => {
      if (!userId) return;
      try {
        const res = await Api.toolsPractices(userId);
        setTp(res);
      } catch (e: any) {
        // silencieux
      }
    };
    fetchTp();
  }, [userId]);

  useEffect(() => {
    const fetchUserCourses = async () => {
      if (!userId) return;
      try {
        const list = await Api.getUserCourses(userId);
        setUserCourses(list);
      } catch (e: any) {
        // silencieux
      }
    };
    fetchUserCourses();
  }, [userId]);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      try {
        const c = await Api.getCourse(courseId);
        setCourse(c);
      } catch (e: any) {
        toast.error(e?.message ?? "Erreur de chargement du cours");
      }
    };
    fetchCourse();
  }, [courseId]);

  const runPipeline = async () => {
    if (!userId) {
      toast.error("Veuillez d’abord enregistrer votre profil");
      return;
    }
    setLoading(true);
    try {
      const res = await Api.runPipeline(userId);
      setCourseId(res.course_id);
      localStorage.setItem("course_id", res.course_id);
      toast.success("Pipeline exécuté !");
    } catch (e: any) {
      toast.error(e?.message ?? "Erreur lors du pipeline");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container space-y-6">
      <AnimatedSection>
        <div className="flex items-center justify-between glass-card p-4 hover-raise">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            {userEmail && (
              <div className="text-sm text-neutral-600 mt-0.5">Connecté: {userEmail}</div>
            )}
          </div>
          <div className="flex gap-2">
            <Button onClick={runPipeline} disabled={loading} className="transition-transform duration-300 hover:-translate-y-0.5">
              {loading ? "Génération en cours..." : "Lancer la génération (pipeline)"}
            </Button>
            {courseId && (
              <Link href={`/course/${courseId}`} className="inline-flex h-10 px-4 items-center justify-center rounded-md border transition-all duration-300 hover:-translate-y-0.5">
                Détails du cours
              </Link>
            )}
          </div>
        </div>
      </AnimatedSection>

      {tp && (
        <section className="grid md:grid-cols-2 gap-4">
          <AnimatedSection>
            <div className="glass-card p-4 hover-raise">
              <h2 className="font-medium mb-2">Outils IA suggérés</h2>
              <ul className="space-y-2 text-sm">
                {tp.ai_tools?.map((t, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border border-neutral-200 p-2 transition-all duration-300 hover:bg-neutral-50 hover:-translate-y-0.5">
                    <span>{t.name}</span>
                    <span className="text-neutral-500">{t.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
          <AnimatedSection delay={120}>
            <div className="glass-card p-4 hover-raise">
              <h2 className="font-medium mb-2">Bonnes pratiques</h2>
              <ul className="list-disc pl-5 text-sm space-y-1">
                {tp.best_practices?.map((bp, i) => (
                  <li key={i}>{bp}</li>
                ))}
              </ul>
            </div>
          </AnimatedSection>
        </section>
      )}

      {course && (
        <AnimatedSection>
          <section className="glass-card p-4 hover-raise">
            <h2 className="font-medium mb-2">Modules générés</h2>
            <ul className="space-y-3">
              {course.modules?.map((m, i) => (
                <AnimatedSection key={m.id} delay={80 * i}>
                  <li className="flex items-center justify-between rounded-md border border-neutral-200 p-3 transition-all duration-300 hover:bg-neutral-50 hover:-translate-y-0.5">
                    <div>
                      <div className="font-medium">{m.title}</div>
                      {m.description && (
                        <div className="text-sm text-neutral-600">{m.description}</div>
                      )}
                    </div>
                    <Link href={`/module/${m.id}`} className="inline-flex h-9 px-3 items-center justify-center rounded-md border transition-all duration-300 hover:-translate-y-0.5">
                      Ouvrir
                    </Link>
                  </li>
                </AnimatedSection>
              ))}
            </ul>
          </section>
        </AnimatedSection>
      )}

      {userCourses.length > 0 && (
        <AnimatedSection>
          <section className="glass-card p-4 hover-raise">
            <h2 className="font-medium mb-2">Mes parcours</h2>
            <ul className="space-y-3">
              {userCourses.map((c, i) => (
                <AnimatedSection key={c.id} delay={80 * i}>
                  <li className="flex items-center justify-between rounded-md border border-neutral-200 p-3 transition-all duration-300 hover:bg-neutral-50 hover:-translate-y-0.5">
                    <div>
                      <div className="font-medium">{c.title}</div>
                      <div className="text-sm text-neutral-600">
                        {new Date(c.createdAt).toLocaleString()} — {c.modulesCount} modules
                      </div>
                    </div>
                    <Link href={`/course/${c.id}`} className="inline-flex h-9 px-3 items-center justify-center rounded-md border transition-all duration-300 hover:-translate-y-0.5">
                      Ouvrir
                    </Link>
                  </li>
                </AnimatedSection>
              ))}
            </ul>
          </section>
        </AnimatedSection>
      )}
    </div>
  );
}