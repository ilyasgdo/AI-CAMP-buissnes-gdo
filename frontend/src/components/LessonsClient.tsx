"use client";

import { Api } from "@/lib/api";
import type { ModuleDetail } from "@/types/api";
import { useMemo, useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";

type Props = {
  moduleId: string;
  initialLessons: ModuleDetail["lessons"];
};

export default function LessonsClient({ moduleId, initialLessons }: Props) {
  const [lessons, setLessons] = useState(initialLessons ?? []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [continueLoadingId, setContinueLoadingId] = useState<string | null>(null);

  // Compute a readable preview from lesson content (JSON or plain text)
  const makePreview = (raw: string): string => {
    try {
      const obj = JSON.parse(raw);
      if (obj && typeof obj === "object") {
        // Prefer first text section or heading
        const sections = (obj.sections ?? []) as Array<any>;
        for (const s of sections) {
          if (s?.type === "text" && typeof s?.text === "string") {
            const base = s.heading ? `${s.heading} — ${s.text}` : s.text;
            return base.length > 220 ? base.slice(0, 217) + "…" : base;
          }
        }
        // Fallback: join first list items
        const list = sections.find((s) => s?.type === "list" && Array.isArray(s?.items));
        if (list) {
          const head = list.heading ? list.heading + ": " : "";
          const txt = (list.items as string[]).slice(0, 3).join(" • ");
          const base = `${head}${txt}`;
          return base.length > 220 ? base.slice(0, 217) + "…" : base;
        }
      }
    } catch {}
    // Plain text fallback
    return typeof raw === "string" && raw.length > 220 ? raw.slice(0, 217) + "…" : raw;
  };

  async function generateMore() {
    setLoading(true);
    setError(null);
    try {
      const res = await Api.generateLessons(moduleId);
      if (Array.isArray(res.lessons)) {
        setLessons((prev) => [...prev, ...res.lessons]);
      }
    } catch (e: any) {
      setError(e?.message ?? "Erreur inattendue");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-lg border bg-white p-4">
      <AnimatedSection>
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-medium">Leçons</h2>
        </div>
      </AnimatedSection>
      {error && <div className="text-xs text-rose-700 mb-2">{error}</div>}
      {lessons.length > 0 ? (
        <ul className="space-y-3">
          {lessons.map((l, i) => (
            <AnimatedSection key={l.id ?? i} delay={80 * i}>
              <li className="rounded-md border border-neutral-200 p-3 transition-all duration-300 hover:bg-neutral-50 hover:shadow-sm hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <a href={l.id ? `/lesson/${l.id}` : undefined} className="flex-1 block">
                    <div className="font-medium">{l.title}</div>
                    <div className="text-sm text-neutral-700 whitespace-pre-wrap">{makePreview(l.content)}</div>
                  </a>
                  {l.id && (
                    <button
                      className="inline-flex h-8 px-3 items-center justify-center rounded-md bg-neutral-900 text-white text-sm disabled:opacity-50"
                      disabled={continueLoadingId === l.id}
                      onClick={async (e) => {
                        e.preventDefault();
                        try {
                          setContinueLoadingId(l.id!);
                          const updated = await Api.continueLesson(l.id!);
                          setLessons((prev) => prev.map((it) => (it.id === l.id ? { ...it, content: updated.content } : it)));
                        } catch (e: any) {
                          setError(e?.message ?? "Erreur inattendue");
                        } finally {
                          setContinueLoadingId(null);
                        }
                      }}
                    >
                      {continueLoadingId === l.id ? "…" : "Continuer"}
                    </button>
                  )}
                </div>
              </li>
            </AnimatedSection>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-neutral-600">Aucune leçon disponible.</p>
      )}
    </section>
  );
}