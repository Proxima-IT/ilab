import { get } from "@/lib/api";

export type AdminStudentProgress = {
  id: number;
  user_id: number;
  course_id: number;
  status: "active" | "expired" | "suspended" | "completed";
  progress_percentage?: number | null;
  enrolled_at?: string | null;
  student_name: string;
  student_email?: string | null;
  student_phone?: string | null;
  course_title: string;
  course_slug?: string | null;
  instructor_id: number;
  total_lessons: number;
  completed_lessons: number;
  calculated_progress: number;
  last_completed_at?: string | null;
  last_watched_at?: string | null;
};

export type AdminProgressCourse = {
  id: number;
  title: string;
  slug?: string | null;
  status?: string | null;
};

type PaginatedProgress = {
  data: AdminStudentProgress[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type ProgressCoursesResponse = {
  success: boolean;
  data: AdminProgressCourse[];
  message: string;
  errors: unknown;
};

type ProgressResponse = {
  success: boolean;
  data: PaginatedProgress;
  message: string;
  errors: unknown;
};

export const adminStudentProgressService = {
  async courses(): Promise<AdminProgressCourse[]> {
    const response = await get<ProgressCoursesResponse>("/admin/student-progress/courses");
    return response.data;
  },

  async list(search = "", status = "", courseId = ""): Promise<PaginatedProgress> {
    const response = await get<ProgressResponse>("/admin/student-progress", {
      params: {
        search: search || undefined,
        status: status || undefined,
        course_id: courseId || undefined,
        per_page: 50,
      },
    });

    return response.data;
  },
};
