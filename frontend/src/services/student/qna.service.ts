import { get } from "@/lib/api";

export type StudentDashboardAnswer = {
  id: number;
  answer: string;
  is_instructor_answer: boolean;
  created_at?: string;
  user?: {
    id: number;
    name: string;
    email?: string | null;
    avatar?: string | null;
    role?: string;
  } | null;
};

export type StudentDashboardQuestion = {
  id: number;
  question: string;
  status: "open" | "answered" | "closed";
  created_at?: string;
  lesson?: {
    id: number;
    title: string;
    type?: string | null;
    section?: {
      id: number;
      title: string;
      course?: {
        id: number;
        title: string;
        slug?: string | null;
      } | null;
    } | null;
  } | null;
  answers: StudentDashboardAnswer[];
};

type StudentQnaResponse = {
  success: boolean;
  data: {
    questions: StudentDashboardQuestion[];
  };
  message: string;
  errors: unknown;
};

export const studentQnaService = {
  async list(): Promise<StudentDashboardQuestion[]> {
    const response = await get<StudentQnaResponse>("/student/qna");
    return response.data.questions;
  },
};
