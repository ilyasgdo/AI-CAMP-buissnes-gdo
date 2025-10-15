import { Api } from "@/lib/api";
import ModuleInteractive from "@/components/ModuleInteractive";
import LessonsClient from "@/components/LessonsClient";
import AnimatedSection from "@/components/AnimatedSection";

export default async function ModulePage({ params }: { params: { id: string } }) {
  const module = await Api.getModule(params.id);
  const objectives = module.objectives ?? [];
  const lessons = module.lessons ?? [];
  const quizzes = (module as any).quiz ?? [];

  return (
    <div className="space-y-6">
      <AnimatedSection>
        <section className="glass-card p-4 hover-raise transition-all duration-300">
          <h1 className="text-2xl font-semibold">{module.title}</h1>
          {module.description && (
            <p className="text-sm text-neutral-600 mt-1">{module.description}</p>
          )}
          {objectives.length > 0 && (
            <ul className="list-disc pl-5 text-sm text-neutral-700 mt-2">
              {objectives.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          )}
        </section>
      </AnimatedSection>

      <AnimatedSection delay={120}>
        <LessonsClient moduleId={module.id} initialLessons={lessons} />
      </AnimatedSection>

      <AnimatedSection delay={240}>
        <ModuleInteractive
          moduleId={module.id}
          quizzes={quizzes}
          chatbotContext={module.chatbot_context ?? null}
        />
      </AnimatedSection>
    </div>
  );
}