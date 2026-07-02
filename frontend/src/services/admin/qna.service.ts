import { get, post, put } from "@/lib/api";

export type AdminQnaAnswer = {
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

export type AdminQnaQuestion = {
  id: number;
  question: string;
  status: "open" | "answered" | "closed";
  created_at?: string;
  answers_count?: number;
  user?: {
    id: number;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
  } | null;
  lesson?: {
    id: number;
    title: string;
    section?: {
      id: number;
      title: string;
      course?: {
        id: number;
        title: string;
        slug?: string | null;
        instructor_id?: number;
      } | null;
    } | null;
  } | null;
  answers: AdminQnaAnswer[];
};

type PaginatedQuestions = {
  data: AdminQnaQuestion[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type QnaListResponse = {
  success: boolean;
  data: PaginatedQuestions;
  message: string;
  errors: unknown;
};

type QnaAnswerResponse = {
  success: boolean;
  data: {
    answer?: AdminQnaAnswer;
    question?: AdminQnaQuestion;
  };
  message: string;
  errors: unknown;
};

export const adminQnaService = {
  async list({
    search = "",
    status = "",
    page = 1,
    perPage = 20,
    lessonId = "",
    userId = "",
  }: {
    search?: string;
    status?: string;
    page?: number;
    perPage?: number;
    lessonId?: string | number;
    userId?: string | number;
  } = {}): Promise<PaginatedQuestions> {
    const response = await get<QnaListResponse>("/admin/qna", {
      params: {
        search: search || undefined,
        status: status || undefined,
        page,
        per_page: perPage,
        lesson_id: lessonId || undefined,
        user_id: userId || undefined,
      },
    });

    return response.data;
  },

  async answer(questionId: number, answer: string): Promise<QnaAnswerResponse["data"]> {
    const response = await post<QnaAnswerResponse>(`/admin/qna/${questionId}/answers`, {
      answer,
    });

    return response.data;
  },

  async close(questionId: number): Promise<QnaAnswerResponse> {
    return put<QnaAnswerResponse>(`/admin/qna/${questionId}/close`);
  },
};
