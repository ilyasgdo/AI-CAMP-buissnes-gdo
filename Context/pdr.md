# PDR — Spécifications Fonctionnelles v1 (Plateforme e‑learning IA)

Date: 2025-10-14
Version: v1 (sans RAG)

## 1. Vision & Objectif
- Créer une plateforme e‑learning qui personnalise un parcours d’apprentissage en IA selon le profil utilisateur, avec un pipeline d’appels LLM strictement au format JSON, stockés en base puis affichés côté frontend.
- V1 sans RAG: aucune récupération de documents externes; toutes les réponses proviennent de prompts structurés et des LLMs.

## 2. Portée v1
- Collecte du profil utilisateur (poste, secteur, niveau IA, outils, mode de travail).
- IA #1: recommandations d’outils IA + « bonnes pratiques » adaptées au profil.
- IA #2: génération du parcours (liste de modules) en JSON.
- IA #3: génération détaillée par module (cours, quiz, contexte chatbot) en JSON.
- IA #4: récapitulatif final + certificat (texte/PDF), en JSON.
- Stockage de tous les retours IA au format JSON (PostgreSQL via Prisma).
- Frontend Next.js + Tailwind + shadcn/ui pour saisie, affichage du parcours, modules, quiz, chatbot, résumé.

## 3. Parcours Utilisateur (UX)
1) Page `register`: l’utilisateur saisit son profil.
2) Soumission déclenche le pipeline côté backend:
   - IA #1 → outils + bonnes pratiques
   - IA #2 → modules
   - IA #3 → contenu complet des modules (cours + quiz + chatbot_context)
   - IA #4 → résumé + certificat
3) Page `dashboard`: affiche outils IA, bonnes pratiques, parcours généré.
4) Page `module/:id`: affiche les leçons, le quiz, et un chatbot spécialisé du module.
5) Page `summary`: affiche le récapitulatif et le certificat.

## 4. Pipeline IA (orchestration)
- Étape 1 — Profil: POST `/profile` (persisté).
- Étape 2 — IA #1: POST `/ai/tools-practices` → JSON: `{ ai_tools: [...], best_practices: [...] }`.
- Étape 3 — IA #2: POST `/ai/generate-course` → JSON: `{ title, modules: [...] }`.
- Étape 4 — IA #3: Pour chaque module, POST `/ai/generate-module` → JSON: `{ title, lessons: [...], quiz: [...], chatbot_context }`.
- Étape 5 — Persistance: insertion en base des objets JSON.
- Étape 6 — IA #4: POST `/ai/generate-summary` → JSON: `{ summary, skills_gained: [...], certificate_text }`.

## 5. Spécifications API (Backend NestJS)
- Convention: toutes les réponses sont `application/json`. Pas de HTML/texte brut.
- Identifiants: utiliser UUID pour les entités; relations via clés étrangères Prisma.

### 5.1 Endpoints
- `POST /profile`
  - Body: `{ job, sector, ai_level, tools_used: string[], work_style }`
  - Response: `{ user_id, ...payload }`
- `POST /ai/tools-practices`
  - Body: `{ user_id }` (ou profil complet si non trouvé)
  - Response: `{ ai_tools: [{ name, category, use_case }...], best_practices: string[] }`
- `POST /ai/generate-course`
  - Body: `{ user_id, ai_tools }`
  - Response: `{ course_id, title, modules: [{ title, description, objectives: string[] }] }`
- `POST /ai/generate-module`
  - Body: `{ course_id, module_index_or_id, module: { title, description, objectives } }`
  - Response: `{ module_id, title, lessons: [{ title, content }...], quiz: [{ question, options: string[], answer }...], chatbot_context }`
- `POST /ai/generate-summary`
  - Body: `{ course_id }`
  - Response: `{ summary, skills_gained: string[], certificate_text }`
- `GET /course/:id`
  - Response: course + modules + best_practices + ai_tools (agrégé).
- `GET /module/:id`
  - Response: module + lessons + quiz + chatbot_context.
- `POST /chat/module/:id`
  - Body: `{ message }`
  - Response: `{ reply }` (LLM avec `chatbot_context` du module comme prompt système). Sans RAG.

### 5.2 Contrats JSON (Extraits)
```json
// IA #1
{
  "ai_tools": [
    { "name": "Perplexity", "category": "Recherche", "use_case": "Insights marché" }
  ],
  "best_practices": ["Vérifier la véracité", "Ne pas inclure données sensibles"]
}

// IA #2
{
  "title": "Parcours IA pour Responsable Marketing",
  "modules": [
    {
      "title": "Fondamentaux de l’IA",
      "description": "Transformation de la stratégie",
      "objectives": ["Bases de l’IA", "Cas concrets"]
    }
  ]
}

// IA #3 (par module)
{
  "title": "Création de contenus visuels",
  "lessons": [
    { "title": "Intro", "content": "Midjourney permet…" }
  ],
  "quiz": [
    { "question": "Quel outil ?", "options": ["ChatGPT","Midjourney","Notion AI","Canva"], "answer": "Midjourney" }
  ],
  "chatbot_context": "Tu es un tuteur IA spécialisé dans ce module."
}

// IA #4
{
  "summary": "Résumé des apprentissages…",
  "skills_gained": ["Prompting", "Veille IA"],
  "certificate_text": "Félicitations…"
}
```

## 6. Modèle de Données (PostgreSQL via Prisma)
- `user`
  - `id: string (uuid)`
  - `job: string`
  - `sector: string`
  - `ai_level: string`
  - `tools_used: string[]` (JSONB ou table pivot si besoin)
  - `work_style: string`
  - `created_at: datetime`

