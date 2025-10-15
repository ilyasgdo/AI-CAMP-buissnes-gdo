import { Api } from "@/lib/api";
import LessonRenderer from "@/components/LessonRenderer";
import LessonContinueClient from "@/components/LessonContinueClient";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";
import type { LessonContentJson } from "@/types/api";

export default async function LessonPage({ params }: { params: any }) {
  const awaitedParams = await params;
  const id: string = awaitedParams?.id as string;
  const base = await Api.getLesson(id);

  // Try to parse existing content as JSON first
  let parsed: LessonContentJson | null = null;
  try {
    const obj = JSON.parse(base.content);
    if (obj && typeof obj === "object" && obj.sections) {
      parsed = obj as LessonContentJson;
    }
  } catch (_) {}

  // If not JSON (or too short), develop once and persist
  if (!parsed || (typeof base.content === "string" && base.content.length < 120)) {
    try {
      const developed = await Api.developLesson(id);
      try {
        const obj = JSON.parse(developed.content);
        if (obj && typeof obj === "object" && obj.sections) {
          parsed = obj as LessonContentJson;
        }
      } catch (_) {}
    } catch (_) {}
  }

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <section className="glass-card p-4 hover-raise">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-semibold">{base.title}</h1>
              {base.module && (
                <p className="text-sm text-neutral-600 mt-1">
                  Module: <a href={`/module/${base.module.id}`} className="underline hover:no-underline">{base.module.title}</a>
                </p>
              )}
            </div>
            {base.module?.id && (
              <Link href={`/module/${base.module.id}`} className="inline-flex h-9 px-3 items-center justify-center rounded-md border">
                Retour au module
              </Link>
            )}
          </div>
        </section>
      </AnimatedSection>

      {parsed ? (
        <LessonContinueClient lessonId={id} initialContent={parsed} />
      ) : (
        <AnimatedSection delay={120}>
          <section className="glass-card p-4 hover-raise">
            <div className="prose prose-neutral max-w-none whitespace-pre-wrap">
              {base.content}
            </div>
          </section>
        </AnimatedSection>
      )}
    </div>
  );
}