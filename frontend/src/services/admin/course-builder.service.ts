import { del, get, post, put, upload } from "@/lib/api";

export type AdminCourseOption = {
  id: number;
  name?: string;
  title?: string;
  slug?: string;
  email?: string | null;
  role?: string;
};

export type AdminLessonResource = {
  id: number;
  lesson_id: number;
  title: string;
  url: string;
  type: "google_drive" | "pdf" | "doc" | "sheet" | "slide" | "zip" | "link";
  file_size?: string | null;
  order: number;
  is_active: boolean;
};

export type AdminLesson = {
  id: number;
  section_id: number;
  title: string;
  type: "video" | "pdf" | "quiz" | "live_session" | "text";
  video_url?: string | null;
  content?: string | null;
  live_link?: string | null;
  live_start_time?: string | null;
  duration?: number | null;
  is_free: boolean;
  order: number;
  resources?: AdminLessonResource[];
};

export type AdminSection = {
  id: number;
  course_id: number;
  title: string;
  order: number;
  unlock_at?: string | null;
  lessons?: AdminLesson[];
};

export type AdminCourse = {
  id: number;
  title: string;
  slug: string;
  category_id: number;
  instructor_id: number;
  description: string;
  thumbnail?: string | null;
  intro_video?: string | null;
  price: string | number;
  discount_price?: string | number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  status: "draft" | "published" | "archived";
  is_featured: boolean;
  type: "self_paced" | "batch" | "free";
  level: "beginner" | "intermediate" | "advanced";
  language?: string | null;
  tags?: string[] | null;
  prerequisites?: string[] | null;
  learning_outcomes?: string[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
  enrollments_count?: number;
  category?: { id: number; name: string; slug: string } | null;
  instructor?: { id: number; name: string; email?: string | null; role?: string } | null;
  sections?: AdminSection[];
};

export type CoursePayload = {
  title: string;
  category_id: number;
  instructor_id?: number | null;
  description: string;
  thumbnail?: string | null;
  intro_video?: string | null;
  price: number;
  discount_price?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  status: string;
  is_featured: boolean;
  type: string;
  level: string;
  language?: string | null;
  tags?: string[] | null;
  prerequisites?: string[] | null;
  learning_outcomes?: string[] | null;
  meta_title?: string | null;
  meta_description?: string | null;
};

type Paginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ApiResponse<T> = {
  success: boolean;
  data: T;
  message: string;
  errors: unknown;
};

type ThumbnailUploadResponse = ApiResponse<{
  thumbnail: string;
}>;

function uploadedThumbnailPath(response: ThumbnailUploadResponse): string {
  const thumbnail = response.data?.thumbnail?.trim();

  if (!thumbnail || thumbnail.replace(/^\/+|\/+$/g, "") === "storage") {
    throw new Error("Thumbnail uploaded, but the server did not return the image path.");
  }

  return thumbnail;
}

export const adminCourseBuilderService = {
  async options() {
    const response = await get<ApiResponse<{ categories: AdminCourseOption[]; instructors: AdminCourseOption[] }>>(
      "/admin/courses/options"
    );
    return response.data;
  },

  async list(search = "", status = "") {
    const response = await get<ApiResponse<Paginated<AdminCourse>>>("/admin/courses", {
      params: { search: search || undefined, status: status || undefined, per_page: 50 },
    });
    return response.data;
  },

  async show(id: number) {
    const response = await get<ApiResponse<AdminCourse>>(`/admin/courses/${id}`);
    return response.data;
  },

  async create(payload: CoursePayload) {
    const response = await post<ApiResponse<AdminCourse>>("/admin/courses", payload);
    return response.data;
  },

  async update(id: number, payload: CoursePayload) {
    const response = await put<ApiResponse<AdminCourse>>(`/admin/courses/${id}`, payload);
    return response.data;
  },

  async removeCourse(id: number) {
    return del<ApiResponse<null>>(`/admin/courses/${id}`);
  },

  async uploadThumbnail(file: File, oldThumbnail?: string | null) {
    const formData = new FormData();
    formData.append("thumbnail", file);

    if (oldThumbnail) {
      formData.append("old_thumbnail", oldThumbnail);
    }

    const response = await upload<ThumbnailUploadResponse>("/admin/courses/thumbnail", formData);
    return uploadedThumbnailPath(response);
  },

  async createSection(payload: { course_id: number; title: string; order?: number; unlock_at?: string | null }) {
    const response = await post<ApiResponse<AdminSection>>("/admin/sections", payload);
    return response.data;
  },

  async updateSection(id: number, payload: { title: string; order?: number; unlock_at?: string | null }) {
    const response = await put<ApiResponse<AdminSection>>(`/admin/sections/${id}`, payload);
    return response.data;
  },

  async removeSection(id: number) {
    return del<ApiResponse<null>>(`/admin/sections/${id}`);
  },

  async createLesson(payload: Partial<AdminLesson> & { section_id: number; title: string; type: string }) {
    const response = await post<ApiResponse<AdminLesson>>("/admin/lessons", payload);
    return response.data;
  },

  async updateLesson(id: number, payload: Partial<AdminLesson> & { title: string; type: string }) {
    const response = await put<ApiResponse<AdminLesson>>(`/admin/lessons/${id}`, payload);
    return response.data;
  },

  async removeLesson(id: number) {
    return del<ApiResponse<null>>(`/admin/lessons/${id}`);
  },

  async createResource(payload: Omit<AdminLessonResource, "id">) {
    const response = await post<ApiResponse<AdminLessonResource>>("/admin/lesson-resources", payload);
    return response.data;
  },

  async updateResource(id: number, payload: Omit<AdminLessonResource, "id" | "lesson_id">) {
    const response = await put<ApiResponse<AdminLessonResource>>(`/admin/lesson-resources/${id}`, payload);
    return response.data;
  },

  async removeResource(id: number) {
    return del<ApiResponse<null>>(`/admin/lesson-resources/${id}`);
  },
};
