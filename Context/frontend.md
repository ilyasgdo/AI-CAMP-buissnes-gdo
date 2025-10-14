# Frontend — Documentation Technique v1 (Next.js + Tailwind + shadcn/ui)

Date: 2025-10-14
Version: v1 (sans RAG)

## 1. Aperçu
- Objectif: UI pour saisie du profil, déclenchement du pipeline IA, exploration du cours, lecture des leçons/quiz et chatbot par module.
- Stack: Next.js (App Router), TailwindCSS, shadcn/ui, TypeScript.
- Principe: consommer des APIs JSON du backend, typées, robustes.

## 2. Routage & Pages (App Router)
- `app/`
  - `page.tsx` — landing simple
  - `profile/page.tsx` — formulaire profil
  - `dashboard/page.tsx` — vue cours et modules
  - `course/[id]/page.tsx` — agrégat course
  - `module/[id]/page.tsx` — leçons, quiz, chatbot
  - `api/` (si besoin de proxys; sinon appeler le backend direct)

## 3. Types & Contrats API
```ts
// src/types/api.ts
export type UserProfile = {
  user_id: string;
  job: string;
  sector: string;
  ai_level: string;
  tools_used: string[];
  work_style: string;
};

export type AiToolsPractices = {
  ai_tools: { name: string; category: string; use_case: string }[];
  best_practices: string[];
};

export type CourseOverview = {
  course_id: string;
  title: string;
  modules: { title: string; description: string; objectives: string[] }[];
};

export type ModuleDetail = {
  module_id: string;
  title: string;
  lessons: { title: string; content: string }[];
  quiz: { question: string; options: string[]; answer: string }[];
  chatbot_context: string;
};

export type CourseAggregate = {
  id: string;
  title: string;
  rawAiTools: any;
  rawBestPractices: any;
  summary?: any;
  modules: {
    id: string;
    title: string;
    description: string;
    objectives: any;
    orderIndex: number;
  }[];
};
```

## 4. API Client
```ts
// src/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  if (!res.ok) throw new Error(`API Error ${res.status}`);
  return res.json();
}

export const Api = {
  createProfile: (data: any) => http<UserProfile>('/profile', { method: 'POST', body: JSON.stringify(data) }),
  toolsPractices: (user_id: string) => http<AiToolsPractices>('/ai/tools-practices', { method: 'POST', body: JSON.stringify({ user_id }) }),
  generateCourse: (user_id: string, ai_tools: any) => http<CourseOverview>('/ai/generate-course', { method: 'POST', body: JSON.stringify({ user_id, ai_tools }) }),
  generateModule: (course_id: string, module: any, module_index_or_id: number | string) => http<ModuleDetail>('/ai/generate-module', { method: 'POST', body: JSON.stringify({ course_id, module, module_index_or_id }) }),
  generateSummary: (course_id: string) => http<{ summary: any; skills_gained: string[]; certificate_text: string }>('/ai/generate-summary', { method: 'POST', body: JSON.stringify({ course_id }) }),
  getCourse: (id: string) => http<CourseAggregate>(`/course/${id}`),
  getModule: (id: string) => http<ModuleDetail>(`/module/${id}`),
  chatModule: (id: string, message: string) => http<{ reply: string }>(`/chat/module/${id}`, { method: 'POST', body: JSON.stringify({ message }) }),
};
```

## 5. UI Components (shadcn/ui)
- Boutons, Inputs, Cards, Tabs, Accordions pour structurer les modules/leçons.
- Composants clés:
  - `ProfileForm` (react-hook-form + zod)
  - `ModuleCard` (titre, objectifs, CTA détailler)
  - `LessonItem` (titre + contenu)
  - `QuizItem` (question + options)
  - `ChatBox` (messages + input)

### Exemple `ProfileForm`
```tsx
// app/profile/ProfileForm.tsx
'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  job: z.string().min(2),
  sector: z.string().min(2),
  ai_level: z.string().min(1),
  tools_used: z.string().transform(s => s.split(',').map(x => x.trim()).filter(Boolean)),
  work_style: z.string().min(2),
});

type FormData = z.infer<typeof schema>;

export default function ProfileForm({ onCreated }: { onCreated: (profile: any) => void }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    const profile = await Api.createProfile(data);
    onCreated(profile);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <input className="input" placeholder="Métier" {...register('job')} />
      {errors.job && <p className="text-red-600">{errors.job.message}</p>}
      <input className="input" placeholder="Secteur" {...register('sector')} />
      <input className="input" placeholder="Niveau IA" {...register('ai_level')} />
      <input className="input" placeholder="Outils (séparés par des virgules)" {...register('tools_used')} />
      <input className="input" placeholder="Style de travail" {...register('work_style')} />
      <button className="btn" disabled={isSubmitting}>Créer le profil</button>
    </form>
  );
}
```

