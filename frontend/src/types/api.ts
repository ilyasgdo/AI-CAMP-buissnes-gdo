export type ProfileInput = {
  user_id?: string;
  job: string;
  sector: string;
  ai_level: string;
  tools_used?: string[] | Record<string, any>;
  work_style?: string;
  // Champs avancés optionnels
  seniority?: string;
  experience_years?: number;
  company_size?: string;
  preferred_models?: string;
  learning_goals?: string;
  availability_hours_per_week?: number;
  timezone?: string;
  language?: string;
  industries?: string;
  compliance_needs?: string;
  data_privacy_notes?: string;
  hardware_constraints?: string;
  preferred_workflows?: string;
};

export type ProfileResponse = {
  user_id: string;
};

export type ToolsPractices = {
  ai_tools: Array<{ name: string; category?: string; use_case?: string }>;
  best_practices: string[];
};

export type RunPipelineResponse = {
  course_id: string;
  title?: string;
};

export type CourseAggregate = {
  id: string;
  title: string;
  raw_ai_tools?: unknown;
  raw_best_practices?: unknown;
  summary?: {
    certificate_text?: string;
    skills_gained?: string[];
    profile?: unknown;
  } | null;
  modules: Array<{
    id: string;
    title: string;
    description?: string | null;
    objectives?: string[] | null;
    orderIndex?: number | null;
  }>;
  best_practices?: string[] | null;
};

export type ModuleDetail = {
  id: string;
  title: string;
  description?: string | null;
  objectives?: string[] | null;
  orderIndex?: number | null;
  lessons: Array<{
    id: string;
    title: string;
    content: string;
    orderIndex?: number | null;
  }>;
  quiz: Array<{
    id: string;
    question: string;
    options: string[];
    answer: string;
    orderIndex?: number | null;
  }>;
  chatbot_context?: string | null;
};

export type SummaryResponse = {
  summary: unknown;
};

export type LessonDetail = {
  id: string;
  title: string;
  content: string;
  orderIndex?: number | null;
  module?: { id: string; title: string } | null;
};

export type LessonContentJson = {
  title: string;
  sections: Array<
    | { type: 'text'; heading?: string; text: string }
    | { type: 'list'; heading?: string; items: string[] }
    | { type: 'code'; heading?: string; language: string; code: string }
    | { type: 'callout'; variant: 'tip' | 'warning' | 'note'; text: string }
  >;
  references?: string[];
  quiz?: Array<{
    question: string;
    options: string[];
    answer: string;
  }>;
};