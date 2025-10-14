# Backend — Documentation Technique v1 (NestJS + Prisma + PostgreSQL)

Date: 2025-10-14
Version: v1 (sans RAG)

## 1. Aperçu
- Objectif: orchestrer 4 appels IA, valider les réponses JSON strictes, persister en base, exposer des endpoints REST consommés par le frontend.
- Stack: NestJS (modules/DI), Prisma ORM, PostgreSQL, TypeScript.
- Principe: toutes les réponses des LLMs sont JSON, jamais HTML/texte libre.

## 2. Structure du Projet
- `src/`
  - `modules/`
    - `profile/` (controller + service + dto)
    - `ai/` (controllers: tools-practices, generate-course, generate-module, generate-summary; services: orchestrator, llm)
    - `course/` (controller + service)
    - `module/` (controller + service)
    - `chat/` (controller + service)
  - `common/` (utils: json validation, error filters, interceptors)
  - `prisma/` (PrismaService, schema)
- Config: `@nestjs/config` pour env vars.

## 3. Schéma Prisma (PostgreSQL)
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id         String   @id @default(uuid())
  job        String
  sector     String
  aiLevel    String
  toolsUsed  Json
  workStyle  String
  createdAt  DateTime @default(now())
  courses    Course[]
}

model Course {
  id               String   @id @default(uuid())
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  title            String
  rawAiTools       Json
  rawBestPractices Json
  summary          Json?
  createdAt        DateTime @default(now())
  modules          Module[]
  bestPractices    BestPractices?
}

model Module {
  id             String   @id @default(uuid())
  courseId       String
  course         Course   @relation(fields: [courseId], references: [id])
  title          String
  description    String
  objectives     Json
  chatbotContext String?
  orderIndex     Int
  lessons        Lesson[]
  quizzes        Quiz[]
}

model Lesson {
  id         String  @id @default(uuid())
  moduleId   String
  module     Module  @relation(fields: [moduleId], references: [id])
  title      String
  content    String
  orderIndex Int
}

model Quiz {
  id         String  @id @default(uuid())
  moduleId   String
  module     Module  @relation(fields: [moduleId], references: [id])
  question   String
  options    Json
  answer     String
  orderIndex Int
}

model BestPractices {
  id       String  @id @default(uuid())
  courseId String  @unique
  course   Course  @relation(fields: [courseId], references: [id])
  items    Json
}
```

## 4. Endpoints & Contrats
- `POST /profile`
  - Body: `{ job, sector, ai_level, tools_used: string[], work_style }`
  - Response: `{ user_id, job, sector, ai_level, tools_used, work_style }`
- `POST /ai/tools-practices`
  - Body: `{ user_id }`
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
  - Response: agrégat du course: tools, best_practices, modules, lessons, quiz.
- `GET /module/:id`
  - Response: module + lessons + quiz + chatbot_context.
- `POST /chat/module/:id`
  - Body: `{ message }`
  - Response: `{ reply }` (LLM avec prompt système = `chatbot_context`).

## 5. DTOs & Validation
- Utiliser `class-validator` / `class-transformer` pour valider `POST /profile` et autres bodies.
- Exemple DTO `CreateProfileDto`:
```ts
// src/modules/profile/dto/create-profile.dto.ts
import { IsString, IsArray } from 'class-validator';

export class CreateProfileDto {
  @IsString() job: string;
  @IsString() sector: string;
  @IsString() ai_level: string;
  @IsArray() tools_used: string[];
  @IsString() work_style: string;
}
```

## 6. Services & Responsabilités
- `ProfileService`: créer/charger profil utilisateur.
- `AiOrchestratorService`: séquencer IA #1 → IA #2 → IA #3 (pour chaque module) → persister → IA #4.
- `LlmService`: appeler le provider (OpenAI/Anthropic/Groq), forcer réponse en JSON, temps de réponse, retries.
- `CourseService`: créer course, persister raw JSON, mapper en entités (modules, lessons, quiz, best_practices).
- `CertificateService`: persister résumé et certificat.
- `ChatService`: générer réponses pour chatbot module.

## 7. LLM Provider & JSON strict
- Env vars: `LLM_PROVIDER=openai`, `OPENAI_API_KEY=...`.
- Prompting: inclure un système qui force réponse JSON.
- Validation JSON: extraction du plus grand bloc `{ ... }` si le modèle ajoute du texte, puis `JSON.parse`.
- Exemple util:
```ts
// src/common/json.ts
export function ensureJsonResponse(raw: string): any {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start >= 0 && end > start) {
    const jsonStr = raw.slice(start, end + 1);
    return JSON.parse(jsonStr);
  }
  throw new Error('Invalid JSON response from LLM');
}
```

## 8. Orchestration — Flux de bout en bout
```ts
// src/modules/ai/ai-orchestrator.service.ts
@Injectable()
export class AiOrchestratorService {
  constructor(
    private readonly llm: LlmService,
    private readonly prisma: PrismaService,
  ) {}

