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

---

## Guide Docker Compose — Démarrer, choisir provider, arrêter, redémarrer

Prérequis
- Docker Desktop actif et récent.
- Ports libres: `5434` (Postgres), `3000` (Backend), `3001` (Frontend), `11434` (Ollama hors Docker), `8000` (vLLM si utilisé).
- Pour vLLM: GPU NVIDIA + driver + runtime compatible (voir image `vllm/vllm-openai`).
- Pour Gemini (Vertex AI): crédentials service account à `./secrets/google-sa.json` et variables projet (voir ci‑dessous).

Démarrer la stack de base (mock LLM)
- Lance `postgres`, `backend`, `frontend` avec le mode LLM mock (par défaut):
  - `docker compose up -d`
- Vérifier santé backend: 
  - Windows PowerShell: `Invoke-WebRequest -UseBasicParsing http://localhost:3000/health | Select-Object StatusCode, Content`

Choisir un provider LLM
- Général: combinez le fichier de base avec l’override du provider:
  - `docker compose -f docker-compose.yml -f docker-compose.<provider>.yml up -d`
- Ollama (serveur local sur l’hôte):
  - Prérequis: Ollama installé et démarré sur l’hôte (`http://localhost:11434`). Vérifiez: `ollama list` et pull du modèle (ex: `ollama pull mistral:latest`).
  - Démarrer backend avec override Ollama:
    - Backend seul: `docker compose -f docker-compose.yml -f docker-compose.ollama.yml up -d backend`
    - Stack complète: `docker compose -f docker-compose.yml -f docker-compose.ollama.yml up -d`
  - Changer de modèle: éditez `LLM_MODEL` dans `docker-compose.ollama.yml` (ex: `mistral:latest` ou `qwen2.5-coder:0.5b`).
  - Vérifier modèles disponibles depuis backend: 
    - `docker compose -f docker-compose.yml -f docker-compose.ollama.yml exec backend sh -lc "wget -qO- http://host.docker.internal:11434/api/tags"`
- Perplexity:
  - Variables: `PERPLEXITY_API_KEY` (doit être exportée dans l’environnement).
  - Démarrer: `docker compose -f docker-compose.yml -f docker-compose.perplexity.yml up -d backend`
  - Modèle par défaut: `pplx-70b-online` (web access).
- Gemini (Vertex AI):
  - Variables: `GOOGLE_PROJECT_ID`, `GOOGLE_LOCATION` (par défaut `us-central1`).
  - Crédentials: placez `./secrets/google-sa.json` (service account) monté dans le conteneur.
  - Démarrer: `docker compose -f docker-compose.yml -f docker-compose.gemini.yml up -d backend`
  - Modèle par défaut: `gemini-2.5-flash`.
- vLLM (OpenAI-compatible, en conteneur):
  - Démarrer vLLM + backend: `docker compose -f docker-compose.yml -f docker-compose.vllm.yml up -d vllm backend`
  - Base URL côté backend: `OPENAI_BASE_URL: http://vllm:8000/v1` (déjà défini dans l’override).

Exposer via Cloudflare (domaine public)
- Combinez l’override Cloudflare avec la stack existante pour exposer `frontend` et `backend` via tunnel:
  - Exemple Ollama + Cloudflare: `docker compose -f docker-compose.yml -f docker-compose.ollama.yml -f docker-compose.cloudflare.yml up -d`
- Le tunnel utilise `cloudflared/config.yml`:
  - `ilyasghandaoui.store` → `frontend:3001`
  - `api.ilyasghandaoui.store` et `api2.ilyasghandaoui.store` → `backend:3000`
- L’override Cloudflare ajuste `NEXT_PUBLIC_API_URL` du frontend vers `https://api2.ilyasghandaoui.store`.

Vérifications utiles
- Local: `Invoke-WebRequest -UseBasicParsing http://localhost:3000/health`
- Inter-conteneurs: `docker compose exec frontend wget -qO- http://backend:3000/health`
- Cloudflare: `Invoke-WebRequest -UseBasicParsing https://api2.ilyasghandaoui.store/health`
- Endpoint IA (ex.):
  - PowerShell: 
    - `$body = @{ user_id = '<UUID_USER>' } | ConvertTo-Json`
    - `Invoke-WebRequest -UseBasicParsing -Uri 'http://localhost:3000/ai/tools-practices' -Method POST -Body $body -ContentType 'application/json'`

Arrêter et nettoyer
- Arrêter la stack courante (incluant overrides) et supprimer orphelins:
  - `docker compose -f docker-compose.yml -f docker-compose.<provider>.yml -f docker-compose.cloudflare.yml down --remove-orphans`
- Astuce: si vous ne vous souvenez plus des overrides utilisés, `docker compose down --remove-orphans` suffit dans la plupart des cas (même projet Compose).

Redémarrer / Recréer / Rebuilder
- Redémarrer un service (recréation forcée):
  - `docker compose -f docker-compose.yml -f docker-compose.<provider>.yml up -d --force-recreate backend`
- Rebuilder l’image backend (par ex. après changement code/dépendances):
  - `docker compose -f docker-compose.yml -f docker-compose.<provider>.yml build --no-cache backend`
  - `docker compose -f docker-compose.yml -f docker-compose.<provider>.yml up -d backend`
- Logs et debug:
  - Backend: `docker compose logs -f backend`
  - Cloudflared: `docker compose logs -f cloudflared`

Changer de provider (ex. Ollama → Gemini)
- Nettoyage:
  - `docker compose -f docker-compose.yml -f docker-compose.ollama.yml down --remove-orphans`
- Démarrage avec nouveau provider:
  - `docker compose -f docker-compose.yml -f docker-compose.gemini.yml up -d backend`
- Option Cloudflare:
  - `docker compose -f docker-compose.yml -f docker-compose.gemini.yml -f docker-compose.cloudflare.yml up -d`

Notes & bonnes pratiques
- Évitez de monter le code hôte du backend (`./backend:/app`) pour ne pas casser les `node_modules` du conteneur.
- `host.docker.internal` est déjà déclaré dans l’override Ollama pour accéder à `http://localhost:11434` depuis le conteneur backend.
- Avertissements “orphan containers” → utilisez `--remove-orphans` lors de `down` pour nettoyer les anciens services non référencés.
- Pour changer rapidement de modèle Ollama, éditez `LLM_MODEL` dans `docker-compose.ollama.yml` puis `up -d --force-recreate backend`.