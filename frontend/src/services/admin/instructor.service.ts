import { del, get, post, put, upload } from "@/lib/api";

export type AdminInstructor = {
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
  courses_count?: number;
  students_count?: number;
  created_at: string;
  updated_at?: string | null;
};

export type AdminInstructorPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  avatar?: string | null;
  district?: string | null;
  education_level?: string | null;
  bio?: string | null;
  status?: boolean;
  password?: string;
};

type PaginatedInstructors = {
  data: AdminInstructor[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type InstructorListResponse = {
  success: boolean;
  data: PaginatedInstructors;
  message: string;
  errors: unknown;
};

type InstructorMutationResponse = {
  success: boolean;
  data: {
    instructor?: AdminInstructor;
    avatar?: string;
  } | null;
  message: string;
  errors: unknown;
};

export const adminInstructorService = {
  async list(page = 1, search = ""): Promise<PaginatedInstructors> {
    const response = await get<InstructorListResponse>("/admin/instructors", {
      params: { page, search: search || undefined },
    });

    return response.data;
  },

  async create(payload: AdminInstructorPayload): Promise<InstructorMutationResponse> {
    return post<InstructorMutationResponse>("/admin/instructors", payload);
  },

  async update(id: number, payload: AdminInstructorPayload): Promise<InstructorMutationResponse> {
    return put<InstructorMutationResponse>(`/admin/instructors/${id}`, payload);
  },

  async remove(id: number): Promise<InstructorMutationResponse> {
    return del<InstructorMutationResponse>(`/admin/instructors/${id}`);
  },

  async uploadAvatar(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("avatar", file);

    const response = await upload<InstructorMutationResponse>("/admin/instructors/avatar", formData);
    return response.data?.avatar || "";
  },
};
