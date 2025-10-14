# Development Plan

## Project Overview

- Build an AI-driven e-learning platform that creates a personalized learning path from a user profile (job, sector, AI level, tools, work style).
- Orchestrate 4 LLM steps with strict JSON outputs: tools/practices → course/modules → detailed module content (lessons, quiz, chatbot) → summary/certificate.
- Persist all outputs in PostgreSQL via Prisma; expose REST APIs with NestJS; consume from Next.js (Tailwind + shadcn/ui). v1 excludes RAG.

## Milestones

1. **Milestone 1**: Backend Foundation (NestJS + Prisma schema + core endpoints + JSON utilities) - 2025-10-21
2. **Milestone 2**: AI Orchestration & Persistence (LLM provider + pipeline IA #1–#4 + aggregate reads) - 2025-10-28
3. **Milestone 3**: Frontend MVP & E2E Integration (Profile/Dashboard/Module/Chatbot/Summary + tests) - 2025-11-04

## Tasks Breakdown

### Phase 0: Initialisation Projet

- [ ] Créer le dépôt, structure dossiers, conventions (README + Context)
- [ ] Configurer les variables d’environnement (`.env`, `@nestjs/config`, `NEXT_PUBLIC_API_URL`)
- [ ] Ajouter liens de navigation: `Context/pdr.md`, `Context/backend.md`, `Context/frontend.md`, `Context/plan.md`
- [ ] Mettre en place gitignore, scripts NPM de base (dev, build, test)

### Phase 1: Fondation Backend

- [ ] Initialiser NestJS avec `@nestjs/config` et `PrismaService`
- [ ] Définir le schéma Prisma (User, Course, Module, Lesson, Quiz, BestPractices)
- [ ] Lancer les migrations initiales et un seed minimal de démo
- [ ] Implémenter DTOs et `POST /profile` avec validation (`class-validator`)
- [ ] Implémenter `ProfileController` et `ProfileService`
- [ ] Ajouter utilitaire JSON `ensureJsonResponse` et filtres/intercepteurs d’erreurs
- [ ] Implémenter `GET /course/:id` (agrégat: modules, leçons, quiz, best_practices)
- [ ] Implémenter `GET /module/:id` (détail: leçons, quiz, `chatbot_context`)
- [ ] Activer logging (durée/modèle/tokens), rate limiting, endpoint santé

### Phase 2: Orchestration IA

- [ ] Implémenter `LlmService` (OpenAI par défaut) avec réponses strictement JSON
- [ ] Implémenter `AiOrchestratorService` (séquence IA #1 → IA #2 → IA #3 → IA #4)
- [ ] Implémenter endpoints IA: `/ai/tools-practices`, `/ai/generate-course`, `/ai/generate-module`, `/ai/generate-summary`
- [ ] Persister les retours IA (tools/practices, course/modules, lessons/quiz, summary)
- [ ] Gérer retries, timeouts, nettoyage JSON (fallback parse)

### Phase 3: Frontend MVP

- [ ] Initialiser Next.js + Tailwind + shadcn/ui
- [ ] Implémenter `ProfileForm` et flux Dashboard (IA #1 et IA #2)
- [ ] Implémenter Dashboard (liste outils IA & modules générés)
- [ ] Implémenter page Module (leçons, quiz) et chatbot (`/chat/module/:id`)
- [ ] Implémenter page Summary (afficher `summary`, `skills_gained`, `certificate_text`)
- [ ] Créer client API et types TypeScript alignés sur les contrats backend
- [ ] Gestion erreurs (loaders, toasts), accessibilité (roles/aria), dark mode

### Phase 4: Tests & Qualité

- [ ] Tests unitaires: util JSON, services backend, composants clés frontend
- [ ] Tests E2E (Playwright): profil → IA → modules → chat → résumé (happy path)
- [ ] Lint/format (ESLint/Prettier), CI minimal (install, build, test)
- [ ] Observabilité: logs sans données sensibles; audit prompts
- [ ] Performance: TTI Dashboard/Module ≤ 3s (staging)

### Phase 5: Déploiement & Release

- [ ] Dockerisation (optionnel) ou déploiement managé (Railway/Render/Vercel)
- [ ] Environnements staging/prod, migrations Prisma automatisées
- [ ] Gestion secrets (API keys LLM) et variables d’environnement
- [ ] Guide d’exploitation (runbook) et checklists go-live
- [ ] Publication et validation des critères d’acceptation v1

## Success Metrics

- Metric 1: End-to-end pipeline completion rate ≥ 95% for typical profiles
- Metric 2: Strict JSON compliance ≥ 98% with fallback parse and retry logic
- Metric 3: TTI ≤ 3s on staging for Dashboard and Module pages
- Metric 4: 100% unit test coverage for JSON parsing util; ≥ 80% service coverage
- Metric 5: No sensitive data in prompts/logs (manual audit checklist passed)

## Timeline

```
Timeline (2025)
Oct 14–21: Milestone 1 — Backend Foundation            [##########]
Oct 22–28: Milestone 2 — AI Orchestration & Persistence [##########]
Oct 29–Nov 04: Milestone 3 — Frontend & E2E Integration [##########]
```