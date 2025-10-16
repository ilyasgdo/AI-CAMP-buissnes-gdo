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

const isServer = typeof window === "undefined";
const BASE_URL = isServer
  ? (process.env.SERVER_API_URL ?? "http://backend:3000")
  : (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000");

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (isServer) {
    try {
      // Lazy require to avoid bundling server-only module in client
      const { cookies } = require("next/headers");
      const token = cookies().get("session_token")?.value;
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (_) {}
  } else {
    try {
      // Côté client: récupérer le token stocké au login
      const token = window.localStorage.getItem("session_token") || window.localStorage.getItem("auth_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    } catch (_) {}
  }
  return headers;
}

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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ email, password, ...(extras ?? {}) }),
    });
    return toJson<ProfileResponse>(res);
  },

  async login(email: string, password: string): Promise<ProfileResponse> {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });
    return toJson<ProfileResponse>(res);
  },
  async postProfile(data: ProfileInput): Promise<ProfileResponse> {
    const res = await fetch(`${BASE_URL}/profile`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify(data),
    });
    return toJson<ProfileResponse>(res);
  },

  async toolsPractices(): Promise<ToolsPractices> {
    const res = await fetch(`${BASE_URL}/ai/tools-practices`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({}),
    });
    return toJson<ToolsPractices>(res);
  },

  async runPipeline(): Promise<RunPipelineResponse> {
    const res = await fetch(`${BASE_URL}/ai/run-pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({}),
    });
    return toJson<RunPipelineResponse>(res);
  },

  async getCourse(id: string): Promise<CourseAggregate> {
    const res = await fetch(`${BASE_URL}/course/${id}`, { cache: "no-store", headers: { ...authHeaders() }, credentials: "include" });
    return toJson<CourseAggregate>(res);
  },

  async getModule(id: string): Promise<ModuleDetail> {
    const res = await fetch(`${BASE_URL}/module/${id}`, { cache: "no-store", headers: { ...authHeaders() }, credentials: "include" });
    const raw = await toJson<any>(res);
    const mapped: ModuleDetail = {
      id: raw?.id ?? raw?.module_id ?? raw?.moduleId,
      title: raw?.title,
      description: typeof raw?.description === "undefined" ? null : raw.description,
      objectives: typeof raw?.objectives === "undefined" ? null : raw.objectives,
      orderIndex: typeof raw?.orderIndex === "undefined" ? null : raw.orderIndex,
      lessons: Array.isArray(raw?.lessons) ? raw.lessons : [],
      quiz: Array.isArray(raw?.quiz) ? raw.quiz : [],
      chatbot_context: typeof raw?.chatbot_context === "undefined" ? null : raw.chatbot_context,
    } as ModuleDetail;
    return mapped;
  },

  async getLesson(id: string): Promise<LessonDetail> {
    const res = await fetch(`${BASE_URL}/lesson/${id}`, { cache: "no-store", headers: { ...authHeaders() }, credentials: "include" });
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
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ message }),
    });
    return toJson<{ reply: string }>(res);
  },

  async generateLessons(module_id: string): Promise<{ lessons: { id: string; title: string; content: string; orderIndex?: number | null }[] }>{
    const res = await fetch(`${BASE_URL}/ai/generate-lessons`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ module_id }),
    });
    return toJson(res);
  },

  async generateSummary(course_id: string): Promise<SummaryResponse> {
    const res = await fetch(`${BASE_URL}/ai/generate-summary`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ course_id }),
    });
    return toJson<SummaryResponse>(res);
  },

  async getUserCourses(user_id: string): Promise<Array<{ id: string; title: string; createdAt: string; modulesCount: number }>> {
    const res = await fetch(`${BASE_URL}/courses/by-user/${user_id}`, { cache: "no-store", headers: { ...authHeaders() }, credentials: "include" });
    return toJson(res);
  },

  async developLesson(lesson_id: string): Promise<LessonDetail> {
    const res = await fetch(`${BASE_URL}/ai/develop-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ lesson_id }),
    });
    return toJson<LessonDetail>(res);
  },

  async continueLesson(lesson_id: string): Promise<LessonDetail> {
    const res = await fetch(`${BASE_URL}/ai/continue-lesson`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ lesson_id }),
    });
    return toJson<LessonDetail>(res);
  },
};