  async runPipelineForUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    // IA #1 — outils + bonnes pratiques
    const tpRaw = await this.llm.toolsPractices(user);
    const tp = ensureJsonResponse(tpRaw);

    // IA #2 — parcours/modules
    const courseRaw = await this.llm.generateCourse(user, tp.ai_tools);
    const courseJson = ensureJsonResponse(courseRaw);

    // Persister course
    const course = await this.prisma.course.create({
      data: {
        userId: user.id,
        title: courseJson.title,
        rawAiTools: tp.ai_tools,
        rawBestPractices: tp.best_practices,
      },
    });

    // IA #3 — pour chaque module
    let orderIndex = 0;
    for (const m of courseJson.modules) {
      const modRaw = await this.llm.generateModule(m);
      const modJson = ensureJsonResponse(modRaw);
      const module = await this.prisma.module.create({
        data: {
          courseId: course.id,
          title: modJson.title,
          description: m.description,
          objectives: m.objectives,
          chatbotContext: modJson.chatbot_context,
          orderIndex: orderIndex++,
        },
      });
      // Leçons
      let lIndex = 0;
      for (const l of modJson.lessons) {
        await this.prisma.lesson.create({
          data: { moduleId: module.id, title: l.title, content: l.content, orderIndex: lIndex++ },
        });
      }
      // Quiz
      let qIndex = 0;
      for (const q of modJson.quiz) {
        await this.prisma.quiz.create({
          data: { moduleId: module.id, question: q.question, options: q.options, answer: q.answer, orderIndex: qIndex++ },
        });
      }
    }

    // IA #4 — résumé + certificat
    const summaryRaw = await this.llm.generateSummary(course);
    const summaryJson = ensureJsonResponse(summaryRaw);

    await this.prisma.course.update({
      where: { id: course.id },
      data: { summary: summaryJson },
    });

    // Optionnel: BestPractices
    await this.prisma.bestPractices.create({
      data: { courseId: course.id, items: tp.best_practices },
    });

    return { courseId: course.id };
  }
}
```

## 9. Contrôleurs — Squelettes
```ts
// src/modules/profile/profile.controller.ts
@Post('/profile')
create(@Body() dto: CreateProfileDto) {
  return this.profileService.create(dto);
}

// src/modules/ai/ai.controller.ts
@Post('/ai/tools-practices')
async tools(@Body('user_id') userId: string) { /* ... */ }

@Post('/ai/generate-course')
async course(@Body() body: any) { /* ... */ }

@Post('/ai/generate-module')
async module(@Body() body: any) { /* ... */ }

@Post('/ai/generate-summary')
async summary(@Body('course_id') courseId: string) { /* ... */ }

// src/modules/course/course.controller.ts
@Get('/course/:id')
findOne(@Param('id') id: string) { /* ... */ }

// src/modules/module/module.controller.ts
@Get('/module/:id')
findOne(@Param('id') id: string) { /* ... */ }

// src/modules/chat/chat.controller.ts
@Post('/chat/module/:id')
reply(@Param('id') moduleId: string, @Body('message') message: string) { /* ... */ }
```

## 10. Sécurité, Erreurs & Logs
- Validation d’entrée via DTOs; réponse 400 si invalide.
- Temps max LLM (timeout), retries exponentiels; si échec → 502/504.
- Journaux: modèle, tokens, durée; jamais de données sensibles.
- Rate limiting (Nest throttler) sur endpoints IA.

## 11. Config & Déploiement
- Env vars: `DATABASE_URL`, `LLM_PROVIDER`, `OPENAI_API_KEY`.
- Migrations Prisma: `npx prisma migrate dev`.
- Build: `nest build`; Run: `nest start`.
- Santé: `GET /health` (ajouter module health si besoin).

## 12. Tests
- Unitaires: util JSON (`ensureJsonResponse`), mapping course/modules/leçons/quiz.
- E2E: pipeline heureux (mock LLM) pour vérifier persistance et réponses des endpoints.

## 13. Points d’attention v1
- Réponses strictes JSON (pas de RAG).
- Résilience aux variations de sortie LLM (nettoyage JSON).
- Agrégation performante pour `/course/:id`.