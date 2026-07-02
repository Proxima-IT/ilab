import { del, get, post, put } from "@/lib/api";

export type AdminCoupon = {
  id: number;
  code: string;
  type: "percentage" | "fixed";
  value: string | number;
  course_id?: number | null;
  max_uses?: number | null;
  used_count: number;
  expires_at?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  course?: {
    id: number;
    title: string;
    slug?: string | null;
  } | null;
};

export type CouponCourseOption = {
  id: number;
  title: string;
  slug?: string | null;
  status?: string | null;
};

export type CouponPayload = {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  course_id?: number | null;
  max_uses?: number | null;
  expires_at: string;
  is_active: boolean;
};

type PaginatedCoupons = {
  data: AdminCoupon[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
};

type CouponListResponse = {
  success: boolean;
  data: PaginatedCoupons;
  message: string;
  errors: unknown;
};

type CouponMutationResponse = {
  success: boolean;
  data: AdminCoupon | null;
  message: string;
  errors: unknown;
};

type CouponOptionsResponse = {
  success: boolean;
  data: {
    courses: CouponCourseOption[];
  };
  message: string;
  errors: unknown;
};

export const adminCouponService = {
  async list({
    search = "",
    type = "",
    status = "",
    page = 1,
  }: {
    search?: string;
    type?: string;
    status?: string;
    page?: number;
  } = {}): Promise<PaginatedCoupons> {
    const response = await get<CouponListResponse>("/admin/coupons", {
      params: {
        search: search || undefined,
        type: type || undefined,
        status: status || undefined,
        page,
        per_page: 50,
      },
    });

    return response.data;
  },

  async options(): Promise<CouponOptionsResponse["data"]> {
    const response = await get<CouponOptionsResponse>("/admin/coupons/options");
    return response.data;
  },

  async create(payload: CouponPayload): Promise<CouponMutationResponse> {
    return post<CouponMutationResponse>("/admin/coupons", payload);
  },

  async update(id: number, payload: CouponPayload): Promise<CouponMutationResponse> {
    return put<CouponMutationResponse>(`/admin/coupons/${id}`, payload);
  },

  async remove(id: number): Promise<CouponMutationResponse> {
    return del<CouponMutationResponse>(`/admin/coupons/${id}`);
  },
};
