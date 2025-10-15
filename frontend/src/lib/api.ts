import type {
  ProfileInput,
  ProfileResponse,
  ToolsPractices,
  RunPipelineResponse,
  CourseAggregate,
  ModuleDetail,
  SummaryResponse,
  LessonDetail,
} from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

async function toJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      const m = (data as any)?.message;
      if (typeof m === "string") {
        message = m;
      } else if (m && typeof m === "object") {
        message = (m.message as string) ?? (m.error as string) ?? message;
      }
    } catch (_) {}
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const Api = {
  async register(email: string, password: string, extras?: { job?: string; sector?: string; ai_level?: string; tools_used?: any; work_style?: string }): Promise<ProfileResponse> {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, ...(extras ?? {}) }),
    });
    return toJson<ProfileResponse>(res);
  },

  async login(email: string, password: string): Promise<ProfileResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    return toJson<ProfileResponse>(res);
  },
  async postProfile(data: ProfileInput): Promise<ProfileResponse> {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return toJson<ProfileResponse>(res);
  },

  async toolsPractices(user_id: string): Promise<ToolsPractices> {
    const res = await fetch(`${BASE_URL}/ai/tools-practices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    return toJson<ToolsPractices>(res);
  },

  async runPipeline(user_id: string): Promise<RunPipelineResponse> {
    const res = await fetch(`${BASE_URL}/ai/run-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id }),
    });
    return toJson<RunPipelineResponse>(res);
  },

  async getCourse(id: string): Promise<CourseAggregate> {
    const res = await fetch(`${BASE_URL}/course/${id}`, { cache: "no-store" });
    return toJson<CourseAggregate>(res);
  },

  async getModule(id: string): Promise<ModuleDetail> {
    const res = await fetch(`${BASE_URL}/module/${id}`, { cache: "no-store" });
    const raw = await toJson<any>(res);
    const mod: ModuleDetail = {
      id: raw.module_id ?? raw.id,
      title: raw.title,
      description: raw.description ?? null,
      objectives: raw.objectives ?? null,
      orderIndex: raw.orderIndex ?? null,
      lessons: Array.isArray(raw.lessons) ? raw.lessons : [],
      quiz: Array.isArray(raw.quiz) ? raw.quiz : [],
      chatbot_context: raw.chatbot_context ?? null,
    };
    return mod;
  },

  async getLesson(id: string): Promise<LessonDetail> {
    const res = await fetch(`${BASE_URL}/lesson/${id}`, { cache: "no-store" });
    const raw = await toJson<any>(res);
    const lesson: LessonDetail = {
      id: raw.id,
      title: raw.title,
      content: raw.content,
      orderIndex: raw.orderIndex ?? null,
      module: raw.module ?? null,
    };
    return lesson;
  },

  async chatModule(id: string, message: string): Promise<{ reply: string }> {
    const res = await fetch(`${BASE_URL}/chat/module/${id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    return toJson<{ reply: string }>(res);
  },

  async generateLessons(module_id: string): Promise<{ lessons: { id: string; title: string; content: string; orderIndex?: number | null }[] }>{
    const res = await fetch(`${BASE_URL}/ai/generate-lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ module_id }),
    });
    return toJson(res);
  },

  async generateSummary(user_id: string, course_id: string): Promise<SummaryResponse> {
    const res = await fetch(`${BASE_URL}/ai/generate-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, course_id }),
    });
    return toJson<SummaryResponse>(res);
  },

  async getUserCourses(user_id: string): Promise<Array<{ id: string; title: string; createdAt: string; modulesCount: number }>> {
    const res = await fetch(`${BASE_URL}/courses/by-user/${user_id}`, { cache: "no-store" });
    return toJson(res);
  },

  async developLesson(lesson_id: string): Promise<LessonDetail> {
    const res = await fetch(`${BASE_URL}/ai/develop-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id }),
    });
    return toJson<LessonDetail>(res);
  },

  async continueLesson(lesson_id: string): Promise<LessonDetail> {
    const res = await fetch(`${BASE_URL}/ai/continue-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lesson_id }),
    });
    return toJson<LessonDetail>(res);
  },
};