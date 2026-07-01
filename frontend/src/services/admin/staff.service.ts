import { del, get, post, put } from "@/lib/api";

export type StaffRole = "admin" | "manager" | "instructor" | "content_manager";

export type StaffUser = {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  role: StaffRole | "super_admin";
  avatar?: string | null;
  bio?: string | null;
  status: boolean;
  created_at: string;
  updated_at?: string | null;
};

export type StaffPayload = {
  name: string;
  email?: string | null;
  phone?: string | null;
  role: StaffRole;
  bio?: string | null;
  status?: boolean;
  password?: string;
};

type PaginatedStaff = {
  data: StaffUser[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type StaffListResponse = {
  success: boolean;
  data: PaginatedStaff;
  message: string;
  errors: unknown;
};

type StaffMutationResponse = {
  success: boolean;
  data: {
    staff?: StaffUser;
    id?: number;
    name?: string;
    role?: StaffRole;
  } | null;
  message: string;
  errors: unknown;
};

export const staffService = {
  async list(page = 1): Promise<PaginatedStaff> {
    const response = await get<StaffListResponse>("/admin/staff", {
      params: { page },
    });

    return response.data;
  },

  async create(payload: StaffPayload): Promise<StaffMutationResponse> {
    return post<StaffMutationResponse>("/admin/staff", payload);
  },

  async update(id: number, payload: StaffPayload): Promise<StaffMutationResponse> {
    return put<StaffMutationResponse>(`/admin/staff/${id}`, payload);
  },

  async remove(id: number): Promise<StaffMutationResponse> {
    return del<StaffMutationResponse>(`/admin/staff/${id}`);
  },
};
