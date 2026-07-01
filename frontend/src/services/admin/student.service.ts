import { del, get, post, put } from "@/lib/api";

export type AdminStudent = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  avatar?: string | null;
  district?: string | null;
  education_level?: string | null;
  bio?: string | null;
  status: boolean;
  email_verified_at?: string | null;
  phone_verified_at?: string | null;
  enrolled_courses_count?: number;
  created_at: string;
  updated_at?: string | null;
};

export type AdminStudentPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  district?: string | null;
  education_level?: string | null;
  bio?: string | null;
  status?: boolean;
  password?: string;
};

type PaginatedStudents = {
  data: AdminStudent[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type StudentListResponse = {
  success: boolean;
  data: PaginatedStudents;
  message: string;
  errors: unknown;
};

type StudentMutationResponse = {
  success: boolean;
  data: {
    student?: AdminStudent;
  } | null;
  message: string;
  errors: unknown;
};

export const adminStudentService = {
  async list(page = 1, search = ""): Promise<PaginatedStudents> {
    const response = await get<StudentListResponse>("/admin/students", {
      params: { page, search: search || undefined },
    });

    return response.data;
  },

  async create(payload: AdminStudentPayload): Promise<StudentMutationResponse> {
    return post<StudentMutationResponse>("/admin/students", payload);
  },

  async update(id: number, payload: AdminStudentPayload): Promise<StudentMutationResponse> {
    return put<StudentMutationResponse>(`/admin/students/${id}`, payload);
  },

  async remove(id: number): Promise<StudentMutationResponse> {
    return del<StudentMutationResponse>(`/admin/students/${id}`);
  },
};
