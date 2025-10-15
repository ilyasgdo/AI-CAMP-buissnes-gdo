"use client";

import { Api } from "@/lib/api";
import type { ModuleDetail } from "@/types/api";
import { useMemo, useState } from "react";

type Props = {
  moduleId: string;
  quizzes: ModuleDetail["quiz"];
  chatbotContext?: string | null;
};

export default function ModuleInteractive({ moduleId, quizzes, chatbotContext }: Props) {
  // Quiz state
  const [answers, setAnswers] = useState<Record<string, string | null>>(() => {
    const init: Record<string, string | null> = {};
    for (const q of quizzes ?? []) init[q.id ?? String(q.orderIndex ?? Math.random())] = null;
    return init;
  });
  const [validated, setValidated] = useState<Record<string, boolean>>({});

  const score = useMemo(() => {
    let correct = 0;
    let total = quizzes?.length ?? 0;
    for (const q of quizzes ?? []) {
      const key = q.id ?? String(q.orderIndex ?? "?");
      if (validated[key] && answers[key] === q.answer) correct++;
    }
    return { correct, total };
  }, [answers, validated, quizzes]);

  // Chat state
  const [messages, setMessages] = useState<Array<{ role: "assistant" | "user"; content: string }>>(() => {
    const intro = chatbotContext
      ? "Tu peux poser des questions sur ce module."
      : "Le chatbot n’a pas de contexte disponible pour ce module.";
    return [{ role: "assistant", content: intro }];
  });
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const chatDisabled = !chatbotContext || chatbotContext.length === 0;

  async function sendMessage() {
    const text = input.trim();
    if (!text) return;
    setMessages((m) => [...m, { role: "user", content: text }]);
    setInput("");
    if (chatDisabled) return;
    setSending(true);
    try {
      const { reply } = await Api.chatModule(moduleId, text);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err: any) {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: `Erreur: ${err?.message ?? "imprévue"}` },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Quiz */}
      <section className="glass-card p-4 hover-raise">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-medium">Quiz interactif</h2>
          {quizzes?.length ? (
            <span className="text-xs text-neutral-600">Score: {score.correct}/{score.total}</span>
          ) : null}
        </div>
        {quizzes?.length ? (
          <ul className="space-y-4">
            {quizzes.map((q, i) => {
              const key = q.id ?? String(q.orderIndex ?? i);
              const isValidated = !!validated[key];
              const selected = answers[key];
              const isCorrect = isValidated && selected === q.answer;
              const cardClass = isValidated
                ? isCorrect
                  ? "border-emerald-400 bg-emerald-50/70 dark:bg-emerald-900/20"
                  : "border-rose-400 bg-rose-50/70 dark:bg-rose-900/20"
                : "border-neutral-200 bg-white dark:bg-neutral-900";
              return (
                <li key={key} className={`rounded-md border ${cardClass} p-3`}>
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
                      className="px-3 py-1.5 text-sm rounded-md bg-neutral-900 text-white disabled:opacity-50 transition-transform duration-300 hover:-translate-y-0.5"
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
        ) : (
          <p className="text-sm text-neutral-600">Aucun quiz disponible.</p>
        )}
      </section>

      {/* Chatbot */}
      <section className="glass-card p-4 hover-raise">
        <h2 className="font-medium mb-3">Chatbot du module</h2>
        <div className="h-64 overflow-y-auto space-y-3 pr-1">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm transition-all duration-300 ${
                m.role === "assistant"
                  ? "bg-neutral-100 text-neutral-800 dark:bg-neutral-800 dark:text-neutral-100"
                  : "bg-blue-600 text-white ml-auto"
              }`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="text-xs text-neutral-500">Le bot écrit…</div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendMessage();
            }}
            placeholder={chatDisabled ? "Contexte indisponible" : "Pose ta question…"}
            disabled={sending}
            className="flex-1 rounded-md border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            onClick={sendMessage}
            disabled={sending || chatDisabled}
            className="px-3 py-2 rounded-md text-sm bg-neutral-900 text-white disabled:opacity-50 transition-transform duration-300 hover:-translate-y-0.5"
          >
            Envoyer
          </button>
        </div>
        {chatbotContext && (
          <details className="mt-3 text-xs text-neutral-600">
            <summary className="cursor-pointer">Voir le contexte</summary>
            <pre className="mt-2 bg-neutral-50 dark:bg-neutral-900 p-3 rounded-md overflow-auto">{chatbotContext}</pre>
          </details>
        )}
      </section>
    </div>
  );
}