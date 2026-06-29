import { del, get, post, put } from "@/lib/api";
import { imageUrl } from "@/services/course-catalog.service";

export type PlayerLesson = {
  id: number;
  title: string;
  type: string;
  duration: number | null;
  order?: number;
  is_available?: boolean;
  is_completed?: boolean;
  watch_seconds?: number;
};

export type PlayerSection = {
  id: number;
  title: string;
  order: number;
  lessons: PlayerLesson[];
};

export type LessonResource = {
  id: number;
  title: string;
  url: string;
  type: string;
  file_size?: string | null;
};

export type ResourceLesson = {
  id: number;
  title: string;
  order: number;
  resources: LessonResource[];
};

export type ResourceSection = {
  id: number;
  title: string;
  order: number;
  lessons: ResourceLesson[];
};

export type ResourceCourse = {
  id: number;
  title: string;
  slug: string;
  sections: ResourceSection[];
};

export type LessonNote = {
  id: number;
  note: string;
  timestamp_seconds: number;
  created_at?: string;
};

export type LessonAnswer = {
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
  };
};

export type LessonQuestion = {
  id: number;
  question: string;
  status: "open" | "answered" | "closed";
  created_at?: string;
  user?: {
    id: number;
    name: string;
    email?: string | null;
    avatar?: string | null;
  };
  answers: LessonAnswer[];
};

export type PlayerData = {
  course: {
    id: number;
    title: string;
    slug: string;
    description?: string | null;
    instructor?: {
      id: number;
      name: string;
      avatar?: string | null;
    } | null;
    sections: PlayerSection[];
  };
  lesson: PlayerLesson & {
    content?: string | null;
    video_embed_url?: string | null;
    resources: LessonResource[];
    notes: LessonNote[];
    questions: LessonQuestion[];
  };
  watermark: {
    email?: string | null;
    name?: string | null;
  };
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  errors: unknown;
};

export function avatarUrl(path?: string | null): string | undefined {
  if (!path) return undefined;
  return imageUrl(path);
}

export const learningService = {
  async getResources() {
    const response = await get<ApiResponse<ResourceCourse[]>>("/learn/resources");
    return response.data;
  },

  async getPlayer(courseSlug: string, lessonId: string | number) {
    const response = await get<ApiResponse<PlayerData>>(
      `/learn/courses/${courseSlug}/player/${lessonId}`
    );

    return response.data;
  },

  async syncWatchTime(lessonId: string | number, watchSeconds: number) {
    const response = await put<ApiResponse<{ lesson_id: number; watch_seconds: number }>>(
      `/learn/lessons/${lessonId}/time`,
      { watch_seconds: Math.max(0, Math.floor(watchSeconds)) }
    );

    return response.data;
  },

  async markComplete(lessonId: string | number) {
    const response = await post<
      ApiResponse<{
        course_id: number;
        lesson_id: number;
        progress_percentage: number;
        is_course_completed: boolean;
      }>
    >(`/learn/lessons/${lessonId}/complete`);

    return response.data;
  },

  async addNote(lessonId: string | number, note: string, timestampSeconds: number) {
    const response = await post<ApiResponse<LessonNote>>(
      `/learn/lessons/${lessonId}/notes`,
      {
        note,
        timestamp_seconds: Math.max(0, Math.floor(timestampSeconds)),
      }
    );

    return response.data;
  },

  async deleteNote(lessonId: string | number, noteId: string | number) {
    return del<ApiResponse<null>>(`/learn/lessons/${lessonId}/notes/${noteId}`);
  },

  async addQuestion(lessonId: string | number, question: string) {
    const response = await post<ApiResponse<LessonQuestion>>(
      `/learn/lessons/${lessonId}/questions`,
      { question }
    );

    return response.data;
  },

  async addAnswer(lessonId: string | number, questionId: string | number, answer: string) {
    const response = await post<ApiResponse<LessonAnswer>>(
      `/learn/lessons/${lessonId}/questions/${questionId}/answers`,
      { answer }
    );

    return response.data;
  },
};