- `course`
  - `id: string (uuid)`
  - `user_id: string (fk user)`
  - `title: string`
  - `raw_ai_tools: JSONB` (copie des outils IA)
  - `raw_best_practices: JSONB`
  - `summary: JSONB` (réponse IA #4)
  - `created_at: datetime`

- `module`
  - `id: string (uuid)`
  - `course_id: string (fk course)`
  - `title: string`
  - `description: string`
  - `objectives: JSONB` (string[])
  - `chatbot_context: text`
  - `order_index: int`

- `lesson`
  - `id: string (uuid)`
  - `module_id: string (fk module)`
  - `title: string`
  - `content: text`
  - `order_index: int`

- `quiz`
  - `id: string (uuid)`
  - `module_id: string (fk module)`
  - `question: string`
  - `options: JSONB` (string[])
  - `answer: string`
  - `order_index: int`

- `best_practices` (optionnel si séparé)
  - `id: string (uuid)`
  - `course_id: string (fk course)`
  - `items: JSONB` (string[])

Notes:
- Utiliser JSONB pour stocker les réponses brutes des LLMs (traces), plus colonnes structurées pour affichage efficace.
- Ajouter index sur `course.user_id` et `module.course_id`.

## 7. Frontend (Next.js + Tailwind + shadcn/ui)
- Pages:
  - `/register`: formulaire profil (shadcn Form, Input, Select, Textarea).
  - `/dashboard`: cartes outils IA, bonnes pratiques, liste de modules.
  - `/module/[id]`: contenu leçons, quiz (shadcn Card, Accordion), chatbot simple.
  - `/summary`: récapitulatif + certificat (PDF en v1 optionnel: texte téléchargeable).
- Composants:
  - `ProfileForm`, `ToolsList`, `BestPracticesList`, `ModulesList`, `LessonViewer`, `QuizRunner`, `ChatbotPanel`.
- Styles: Tailwind + tokens shadcn; dark mode via classe.
- Données: fetch via endpoints backend; état local minimal; pas de RAG.
- Chatbot par module: envoi `message` à `/chat/module/:id`, réponse LLM conditionnée par `chatbot_context`.

## 8. Orchestrateur IA (NestJS)
- Service: `AiOrchestratorService`
  - Entrée: `user_id`
  - Séquence:
    1. Charger profil user.
    2. Appeler LLM (IA #1) avec prompt structuré → valider JSON.
    3. Appeler LLM (IA #2) avec prompt + outils → valider JSON.
    4. Pour chaque module: appeler LLM (IA #3) → valider JSON.
    5. Persister course/modules/leçons/quiz/best_practices.
    6. Appeler LLM (IA #4) → persister résumé/certificat.
- Validation JSON:
  - Tenter `JSON.parse`; si échec, utiliser correction (regex, extraction bloc `{}`) puis relancer.
  - Retourner erreurs normalisées.
- LLM provider: OpenAI/Anthropic/Groq; clé API via `process.env`.

## 9. Prompts (base v1, sans RAG)
- IA #1 (outils + bonnes pratiques):
  - Contexte: poste, secteur, niveau IA, outils existants, mode de travail.
  - Instruction: « Réponds STRICTEMENT en JSON conforme: { ai_tools: [...], best_practices: [...] } ».
- IA #2 (parcours/modules):
  - Contexte: profil + liste des outils IA.
  - Instruction: JSON: `{ title, modules: [{ title, description, objectives: [] }] }`.
- IA #3 (module détaillé):
  - Contexte: titre, description, objectifs du module.
  - Instruction: JSON: `{ title, lessons: [...], quiz: [...], chatbot_context }`.
- IA #4 (récapitulatif + certificat):
  - Contexte: titre du parcours, nombre et liste des modules.
  - Instruction: JSON: `{ summary, skills_gained, certificate_text }`.

## 10. Sécurité & Conformité
- Ne jamais inclure de données sensibles (clients, secrets) dans les prompts.
- Logger les appels IA (durée, modèle, taille) sans payload sensible.
- Rate limiting sur endpoints IA; retries exponentiels.
- Validation côté serveur des entrées utilisateur.

## 11. Opérations & Config
- Env vars:
  - `DATABASE_URL` (PostgreSQL)
  - `LLM_PROVIDER` (ex: `openai`)
  - `OPENAI_API_KEY` (ou équivalent)
- Migrations Prisma pour schéma ci-dessus.
- Seed optionnel pour démos.

## 12. Critères d’Acceptation v1
- A: Un profil soumis déclenche le pipeline complet; toutes réponses IA sont en JSON valide et persistées.
- B: Le dashboard affiche outils, bonnes pratiques, modules.
- C: Chaque page module affiche leçons, quiz; le chatbot répond de manière contextuelle sans RAG.
- D: La page résumé affiche `summary`, `skills_gained`, `certificate_text` (téléchargeable en texte).
- E: Aucune page ne casse en cas de JSON additionnel; robustesse parsing.

## 13. Roadmap de mise en œuvre (technique)
- Backend NestJS: scaffolding, Prisma, entités, services (Profile, Course, AI Orchestrator, Certificate), endpoints ci‑dessus.
- Frontend Next.js: pages, composants shadcn, appels API, états, affichage.
- Intégration LLM: prompts, validation JSON, gestion erreurs/timeouts.
- Tests: unitaires services (validation JSON, mapping), e2e minimal (pipeline heureux).

## 14. Annexes
- Référence README: étapes 1→8 cohérentes avec ce PDR.
- Sans RAG en v1; RAG réservé versions ultérieures.

### Liens vers documentation technique
- Backend: [backend.md](./backend.md)
- Frontend: [frontend.md](./frontend.md)
- Règles IA: [ai-rules.md](./ai-rules.md)