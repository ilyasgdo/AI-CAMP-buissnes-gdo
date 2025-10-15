import { Api } from "@/lib/api";
import AnimatedSection from "@/components/AnimatedSection";
import Link from "next/link";

export default async function CoursePage({ params }: { params: { id: string } }) {
  const course = await Api.getCourse(params.id);

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <header className="rounded-lg border bg-white p-4 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5">
          <h1 className="text-2xl font-semibold">{course.title}</h1>
          {Array.isArray(course.summary?.skills_gained) && (
            <p className="text-sm text-neutral-600 mt-1">
              Compétences: {course.summary!.skills_gained!.join(", ")}
            </p>
          )}
          {course.summary && (
            <div className="mt-3">
              <Link href={`/summary/${course.id}`} className="inline-flex h-9 px-3 items-center justify-center rounded-md border transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                Voir le résumé
              </Link>
            </div>
          )}
        </header>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <section className="rounded-lg border bg-white p-4">
          <h2 className="font-medium mb-3">Modules</h2>
          <ul className="space-y-3">
            {course.modules?.map((m, i) => (
              <AnimatedSection key={m.id} delay={80 * i}>
                <li className="flex items-center justify-between rounded-md border border-neutral-200 p-3 transition-all duration-300 hover:bg-neutral-50 hover:shadow-sm hover:-translate-y-0.5">
                  <div>
                    <div className="font-medium">{m.title}</div>
                    {m.description && (
                      <div className="text-sm text-neutral-600">{m.description}</div>
                    )}
                  </div>
                  <Link href={`/module/${m.id}`} className="inline-flex h-9 px-3 items-center justify-center rounded-md border transition-all duration-300 hover:shadow-sm hover:-translate-y-0.5">
                    Ouvrir
                  </Link>
                </li>
              </AnimatedSection>
            ))}
          </ul>
        </section>
      </AnimatedSection>

      {course.best_practices && (
        <AnimatedSection delay={240}>
          <section className="glass-card p-4 hover-raise">
            <h2 className="font-medium mb-2">Bonnes pratiques</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {course.best_practices.map((bp, i) => (
                <li key={i}>{bp}</li>
              ))}
            </ul>
          </section>
        </AnimatedSection>
      )}
    </div>
  );
}