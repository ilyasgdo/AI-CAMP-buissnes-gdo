# Règles d’Exécution IA — Contexte du Projet

Version: v1
Date: 2025-10-14

## Objectif
- Garantir que toute action de l’IA respecte les spécifications du projet en lisant et appliquant systématiquement les documents du dossier `Context`.
- Assurer la mise à jour continue des étapes, et la relecture des étapes déjà implémentées et testées.

## Règle 1 — Lecture systématique du dossier Context
- Avant toute action (création, modification, test, déploiement), l’IA doit lire intégralement:
  - `Context/pdr.md` (spécifications fonctionnelles v1)
  - `Context/backend.md` (architecture et API backend)
  - `Context/frontend.md` (architecture et intégration frontend)
  - `Context/plan.md` (plan de développement, phases et jalons)
- Si un document manque ou est incohérent, le recréer/mise à jour avec liens depuis `README.md` et `Context/pdr.md`.
- Relecture obligatoire de ces fichiers avant chaque nouvelle série de modifications.

## Règle 2 — Conformité stricte aux spécifications
- Réponses IA: toujours en JSON strict (pas de HTML, pas de texte libre), conformément aux contrats décrits.
- V1 sans RAG: ne pas intégrer de récupération de documents externes.
- Respecter les endpoints, la structure de données (Prisma/PostgreSQL) et le routage UI tel que défini.
- Conserver la persistance de toutes sorties IA en base au format JSONB en plus des colonnes structurées.

## Règle 3 — Mise à jour des étapes (plan)
- À chaque avancée, mettre à jour `Context/plan.md`:
  - Cocher les tâches terminées et préciser l’état (en cours, complété).
  - Maintenir la cohérence avec les phases (0→5) et les milestones (dates cibles).
  - Ne pas marquer « complété » si les tests n’ont pas été exécutés et réussis.
- Si des phases évoluent, ajuster la section « Milestones » pour refléter le périmètre.

## Règle 4 — Relecture des étapes implémentées et testées
- Avant de commencer une nouvelle phase, re‑lire les étapes déjà implémentées.
- Exécuter les tests ciblés (unitaires/services, E2E) pour détecter toute régression.
- Vérifier les critères d’acceptation correspondants dans `Context/pdr.md` et mettre à jour leur statut dans `Context/plan.md` si nécessaire.

## Règle 5 — Vérifications & Tests
- Tests unitaires: utilitaires JSON, services backend critiques, composants clés frontend.
- Tests E2E (parcours heureux): profil → IA #1/#2 → module (leçons/quiz) → chat → résumé.
- Performance: TTI ≤ 3s (staging) pour dashboard/module.
- Pour toute modification UI, effectuer une prévisualisation locale avant de considérer la tâche terminée.

## Règle 6 — Sécurité & Journalisation
- Ne jamais inclure de données sensibles dans les prompts ou logs.
- Logger modèle, tokens, durée; anonymiser/éviter payloads sensibles.
- Appliquer rate limiting sur endpoints IA; gérer timeouts et retries.
- Clés et variables via `.env` (jamais en dur dans le code).

## Règle 7 — Gouvernance des modifications
- Minimal changes: modifications ciblées et cohérentes avec le style existant.
- Ne pas corriger des bugs hors périmètre de la tâche en cours (les mentionner au besoin).
- Mettre à jour la documentation: créer/éditer dans `Context/`, ajouter les liens:
  - `README.md` → section « Documentation technique »
  - `Context/pdr.md` → section « Liens vers documentation technique »

## Workflow Opérationnel Standard
1. Lire `Context/pdr.md`, `backend.md`, `frontend.md`, `plan.md` (intégralement).
2. Identifier la phase et les tâches actives dans `Context/plan.md`.
3. Implémenter la tâche en respectant strictement les spécifications.
4. Valider via tests unitaires/E2E et critères d’acceptation.
5. Mettre à jour `Context/plan.md` (checkboxes/états) et, si besoin, `README.md` et `Context/pdr.md` (liens/docs).
6. Re‑lire les étapes déjà faites; rejouer tests ciblés pour prévenir régressions.

## Checklists
- Avant toute modification:
  - Lire/relire les 4 fichiers du dossier `Context`.
  - Confirmer phase/tâche active et périmètre.
  - Préparer tests à exécuter (unitaires/E2E/UI preview).
- Après modification:
  - Exécuter tests, vérifier performances et sécurité.
  - Mettre à jour `Context/plan.md` (état, date, notes éventuelles).
  - Ajouter/rafraîchir les liens dans `README.md` et `Context/pdr.md` si de nouveaux documents ont été ajoutés.

## Enforcement — Checklists obligatoires
- Pré‑patch (obligatoire):
  - Relire intégralement `Context/pdr.md`, `backend.md`, `frontend.md`, `plan.md` (cocher dans `plan.md`).
  - Identifier la phase active (0→5) et la tâche; préciser le résultat attendu.
  - Valider contrats JSON (types/DTO), endpoints et modèles Prisma concernés.
  - Définir le plan de tests (unitaires, E2E, preview UI si applicable).
  - Vérifier variables `.env` nécessaires; aucun secret en dur.
- Post‑patch (obligatoire):
  - Exécuter tests unitaires et E2E; consigner résultats et versions.
  - Mettre à jour `Context/plan.md` (statut, date, blocages éventuels).
  - Si UI: effectuer une prévisualisation locale et noter l’issue/URL interne.
  - Re‑lire les étapes adjacentes et rejouer tests ciblés pour régression.
  - Mettre à jour docs/liens si périmètre ou contrats ont évolué.

## Métriques de conformité et seuils
- Taux de conformité PDR ≥ 95% (tâches alignées sur `pdr.md`).
- Relecture par phase ≥ 1 (compter relectures effectuées avant patch).
- Réussite tests unitaires ≥ 90% sur scope modifié; E2E parcours heureux 100%.
- Adhérence JSON strict: 100% des réponses parsées sans post‑traitement manuel.
- Performance: TTI dashboard/module ≤ 3s (staging) et ≤ 5s (prod initiale).
- Sécurité: 0 secret en dur; 0 leakage de données sensibles en logs/prompts.

## Procédures d’audit
- Revue hebdomadaire: comparer `Context/plan.md` à l’avancement réel (ajouter notes).
- Audit des contrats: valider que API/DTO/types frontend restent synchronisés.
- Traçabilité: noter modèle IA, température, tokens et durée pour chaque appel critique.

## Gestion des non‑conformités
- Détectée par tests/audit:
  - Isoler la modification fautive; rédiger patch correctif minimal.
  - Mettre à jour `Context/plan.md` (incident, action corrective, re‑tests).
  - Vérifier critères d’acceptation liés dans `Context/pdr.md`.

## Invariants d’orchestration (rappels)
- V1 sans RAG; aucune récupération documentaire externe.
- Réponses IA uniquement en JSON strict selon contrats; valida te avant persistance.
- Persistance: stocker sorties IA au format JSONB + colonnes structurées.
- Endpoints, schémas Prisma et pages frontend doivent rester cohérents avec `Context/`.