## 6. Flux UI & Intégration
- Profil créé → appel IA #1 (tools/practices) → affichage recommandations.
- CTA “Générer parcours” → IA #2 → afficher liste des modules.
- Pour chaque module → IA #3 → page détail (leçons + quiz + chatbot).
- Fin du cours → IA #4 → affichage du résumé/certificat.

### Exemple Dashboard
```tsx
// app/dashboard/page.tsx
'use client';
import { useState } from 'react';

export default function Dashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [tp, setTp] = useState<any>(null);
  const [course, setCourse] = useState<any>(null);

  const onProfileCreated = async (p: any) => {
    setProfile(p);
    const r = await Api.toolsPractices(p.user_id);
    setTp(r);
  };

  const onGenerateCourse = async () => {
    if (!profile || !tp) return;
    const c = await Api.generateCourse(profile.user_id, tp.ai_tools);
    setCourse(c);
  };

  return (
    <div className="p-6 space-y-6">
      {!profile && <ProfileForm onCreated={onProfileCreated} />}
      {tp && (
        <div className="card">
          <h2 className="text-xl font-semibold">Recommandations IA</h2>
          <ul>{tp.ai_tools.map((t: any, i: number) => <li key={i}>{t.name} — {t.use_case}</li>)}</ul>
          <button className="btn" onClick={onGenerateCourse}>Générer le parcours</button>
        </div>
      )}
      {course && (
        <div className="grid gap-4">
          {course.modules.map((m: any, i: number) => (
            <a key={i} href={`/module/${i}`} className="card hover:bg-muted">
              <h3 className="font-medium">{m.title}</h3>
              <p className="text-sm text-muted-foreground">{m.description}</p>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Page Module
```tsx
// app/module/[id]/page.tsx
'use client';
import { useEffect, useState } from 'react';

export default function ModulePage({ params }: { params: { id: string } }) {
  const [mod, setMod] = useState<any>(null);
  const [message, setMessage] = useState('');
  const [reply, setReply] = useState('');

  useEffect(() => { Api.getModule(params.id).then(setMod); }, [params.id]);

  const send = async () => {
    const r = await Api.chatModule(params.id, message);
    setReply(r.reply);
  };

  if (!mod) return <div>Chargement…</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">{mod.title}</h1>
      <section>
        <h2 className="text-xl">Leçons</h2>
        <ul className="space-y-3">
          {mod.lessons.map((l: any, i: number) => (
            <li key={i} className="card"><h3>{l.title}</h3><p>{l.content}</p></li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl">Quiz</h2>
        <ul className="space-y-3">
          {mod.quiz.map((q: any, i: number) => (
            <li key={i} className="card">
              <p>{q.question}</p>
              <div className="flex gap-2">
                {q.options.map((o: string, j: number) => (<button key={j} className="btn-outline">{o}</button>))}
              </div>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="text-xl">Chatbot</h2>
        <div className="space-y-3">
          <textarea className="textarea" value={message} onChange={e => setMessage(e.target.value)} />
          <button className="btn" onClick={send}>Envoyer</button>
          {reply && <div className="card">
            <p className="font-medium">Réponse</p>
            <p>{reply}</p>
          </div>}
        </div>
      </section>
    </div>
  );
}
```

## 7. Styles & Accessibilité
- Tailwind: config de thèmes clairs/sombres, classes utilitaires.
- shadcn/ui: composants accessibles (roles/aria), navigation clavier.
- Internationalisation (si besoin): structurer les chaînes textuelles.

## 8. Tests
- Unitaires: typage des réponses, rendu de composants critiques.
- E2E (Playwright): parcours utilisateur profil → génération → module → chat.

## 9. Points d’attention v1
- Robustesse réseau (erreurs fetch, loaders, toasts).
- Synchronisation avec backend (contrats JSON identiques).
- Pas de RAG, pas de long polling non nécessaire.