"use client";
import { useState } from "react";
import type { LessonContentJson } from "@/types/api";
import { Api } from "@/lib/api";
import LessonRenderer from "./LessonRenderer";
import AnimatedSection from "./AnimatedSection";

type Props = {
  lessonId: string;
  initialContent: LessonContentJson | null;
};

export default function LessonContinueClient({ lessonId, initialContent }: Props) {
  const [content, setContent] = useState<LessonContentJson | null>(initialContent);
  const [loading, setLoading] = useState(false);
  const meta = (content as any)?.meta ?? {};
  const count = typeof meta?.continuations === "number" ? meta.continuations : 0;
  const max = typeof meta?.maxContinuations === "number" ? meta.maxContinuations : 10;

  const handleContinue = async () => {
    try {
      setLoading(true);
      const updated = await Api.continueLesson(lessonId);
      try {
        const obj = JSON.parse(updated.content);
        if (obj && typeof obj === "object" && Array.isArray(obj.sections)) {
          setContent(obj as LessonContentJson);
        }
      } catch (_) {}
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <section className="glass-card p-4 hover-raise">
          <div className="flex items-center justify-between">
            <div className="text-sm text-neutral-700">
              <span>Pages ajoutées: {count}/{max}</span>
              {(() => {
                const percent = Math.max(0, Math.min(100, Math.round((count / (max || 1)) * 100)));
                return (
                  <div className="mt-2 h-1.5 w-48 rounded-full bg-neutral-200">
                    <div
                      className="h-full rounded-full bg-neutral-900 transition-all duration-300"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                );
              })()}
            </div>
            <button
              onClick={handleContinue}
              disabled={loading || count >= max}
              className="inline-flex h-9 px-3 items-center justify-center rounded-md bg-neutral-900 text-white disabled:opacity-50"
            >
              {loading ? "Génération..." : "Continuer la leçon"}
            </button>
          </div>
        </section>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <section className="glass-card p-4 hover-raise">
          {content ? (
            <LessonRenderer content={content} />
          ) : (
            <div className="text-sm text-neutral-600">Aucun contenu JSON structuré pour l’instant.</div>
          )}
        </section>
      </AnimatedSection>
    </div>
  );
}