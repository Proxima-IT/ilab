import { del, get, post, put } from "@/lib/api";

export type EnrollmentStatus = "active" | "completed" | "suspended" | "expired";

export type AdminEnrollment = {
  id: number;
  user_id: number;
  course_id: number;
  status: EnrollmentStatus;
  enrolled_price: string | number | null;
  progress_percentage: number | null;
  enrolled_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at?: string | null;
  student_name: string;
  student_email: string | null;
  student_phone: string | null;
  student_avatar?: string | null;
  course_title: string;
  course_slug: string;
  course_thumbnail?: string | null;
  course_price?: string | number | null;
  course_discount_price?: string | number | null;
  instructor_id?: number | null;
};

export type EnrollmentStudentOption = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar?: string | null;
  status?: boolean;
};

export type EnrollmentCourseOption = {
  id: number;
  title: string;
  slug?: string | null;
  thumbnail?: string | null;
  price: string | number;
  discount_price?: string | number | null;
  status: string;
  type?: string | null;
  instructor_name?: string | null;
};

export type EnrollmentPayload = {
  user_id: number;
  course_id: number;
  enrolled_price: number;
  status: "active" | "completed" | "suspended";
  enrolled_at?: string | null;
  expires_at?: string | null;
};

export type EnrollmentUpdatePayload = {
  status: EnrollmentStatus;
  progress_percentage?: number;
  enrolled_price?: number;
  enrolled_at?: string | null;
  expires_at?: string | null;
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

export const adminEnrollmentService = {
  async options() {
    const response = await get<
      ApiResponse<{
        students: EnrollmentStudentOption[];
        courses: EnrollmentCourseOption[];
      }>
    >("/admin/enrollments/options");

    return response.data;
  },

  async list(params: {
    page?: number;
    search?: string;
    status?: string;
    course_id?: string | number;
    user_id?: string | number;
    per_page?: number;
  }) {
    const response = await get<ApiResponse<Paginated<AdminEnrollment>>>("/admin/enrollments", {
      params: {
        page: params.page || 1,
        search: params.search || undefined,
        status: params.status && params.status !== "all" ? params.status : undefined,
        course_id: params.course_id && params.course_id !== "all" ? params.course_id : undefined,
        user_id: params.user_id || undefined,
        per_page: params.per_page || 20,
      },
    });

    return response.data;
  },

  async create(payload: EnrollmentPayload) {
    const response = await post<ApiResponse<AdminEnrollment>>("/admin/enrollments", payload);
    return response;
  },

  async update(id: number, payload: EnrollmentUpdatePayload) {
    const response = await put<ApiResponse<AdminEnrollment>>(`/admin/enrollments/${id}`, payload);
    return response;
  },

  async remove(id: number) {
    return del<ApiResponse<null>>(`/admin/enrollments/${id}`);
  },
};
