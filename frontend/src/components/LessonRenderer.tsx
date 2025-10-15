"use client";
import type { LessonContentJson } from "@/types/api";
import { useMemo, useState } from "react";
import AnimatedSection from "@/components/AnimatedSection";

type Props = { content: LessonContentJson };

export default function LessonRenderer({ content }: Props) {
  // Quiz state per lesson
  // Sanitize content structure defensively to avoid rendering objects as children
  const safeSections = Array.isArray(content.sections)
    ? content.sections
        .map((sec: any) => {
          if (!sec || typeof sec !== "object") return null;
          const t = sec.type;
          if (t === "text") {
            const text = typeof sec.text === "string" ? sec.text : JSON.stringify(sec.text ?? "");
            const heading = typeof sec.heading === "string" ? sec.heading : undefined;
            return { type: "text", heading, text } as const;
          }
          if (t === "list") {
            // Normaliser les items pour éviter l'affichage brut des objets JSON
            // Deux formes gérées:
            // - Texte simple: { kind: "text", text }
            // - Quiz inline: { kind: "quiz", question, options[], answer? }
            const items = Array.isArray(sec.items)
              ? sec.items
                  .map((it: any) => {
                    if (typeof it === "string") {
                      return { kind: "text", text: it } as const;
                    }
                    if (it && typeof it === "object") {
                      const question = typeof it.question === "string" ? it.question : undefined;
                      const text = typeof it.text === "string" ? it.text : undefined;
                      const options = Array.isArray(it.options)
                        ? it.options
                            .map((o: any) => (typeof o === "string" ? o : JSON.stringify(o ?? "")))
                            .filter((s: string) => s.length > 0)
                        : [];
                      const answer = typeof it.answer === "string" ? it.answer : undefined;
                      if ((question || text) && options.length > 0) {
                        return { kind: "quiz", question: question ?? (text as string), options, answer } as const;
                      }
                      // Objet non reconnu: fallback en texte JSON
                      return { kind: "text", text: JSON.stringify(it ?? "") } as const;
                    }
                    return null;
                  })
                  .filter(Boolean)
              : [];
            const heading = typeof sec.heading === "string" ? sec.heading : undefined;
            return { type: "list", heading, items } as const;
          }
          if (t === "code") {
            const code = typeof sec.code === "string" ? sec.code : JSON.stringify(sec.code ?? "");
            const heading = typeof sec.heading === "string" ? sec.heading : undefined;
            const language = typeof sec.language === "string" ? sec.language : "text";
            return { type: "code", heading, language, code } as const;
          }
          if (t === "callout") {
            const text = typeof sec.text === "string" ? sec.text : JSON.stringify(sec.text ?? "");
            const heading = typeof sec.heading === "string" ? sec.heading : undefined;
            const variant = ["tip", "warning", "note"].includes(sec.variant) ? sec.variant : "note";
            return { type: "callout", heading, variant, text } as const;
          }
          return null;
        })
        .filter(Boolean)
    : [];

  const quizRaw = Array.isArray((content as any).quiz) ? (content as any).quiz : [];
  const quiz = quizRaw
    .map((q: any) => {
      if (!q || typeof q !== "object") return null;
      const question = typeof q.question === "string" ? q.question : JSON.stringify(q.question ?? "");
      const options = Array.isArray(q.options)
        ? q.options.map((o: any) => (typeof o === "string" ? o : JSON.stringify(o ?? ""))).filter((s: string) => s.length > 0)
        : [];
      const answer = typeof q.answer === "string" ? q.answer : (options[0] ?? "");
      if (!question || options.length === 0) return null;
      return { question, options, answer } as { question: string; options: string[]; answer: string };
    })
    .filter(Boolean) as Array<{ question: string; options: string[]; answer: string }>;
  const [answers, setAnswers] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    quiz.forEach((q, i) => (init[String(i)] = null));
    return init;
  });
  const [validated, setValidated] = useState<Record<string, boolean>>({});
  const score = useMemo(() => {
    let correct = 0;
    let total = quiz.length;
    quiz.forEach((q, i) => {
      if (validated[String(i)] && answers[String(i)] === q.answer) correct++;
    });
    return { correct, total };
  }, [answers, validated, quiz]);
  return (
    <article className="prose prose-neutral max-w-none">
      {content.title && (
        <h2 className="text-xl font-semibold mb-4">{content.title}</h2>
      )}
      <div className="space-y-6">
        {safeSections.map((sec, idx) => {
          const key = `${sec.type}-${idx}`;
          switch (sec.type) {
            case "text":
              return (
                <AnimatedSection key={key} delay={80 * idx}>
                  <section className="glass-card p-4 hover-raise">
                    {sec.heading && (
                      <h3 className="text-lg font-medium mb-1">{sec.heading}</h3>
                    )}
                    <p className="text-neutral-800">{sec.text}</p>
                  </section>
                </AnimatedSection>
              );
            case "list":
              return (
                <AnimatedSection key={key} delay={80 * idx}>
                  <section className="glass-card p-4 hover-raise">
                    {sec.heading && (
                      <h3 className="text-lg font-medium mb-1">{sec.heading}</h3>
                    )}
                    <ul className="pl-6 space-y-2">
                      {sec.items.map((it: any, i: number) => {
                        const itemKey = `${key}-${i}`;
                        if (it?.kind === "quiz") {
                          return (
                            <li key={itemKey} className="text-neutral-800">
                              <div className="font-medium mb-1">{it.question}</div>
                              <ul className="list-disc pl-5 space-y-0.5">
                                {it.options.map((opt: string, oi: number) => (
                                  <li key={`${itemKey}-opt-${oi}`}>{opt}</li>
                                ))}
                              </ul>
                              {it.answer && (
                                <div className="mt-1 text-xs text-neutral-600">Réponse: <span className="font-medium">{it.answer}</span></div>
                              )}
                            </li>
                          );
                        }
                        // Texte simple
                        return (
                          <li key={itemKey} className="list-disc text-neutral-800">{it?.text ?? String(it)}</li>
                        );
                      })}
                    </ul>
                  </section>
                </AnimatedSection>
              );
            case "code":
              return (
                <AnimatedSection key={key} delay={80 * idx}>
                  <section className="glass-card p-4 hover-raise not-prose">
                    {sec.heading && (
                      <h3 className="text-lg font-medium mb-1">{sec.heading}</h3>
                    )}
                    <pre className="rounded-md bg-neutral-900 text-neutral-100 p-4 overflow-auto">
                      <code>{sec.code}</code>
                    </pre>
                  </section>
                </AnimatedSection>
              );
            case "callout":
              return (
                <AnimatedSection key={key} delay={80 * idx}>
                  <section className="glass-card p-4 hover-raise">
                    {sec.heading && (
                      <h3 className="text-lg font-medium mb-1">{sec.heading}</h3>
                    )}
                    <div className={
                      `rounded-md border p-3 transition-all duration-300 hover:shadow-sm ` +
                      (sec.variant === "warning"
                        ? "border-amber-300 bg-amber-50"
                        : sec.variant === "tip"
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-neutral-300 bg-neutral-50")
                    }>
                      <div className="text-sm">{sec.text}</div>
                    </div>
                  </section>
                </AnimatedSection>
              );
            default:
              return null;
          }
        })}
        {Array.isArray(content.references) && content.references.length > 0 && (
          <AnimatedSection delay={80 * safeSections.length}>
            <section className="glass-card p-4 hover-raise">
              <h3 className="text-lg font-medium mb-1">Références</h3>
              <ul className="list-disc pl-6 space-y-1">
                {content.references
                  .filter((r: any) => typeof r === "string")
                  .map((r: string, i: number) => (
                    <li key={`ref-${i}`} className="text-neutral-800">
                      <a href={r} className="underline hover:no-underline" target="_blank" rel="noreferrer">
                        {r}
                      </a>
                    </li>
                  ))}
              </ul>
            </section>
          </AnimatedSection>
        )}

        {quiz.length > 0 && (
          <AnimatedSection delay={100 * (safeSections.length + 1)}>
            <section className="glass-card p-4 hover-raise not-prose">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-medium">Quiz de la leçon</h3>
                <span className="text-xs text-neutral-600">Score: {score.correct}/{score.total}</span>
              </div>
              <ul className="space-y-4">
                {quiz.map((q, i) => {
                  const key = String(i);
                  const isValidated = !!validated[key];
                  const selected = answers[key];
                  const isCorrect = isValidated && selected === q.answer;
                  const cardClass = isValidated
                    ? isCorrect
                      ? "border-emerald-400 bg-emerald-50"
                      : "border-rose-400 bg-rose-50"
                    : "border-neutral-200 bg-white";
                  return (
                    <li key={key} className={`rounded-md border ${cardClass} p-3 transition-all duration-300 hover:shadow-sm`}>
                      <div className="font-medium mb-2">{q.question}</div>
                      <div className="space-y-2">
                        {q.options.map((opt) => (
                          <label key={opt} className="flex items-center gap-2 text-sm">
                            <input
                              type="radio"
                              name={`q-${key}`}
                              value={opt}
                              disabled={isValidated}
                              checked={selected === opt}
                              onChange={() => setAnswers((a) => ({ ...a, [key]: opt }))}
                              className="h-4 w-4 rounded-full border-neutral-300"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 flex items-center gap-2">
                        <button
                          onClick={() => setValidated((v) => ({ ...v, [key]: true }))}
                          disabled={!selected || isValidated}
                          className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-50"
                        >
                          Valider
                        </button>
                        {isValidated && (
                          <span className={`text-xs ${isCorrect ? "text-emerald-700" : "text-rose-700"}`}>
                            {isCorrect ? "Correct !" : `Incorrect. Réponse: ${q.answer}`}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </AnimatedSection>
        )}
      </div>
    </article>
  );
}